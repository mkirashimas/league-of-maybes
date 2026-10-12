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
import { INTEL_COLLECTION, type IntelEntry, type IntelInput } from './types';

const intelPath = (uid: string) => userPath(uid, INTEL_COLLECTION);

interface IntelArg {
  playerId: string;
  limit: number;
}

const playerIntelConstraints = ({ playerId, limit: max }: IntelArg) => [
  where('playerId', '==', playerId),
  orderBy('createdAt', 'desc'),
  limit(max),
];

// The list is realtime: adding or editing shows up at once, and "Load more" raises `limit`.
const intelApi = api.injectEndpoints({
  endpoints: (build) => ({
    intelGetIntel: build.query<IntelEntry[], IntelArg>({
      queryFn: (arg, { getState }) =>
        runQuery(() =>
          getDocuments<IntelEntry>(intelPath(requireUid(getState)), ...playerIntelConstraints(arg)),
        ),
      onCacheEntryAdded: (arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<IntelEntry>(
              intelPath(requireUid(lifecycle.getState)),
              playerIntelConstraints(arg),
              (entries) => lifecycle.updateCachedData(() => entries),
            ),
          lifecycle,
        ),
    }),
    intelAddIntel: build.mutation<string, IntelInput>({
      queryFn: (input, { getState }) =>
        runQuery(() => createDocument<IntelEntry>(intelPath(requireUid(getState)), input)),
    }),
    intelUpdateIntel: build.mutation<
      null,
      { entryId: string; changes: Pick<IntelInput, 'category' | 'text'> }
    >({
      queryFn: ({ entryId, changes }, { getState }) =>
        runQuery(async () => {
          await updateDocument<IntelEntry>(intelPath(requireUid(getState)), entryId, changes);
          return null;
        }),
    }),
    intelDeleteIntel: build.mutation<null, string>({
      queryFn: (entryId, { getState }) =>
        runQuery(async () => {
          await deleteDocument(intelPath(requireUid(getState)), entryId);
          return null;
        }),
    }),
  }),
});

export const {
  useIntelGetIntelQuery,
  useIntelAddIntelMutation,
  useIntelUpdateIntelMutation,
  useIntelDeleteIntelMutation,
} = intelApi;
