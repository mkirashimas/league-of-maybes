import { limit, orderBy, where } from 'firebase/firestore';
import {
  createDocument,
  deleteDocument,
  getDocuments,
  setDocument,
  subscribeToCollection,
  updateDocument,
  userPath,
} from '../../firebase/firestore';
import { api } from '../../store/api';
import { requireUid, runQuery, syncWhileCached } from '../../store/realtime';
import {
  DATE_SUMMARIES_COLLECTION,
  DATES_COLLECTION,
  PLAYERS_COLLECTION,
  summarize,
  type DateInput,
  type DateRecord,
  type DateSummary,
  type PlayerRef,
} from './types';

const datesPath = (uid: string) => userPath(uid, DATES_COLLECTION);
const summariesPath = (uid: string) => userPath(uid, DATE_SUMMARIES_COLLECTION);
const playersPath = (uid: string) => userPath(uid, PLAYERS_COLLECTION);

/**
 * Re-reads all of a player's dates and overwrites their summary. Firestore web transactions
 * cannot run queries, so this re-query + overwrite stands in for one: it is idempotent and
 * always converges on the current dates.
 */
const refreshSummary = async (uid: string, playerId: string) => {
  const dates = await getDocuments<DateRecord>(datesPath(uid), where('playerId', '==', playerId));
  await setDocument<DateSummary>(summariesPath(uid), playerId, summarize(playerId, dates));
};

interface DatesArg {
  playerId: string;
  limit: number;
}

const playerDatesConstraints = ({ playerId, limit: max }: DatesArg) => [
  where('playerId', '==', playerId),
  orderBy('date', 'desc'),
  limit(max),
];

const datesApi = api.injectEndpoints({
  endpoints: (build) => ({
    datesGetDates: build.query<DateRecord[], DatesArg>({
      queryFn: (arg, { getState }) =>
        runQuery(() =>
          getDocuments<DateRecord>(datesPath(requireUid(getState)), ...playerDatesConstraints(arg)),
        ),
      onCacheEntryAdded: (arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<DateRecord>(
              datesPath(requireUid(lifecycle.getState)),
              playerDatesConstraints(arg),
              (dates) => lifecycle.updateCachedData(() => dates),
            ),
          lifecycle,
        ),
    }),
    datesGetDateSummaries: build.query<DateSummary[], void>({
      queryFn: (_arg, { getState }) =>
        runQuery(() => getDocuments<DateSummary>(summariesPath(requireUid(getState)))),
      onCacheEntryAdded: (_arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<DateSummary>(
              summariesPath(requireUid(lifecycle.getState)),
              [],
              (summaries) => lifecycle.updateCachedData(() => summaries),
            ),
          lifecycle,
        ),
    }),
    /** Read-only view of the roster's players: just what the Timeline shows. */
    datesGetPlayerRefs: build.query<PlayerRef[], void>({
      queryFn: (_arg, { getState }) =>
        runQuery(() =>
          getDocuments<PlayerRef>(playersPath(requireUid(getState)), orderBy('nickname')),
        ),
      onCacheEntryAdded: (_arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<PlayerRef>(
              playersPath(requireUid(lifecycle.getState)),
              [orderBy('nickname')],
              (players) => lifecycle.updateCachedData(() => players),
            ),
          lifecycle,
        ),
    }),
    datesCreateDate: build.mutation<string, DateInput>({
      queryFn: (input, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          const id = await createDocument<DateRecord>(datesPath(uid), input);
          await refreshSummary(uid, input.playerId);
          return id;
        }),
    }),
    datesUpdateDate: build.mutation<null, { dateId: string; input: DateInput }>({
      queryFn: ({ dateId, input }, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          await updateDocument<DateRecord>(datesPath(uid), dateId, input);
          await refreshSummary(uid, input.playerId);
          return null;
        }),
    }),
    datesDeleteDate: build.mutation<null, { dateId: string; playerId: string }>({
      queryFn: ({ dateId, playerId }, { getState }) =>
        runQuery(async () => {
          const uid = requireUid(getState);
          await deleteDocument(datesPath(uid), dateId);
          await refreshSummary(uid, playerId);
          return null;
        }),
    }),
  }),
});

export const {
  useDatesGetDatesQuery,
  useDatesGetDateSummariesQuery,
  useDatesGetPlayerRefsQuery,
  useDatesCreateDateMutation,
  useDatesUpdateDateMutation,
  useDatesDeleteDateMutation,
} = datesApi;
