import { getFirestore, Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/scheduler';
import { FUNCTION_OPTIONS } from '../options';
import { isInQuietHours, type QuietHours } from './quietHours';
import { NUDGE_TEXTS, nudgeLanguageOf, type NudgeLanguage } from './texts';

/** Hosting origin: notification clicks need an absolute HTTPS link. */
const APP_ORIGIN = 'https://league-of-maybes.web.app';

/** Mirrors PATHS.PLAYER_CHAT in the web app, plus the ?nudge=1 flag the chat tab reacts to. */
const nudgeLinkPath = (playerId: string) => `/roster/${encodeURIComponent(playerId)}/chat?nudge=1`;

/** FCM errors that mean the token is gone for good; its device doc is deleted. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/** The fields of settings/chat this job reads; a missing doc or field means the app's defaults. */
interface NudgeSettings {
  nudgesEnabled: boolean;
  quietHours: QuietHours;
  timeZone: string;
}

const DEFAULT_QUIET_HOURS: QuietHours = { start: '22:00', end: '09:00' };

const readSettings = (data: FirebaseFirestore.DocumentData | undefined): NudgeSettings => ({
  nudgesEnabled: data?.nudgesEnabled === true,
  quietHours: { ...DEFAULT_QUIET_HOURS, ...data?.quietHours },
  // The client stores the browser zone whenever nudges are turned on.
  timeZone: data?.timeZone || 'UTC',
});

interface Device {
  id: string;
  token: string;
  language: NudgeLanguage;
}

type Outcome = 'sent' | 'retry' | 'noDevices';

/** Sends one nudge for `playerId` to every device, grouped by language. Deletes dead tokens. */
const sendToDevices = async (
  uid: string,
  playerId: string,
  devices: Device[],
): Promise<Outcome> => {
  if (devices.length === 0) return 'noDevices';

  const db = getFirestore();
  const path = nudgeLinkPath(playerId);
  let delivered = 0;
  let transientFailures = 0;

  for (const language of new Set(devices.map((device) => device.language))) {
    const group = devices.filter((device) => device.language === language);
    const { title, body } = NUDGE_TEXTS[language];
    const message: MulticastMessage = {
      tokens: group.map((device) => device.token),
      notification: { title, body },
      data: { playerId, link: path },
      webpush: {
        notification: { icon: '/icon-192.png', tag: `nudge-${playerId}` },
        // Opened by the FCM SDK in the service worker when the notification is clicked.
        fcmOptions: { link: `${APP_ORIGIN}${path}` },
      },
    };
    const response = await getMessaging().sendEachForMulticast(message);
    delivered += response.successCount;

    await Promise.all(
      response.responses.map(async (result, index) => {
        if (result.success) return;
        const code = result.error?.code ?? '';
        if (DEAD_TOKEN_CODES.has(code)) {
          await db.doc(`users/${uid}/devices/${group[index].id}`).delete();
        } else {
          transientFailures += 1;
          logger.warn('Nudge not delivered', { code, message: result.error?.message });
        }
      }),
    );
  }

  // Nothing arrived and at least one failure may pass: keep the nudge for the next run.
  return delivered === 0 && transientFailures > 0 ? 'retry' : 'sent';
};

/** Clears the nudge unless the chat state changed since it was read (the user logged a message). */
const finish = async (state: QueryDocumentSnapshot, nudgedAt: Timestamp | null) => {
  try {
    await state.ref.update(nudgedAt ? { nextNudgeAt: null, nudgedAt } : { nextNudgeAt: null }, {
      lastUpdateTime: state.updateTime,
    });
  } catch (error) {
    logger.info('Chat state changed during the run; left as is', { path: state.ref.path, error });
  }
};

/** Handles the due chat states of one user. */
const nudgeUser = async (uid: string, states: QueryDocumentSnapshot[], now: Date) => {
  const db = getFirestore();
  const userRef = db.doc(`users/${uid}`);
  const settings = readSettings((await userRef.collection('settings').doc('chat').get()).data());

  if (!settings.nudgesEnabled) return;
  // Quiet hours: nextNudgeAt stays, so the first run after the window sends it.
  if (isInQuietHours(now, settings.quietHours, settings.timeZone)) return;

  const devices: Device[] = (await userRef.collection('devices').get()).docs.map((doc) => ({
    id: doc.id,
    token: String(doc.get('token') ?? ''),
    language: nudgeLanguageOf(doc.get('language')),
  }));
  const liveDevices = devices.filter((device) => device.token !== '');

  for (const state of states) {
    const playerId = state.id;
    const player = await userRef.collection('players').doc(playerId).get();
    if (!player.exists || player.get('status') === 'retired') {
      await finish(state, null);
      continue;
    }

    const outcome = await sendToDevices(uid, playerId, liveDevices);
    if (outcome === 'sent') await finish(state, Timestamp.fromDate(now));
    // No device to reach: drop the nudge rather than retrying it every hour.
    if (outcome === 'noDevices') await finish(state, null);
  }
};

/**
 * Every hour: finds chat states whose nextNudgeAt has passed and sends a push to the owner's
 * devices, unless nudges are off, it's their quiet hours, or the player is retired.
 */
export const sendNudges = onSchedule(
  { ...FUNCTION_OPTIONS, schedule: 'every 60 minutes', timeZone: 'Etc/UTC' },
  async () => {
    const now = new Date();
    const due = await getFirestore()
      .collectionGroup('chatStates')
      .where('nextNudgeAt', '<=', Timestamp.fromDate(now))
      .get();

    // users/{uid}/chatStates/{playerId}: group the states by owner.
    const byUser = new Map<string, QueryDocumentSnapshot[]>();
    for (const state of due.docs) {
      const uid = state.ref.parent.parent?.id;
      if (!uid) continue;
      byUser.set(uid, [...(byUser.get(uid) ?? []), state]);
    }

    for (const [uid, states] of byUser) {
      try {
        await nudgeUser(uid, states, now);
      } catch (error) {
        // One user's failure must not stop the others.
        logger.error('Nudging a user failed', { uid, error });
      }
    }
    logger.info('Nudge run done', { due: due.size, users: byUser.size });
  },
);
