import { orderBy, where } from 'firebase/firestore';
import {
  createDocument,
  deleteDocument,
  getDocument,
  getDocuments,
  runBatch,
  setDocument,
  subscribeToCollection,
  subscribeToDocument,
  updateDocument,
  userPath,
  type BatchOperation,
} from '../../firebase/firestore';
import { api } from '../../store/api';
import { requireUid, runQuery, syncWhileCached } from '../../store/realtime';
import { getPhaseInfo, sortStarts, summarizeNotes } from './phase';
import {
  CYCLE_NOTES_COLLECTION,
  CYCLE_PROFILES_COLLECTION,
  DEFAULT_PROFILE,
  MAX_PERIOD_STARTS,
  PERSONAL_SETTINGS_ID,
  SETTINGS_COLLECTION,
  type CycleNote,
  type CycleNoteValues,
  type CycleProfile,
  type CycleProfileInput,
  type PersonalSettings,
  type PersonalSettingsInput,
} from './types';

const profilesPath = (uid: string) => userPath(uid, CYCLE_PROFILES_COLLECTION);
const notesPath = (uid: string) => userPath(uid, CYCLE_NOTES_COLLECTION);
const settingsPath = (uid: string) => userPath(uid, SETTINGS_COLLECTION);

/** Firestore allows 500 writes per batch. */
const BATCH_SIZE = 450;

const subjectNotesConstraints = (subjectId: string) => [
  where('playerId', '==', subjectId),
  orderBy('date', 'desc'),
];

const loadProfile = async (uid: string, subjectId: string): Promise<CycleProfileInput> => {
  const stored = await getDocument<CycleProfile>(profilesPath(uid), subjectId);
  return { ...DEFAULT_PROFILE, ...stored };
};

const phaseFields = (profile: CycleProfileInput, date: string) => {
  const info = getPhaseInfo(profile, date);
  return { phase: info?.phase ?? null, cycleDay: info?.cycleDay ?? null };
};

/**
 * Brings the subject's notes in line with the profile (phases move when period starts change) and
 * stores the per-phase summaries the badges show.
 */
const syncNotes = async (uid: string, subjectId: string, profile: CycleProfileInput) => {
  const notes = await getDocuments<CycleNote>(notesPath(uid), where('playerId', '==', subjectId));
  const updates: BatchOperation[] = [];
  const synced = notes.map((note) => {
    const fields = phaseFields(profile, note.date);
    if (fields.phase !== note.phase || fields.cycleDay !== note.cycleDay) {
      updates.push({ type: 'update', path: notesPath(uid), id: note.id, data: fields });
    }
    return { ...note, ...fields };
  });
  for (let index = 0; index < updates.length; index += BATCH_SIZE) {
    await runBatch(updates.slice(index, index + BATCH_SIZE));
  }
  await setDocument<CycleProfile>(
    profilesPath(uid),
    subjectId,
    { phaseSummaries: summarizeNotes(synced) },
    { merge: true },
  );
};

const cycleApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Every cycle profile, for the phase badges (one listener for the whole League Table). */
    cycleGetProfiles: build.query<CycleProfile[], void>({
      queryFn: (_arg, { getState }) =>
        runQuery(() => getDocuments<CycleProfile>(profilesPath(requireUid(getState)))),
      onCacheEntryAdded: (_arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<CycleProfile>(
              profilesPath(requireUid(lifecycle.getState)),
              [],
              (profiles) => lifecycle.updateCachedData(() => profiles),
            ),
          lifecycle,
        ),
    }),
    cycleGetProfile: build.query<CycleProfile | null, string>({
      queryFn: (subjectId, { getState }) =>
        runQuery(() => getDocument<CycleProfile>(profilesPath(requireUid(getState)), subjectId)),
      onCacheEntryAdded: (subjectId, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToDocument<CycleProfile>(
              profilesPath(requireUid(lifecycle.getState)),
              subjectId,
              (profile) => lifecycle.updateCachedData(() => profile),
            ),
          lifecycle,
        ),
    }),
    /** Upserts the cycle data, then moves the notes to their (possibly new) phases. */
    cycleSaveProfile: build.mutation<
      null,
      { subjectId: string; changes: Omit<CycleProfileInput, 'phaseSummaries'> }
    >({
      queryFn: ({ subjectId, changes }, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          const profile = {
            ...changes,
            periodStarts: sortStarts(changes.periodStarts).slice(0, MAX_PERIOD_STARTS),
          };
          await setDocument<CycleProfile>(profilesPath(uid), subjectId, profile, { merge: true });
          await syncNotes(uid, subjectId, profile);
          return null;
        }),
    }),

    cycleGetNotes: build.query<CycleNote[], string>({
      queryFn: (subjectId, { getState }) =>
        runQuery(() =>
          getDocuments<CycleNote>(
            notesPath(requireUid(getState)),
            ...subjectNotesConstraints(subjectId),
          ),
        ),
      onCacheEntryAdded: (subjectId, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<CycleNote>(
              notesPath(requireUid(lifecycle.getState)),
              subjectNotesConstraints(subjectId),
              (notes) => lifecycle.updateCachedData(() => notes),
            ),
          lifecycle,
        ),
    }),
    cycleCreateNote: build.mutation<null, { subjectId: string; values: CycleNoteValues }>({
      queryFn: ({ subjectId, values }, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          const profile = await loadProfile(uid, subjectId);
          await createDocument<CycleNote>(notesPath(uid), {
            playerId: subjectId,
            ...values,
            ...phaseFields(profile, values.date),
          });
          await syncNotes(uid, subjectId, profile);
          return null;
        }),
    }),
    cycleUpdateNote: build.mutation<
      null,
      { subjectId: string; noteId: string; values: CycleNoteValues }
    >({
      queryFn: ({ subjectId, noteId, values }, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          const profile = await loadProfile(uid, subjectId);
          await updateDocument<CycleNote>(notesPath(uid), noteId, {
            ...values,
            ...phaseFields(profile, values.date),
          });
          await syncNotes(uid, subjectId, profile);
          return null;
        }),
    }),
    cycleDeleteNote: build.mutation<null, { subjectId: string; noteId: string }>({
      queryFn: ({ subjectId, noteId }, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          await deleteDocument(notesPath(uid), noteId);
          await syncNotes(uid, subjectId, await loadProfile(uid, subjectId));
          return null;
        }),
    }),

    cycleGetPersonalSettings: build.query<PersonalSettings | null, void>({
      queryFn: (_arg, { getState }) =>
        runQuery(() =>
          getDocument<PersonalSettings>(settingsPath(requireUid(getState)), PERSONAL_SETTINGS_ID),
        ),
      onCacheEntryAdded: (_arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToDocument<PersonalSettings>(
              settingsPath(requireUid(lifecycle.getState)),
              PERSONAL_SETTINGS_ID,
              (settings) => lifecycle.updateCachedData(() => settings),
            ),
          lifecycle,
        ),
    }),
    cycleSavePersonalSettings: build.mutation<null, Partial<PersonalSettingsInput>>({
      queryFn: (changes, { getState }) =>
        runQuery(async () => {
          await setDocument<PersonalSettings>(
            settingsPath(requireUid(getState)),
            PERSONAL_SETTINGS_ID,
            changes,
            { merge: true },
          );
          return null;
        }),
    }),
  }),
});

export const {
  useCycleGetProfilesQuery,
  useCycleGetProfileQuery,
  useCycleSaveProfileMutation,
  useCycleGetNotesQuery,
  useCycleCreateNoteMutation,
  useCycleUpdateNoteMutation,
  useCycleDeleteNoteMutation,
  useCycleGetPersonalSettingsQuery,
  useCycleSavePersonalSettingsMutation,
} = cycleApi;
