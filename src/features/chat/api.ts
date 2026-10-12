import { limit, orderBy, where } from 'firebase/firestore';
import {
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  setDocument,
  subscribeToCollection,
  subscribeToDocument,
  userPath,
} from '../../firebase/firestore';
import type { BaseDocument } from '../../types';
import { generateJson } from '../../firebase/ai';
import { api } from '../../store/api';
import { requireUid, runQuery, syncWhileCached } from '../../store/realtime';
import { buildOpenersPrompt, OPENERS_SCHEMA } from './openers';
import {
  CHAT_NOTES_COLLECTION,
  CHAT_PROFILES_COLLECTION,
  CHAT_SETTINGS_ID,
  CHAT_STATES_COLLECTION,
  deviceIdOf,
  DEVICES_COLLECTION,
  INTEL_COLLECTION,
  KEY_NOTES_COLLECTION,
  PLAYERS_COLLECTION,
  SETTINGS_COLLECTION,
  type BriefContext,
  type ChatNote,
  type ChatNoteInput,
  type ChatProfile,
  type ChatProfileInput,
  type ChatSettings,
  type ChatSettingsInput,
  type ChatState,
  type ChatStateWrite,
  type Device,
  type Opener,
  type Sender,
} from './types';

const profilesPath = (uid: string) => userPath(uid, CHAT_PROFILES_COLLECTION);
const notesPath = (uid: string) => userPath(uid, CHAT_NOTES_COLLECTION);
const statesPath = (uid: string) => userPath(uid, CHAT_STATES_COLLECTION);
const settingsPath = (uid: string) => userPath(uid, SETTINGS_COLLECTION);

interface NotesArg {
  playerId: string;
  limit: number;
}

const playerNotesConstraints = ({ playerId, limit: max }: NotesArg) => [
  where('playerId', '==', playerId),
  orderBy('createdAt', 'desc'),
  limit(max),
];

/** Read-only shapes of the other features' documents used by the brief and openers. */
interface NoteRef extends BaseDocument {
  category: string;
  text: string;
}
interface PlayerNameRef extends BaseDocument {
  nickname: string;
}

/** Nickname, pinned key notes and the latest 10 intel entries of a player (read-only). */
const loadBriefContext = async (uid: string, playerId: string): Promise<BriefContext> => {
  const [player, pinned, intel] = await Promise.all([
    getDocument<PlayerNameRef>(userPath(uid, PLAYERS_COLLECTION), playerId),
    getDocuments<NoteRef>(
      userPath(uid, KEY_NOTES_COLLECTION),
      where('playerId', '==', playerId),
      where('pinned', '==', true),
      orderBy('importance', 'desc'),
    ),
    getDocuments<NoteRef>(
      userPath(uid, INTEL_COLLECTION),
      where('playerId', '==', playerId),
      orderBy('createdAt', 'desc'),
      limit(10),
    ),
  ]);
  const pick = ({ category, text }: NoteRef) => ({ category, text });
  return {
    nickname: player?.nickname ?? '',
    pinnedNotes: pinned.map(pick),
    intel: intel.map(pick),
  };
};

