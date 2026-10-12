import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging';
import { app } from './config';

/** Public web push key (VAPID) from Project settings → Cloud Messaging → Web Push certificates. */
const VAPID_KEY =
  'BH2bnb7pv0Pd-MXK9XjHiYCZlue8DgGlcDkBenGwnxj8nLfaxBGdci97-22yB7-bJS1AErGHDlf0IAKGfNFAMeU';

/** The messaging service worker in public/; it also handles notification clicks. */
const SERVICE_WORKER_URL = '/firebase-messaging-sw.js';

export type PushSupport = 'supported' | 'unsupported' | 'denied';

/** Whether this browser can receive web push at all (iOS: only when installed as an app). */
export const getPushSupport = async (): Promise<PushSupport> => {
  if (!(await isSupported())) return 'unsupported';
  return Notification.permission === 'denied' ? 'denied' : 'supported';
};

const registerServiceWorker = () =>
  navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' });

/**
 * Asks for notification permission (call only from a user click) and returns the FCM token,
 * or null when permission is not granted or push is unsupported.
 */
export const requestPushToken = async (): Promise<string | null> => {
  if (!(await isSupported())) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const serviceWorkerRegistration = await registerServiceWorker();
  return getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration });
};

/** Deletes this browser's FCM token (when nudges are turned off). */
export const deletePushToken = async (): Promise<void> => {
  if (!(await isSupported())) return;
  await deleteToken(getMessaging(app));
};

/** Calls `callback` for pushes that arrive while the app is open and focused. */
export const onForegroundMessage = (callback: (payload: MessagePayload) => void) => {
  let unsubscribe: (() => void) | undefined;
  let cancelled = false;
  void isSupported().then((supported) => {
    if (supported && !cancelled) unsubscribe = onMessage(getMessaging(app), callback);
  });
  return () => {
    cancelled = true;
    unsubscribe?.();
  };
};
