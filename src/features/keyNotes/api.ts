import { limit, orderBy, where } from 'firebase/firestore';
import {
  createDocument,
  deleteDocument,
  getDocuments,
  subscribeToCollection,
  updateDocument,
  userPath,
} from '../../firebase/firestore';
import { api } from '../../store/api';
import { requireUid, runQuery, syncWhileCached } from '../../store/realtime';
import { KEY_NOTES_COLLECTION, type KeyNote, type KeyNoteInput, type KeyNoteValues } from './types';

const keyNotesPath = (uid: string) => userPath(uid, KEY_NOTES_COLLECTION);

interface KeyNotesArg {
  playerId: string;
  limit: number;
}

// Pinned first, then by importance. Needs the composite index in firestore.indexes.json.
const playerKeyNotesConstraints = ({ playerId, limit: max }: KeyNotesArg) => [
  where('playerId', '==', playerId),
  orderBy('pinned', 'desc'),
  orderBy('importance', 'desc'),
  limit(max),
];

const keyNotesApi = api.injectEndpoints({
  endpoints: (build) => ({
    keyNotesGetKeyNotes: build.query<KeyNote[], KeyNotesArg>({
      queryFn: (arg, { getState }) =>
        runQuery(() =>
          getDocuments<KeyNote>(
            keyNotesPath(requireUid(getState)),
            ...playerKeyNotesConstraints(arg),
          ),
        ),
      onCacheEntryAdded: (arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<KeyNote>(
              keyNotesPath(requireUid(lifecycle.getState)),
              playerKeyNotesConstraints(arg),
              (notes) => lifecycle.updateCachedData(() => notes),
            ),
          lifecycle,
        ),
    }),
    keyNotesCreateKeyNote: build.mutation<string, KeyNoteInput>({
      queryFn: (input, { getState }) =>
        runQuery(() => createDocument<KeyNote>(keyNotesPath(requireUid(getState)), input)),
    }),
    keyNotesUpdateKeyNote: build.mutation<null, { noteId: string; changes: KeyNoteValues }>({
      queryFn: ({ noteId, changes }, { getState }) =>
        runQuery(async () => {
          await updateDocument<KeyNote>(keyNotesPath(requireUid(getState)), noteId, changes);
          return null;
        }),
    }),
    keyNotesToggleKeyNotePin: build.mutation<null, { noteId: string; pinned: boolean }>({
      queryFn: ({ noteId, pinned }, { getState }) =>
        runQuery(async () => {
          await updateDocument<KeyNote>(keyNotesPath(requireUid(getState)), noteId, { pinned });
          return null;
        }),
    }),
    keyNotesDeleteKeyNote: build.mutation<null, string>({
      queryFn: (noteId, { getState }) =>
        runQuery(async () => {
          await deleteDocument(keyNotesPath(requireUid(getState)), noteId);
          return null;
        }),
    }),
  }),
});

export const {
  useKeyNotesGetKeyNotesQuery,
  useKeyNotesCreateKeyNoteMutation,
  useKeyNotesUpdateKeyNoteMutation,
  useKeyNotesToggleKeyNotePinMutation,
  useKeyNotesDeleteKeyNoteMutation,
} = keyNotesApi;