const chatApi = api.injectEndpoints({
  endpoints: (build) => ({
    chatGetChatProfile: build.query<ChatProfile | null, string>({
      queryFn: (playerId, { getState }) =>
        runQuery(() => getDocument<ChatProfile>(profilesPath(requireUid(getState)), playerId)),
      onCacheEntryAdded: (playerId, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToDocument<ChatProfile>(
              profilesPath(requireUid(lifecycle.getState)),
              playerId,
              (profile) => lifecycle.updateCachedData(() => profile),
            ),
          lifecycle,
        ),
    }),
    /** Upsert: merges the given fields into chatProfiles/{playerId}. */
    chatSetChatProfile: build.mutation<
      null,
      { playerId: string; changes: Partial<ChatProfileInput> }
    >({
      queryFn: ({ playerId, changes }, { getState }) =>
        runQuery(async () => {
          await setDocument<ChatProfile>(profilesPath(requireUid(getState)), playerId, changes, {
            merge: true,
          });
          return null;
        }),
    }),

    chatGetChatNotes: build.query<ChatNote[], NotesArg>({
      queryFn: (arg, { getState }) =>
        runQuery(() =>
          getDocuments<ChatNote>(notesPath(requireUid(getState)), ...playerNotesConstraints(arg)),
        ),
      onCacheEntryAdded: (arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<ChatNote>(
              notesPath(requireUid(lifecycle.getState)),
              playerNotesConstraints(arg),
              (notes) => lifecycle.updateCachedData(() => notes),
            ),
          lifecycle,
        ),
    }),
    chatAddChatNote: build.mutation<string, ChatNoteInput>({
      queryFn: (input, { getState }) =>
        runQuery(() => createDocument<ChatNote>(notesPath(requireUid(getState)), input)),
    }),
    chatDeleteChatNote: build.mutation<null, string>({
      queryFn: (noteId, { getState }) =>
        runQuery(async () => {
          await deleteDocument(notesPath(requireUid(getState)), noteId);
          return null;
        }),
    }),

    chatGetChatState: build.query<ChatState | null, string>({
      queryFn: (playerId, { getState }) =>
        runQuery(() => getDocument<ChatState>(statesPath(requireUid(getState)), playerId)),
      onCacheEntryAdded: (playerId, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToDocument<ChatState>(
              statesPath(requireUid(lifecycle.getState)),
              playerId,
              (state) => lifecycle.updateCachedData(() => state),
            ),
          lifecycle,
        ),
    }),
    /**
     * Logs who wrote last ("I replied" / "They replied") and schedules the next nudge
     * `resumeAfterHours` later. Times are written as Dates so Firestore stores Timestamps.
     */
    chatLogMessage: build.mutation<
      null,
      {
        playerId: string;
        sender: Sender;
        at: number;
        resumeAfterHours: number;
        previous: ChatState | null;
      }
    >({
      queryFn: ({ playerId, sender, at, resumeAfterHours, previous }, { getState }) =>
        runQuery(async () => {
          const toDate = (millis: number | null | undefined) =>
            millis != null ? new Date(millis) : null;
          await setDocument<ChatStateWrite>(
            statesPath(requireUid(getState)),
            playerId,
            {
              playerId,
              lastSender: sender,
              lastInboundAt: sender === 'them' ? new Date(at) : toDate(previous?.lastInboundAt),
              lastOutboundAt: sender === 'me' ? new Date(at) : toDate(previous?.lastOutboundAt),
              nextNudgeAt: new Date(at + resumeAfterHours * 3_600_000),
              nudgedAt: null,
              stateUpdatedAt: new Date(),
            },
            { merge: true },
          );
          return null;
        }),
    }),

    /** The stored settings doc, or null. Use `withDefaults` (via useChatSettings) to read it. */
    chatGetChatSettings: build.query<ChatSettings | null, void>({
      queryFn: (_arg, { getState }) =>
        runQuery(() =>
          getDocument<ChatSettings>(settingsPath(requireUid(getState)), CHAT_SETTINGS_ID),
        ),
      onCacheEntryAdded: (_arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToDocument<ChatSettings>(
              settingsPath(requireUid(lifecycle.getState)),
              CHAT_SETTINGS_ID,
              (settings) => lifecycle.updateCachedData(() => settings),
            ),
          lifecycle,
        ),
    }),
    /** Upsert of settings/chat; the doc is written on the first save only. */
    chatSetChatSettings: build.mutation<null, Partial<ChatSettingsInput>>({
      queryFn: (changes, { getState }) =>
        runQuery(async () => {
          await setDocument<ChatSettings>(
            settingsPath(requireUid(getState)),
            CHAT_SETTINGS_ID,
            changes,
            {
              merge: true,
            },
          );
          return null;
        }),
    }),

    /**
     * Read-only context for the AI brief: nickname, pinned key notes and the latest 10 intel
     * entries. Fetched on demand when the user copies the brief.
     */
    chatGetBriefContext: build.query<BriefContext, string>({
      queryFn: (playerId, { getState }) =>
        runQuery(() => loadBriefContext(requireUid(getState), playerId)),
      keepUnusedDataFor: 0,
    }),

    /**
     * Asks Gemini (Firebase AI Logic, with App Check) for 2–3 openers. Sends only the brief
     * context, the chat profile, state and style. The answer is not stored.
     */
    chatGenerateOpeners: build.mutation<
      Opener[],
      Omit<Parameters<typeof buildOpenersPrompt>[0], 'context' | 'now'> & { playerId: string }
    >({
      queryFn: ({ playerId, ...input }, { getState }) =>
        runQuery(async () => {
          const context = await loadBriefContext(requireUid(getState), playerId);
          const prompt = buildOpenersPrompt({ ...input, context, now: new Date() });
          const { openers } = await generateJson<{ openers: Opener[] }>(prompt, OPENERS_SCHEMA);
          return openers.filter((opener) => opener.text?.trim()).slice(0, 3);
        }),
    }),

    /** Saves this browser's push token; the doc id is its SHA-256, so it is an upsert. */
    chatRegisterDevice: build.mutation<string, { token: string; language: string }>({
      queryFn: ({ token, language }, { getState }) =>
        runQuery(async () => {
          const deviceId = await deviceIdOf(token);
          await setDocument<Device>(
            userPath(requireUid(getState), DEVICES_COLLECTION),
            deviceId,
            { token, language, userAgent: navigator.userAgent },
            { merge: true },
          );
          return deviceId;
        }),
    }),
    chatRemoveDevice: build.mutation<null, string>({
      queryFn: (deviceId, { getState }) =>
        runQuery(async () => {
          await deleteDocument(userPath(requireUid(getState), DEVICES_COLLECTION), deviceId);
          return null;
        }),
    }),
  }),
});

export const {
  useChatGetChatProfileQuery,
  useChatSetChatProfileMutation,
  useChatGetChatNotesQuery,
  useChatAddChatNoteMutation,
  useChatDeleteChatNoteMutation,
  useChatGetChatStateQuery,
  useChatLogMessageMutation,
  useChatGetChatSettingsQuery,
  useChatSetChatSettingsMutation,
  useLazyChatGetBriefContextQuery,
  useChatGenerateOpenersMutation,
  useChatRegisterDeviceMutation,
  useChatRemoveDeviceMutation,
} = chatApi;
