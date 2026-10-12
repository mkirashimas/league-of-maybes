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
import {
  AGENDA_COLLECTION,
  PLAYERS_COLLECTION,
  type AgendaInput,
  type AgendaItem,
  type AgendaValues,
  type PlayerRef,
} from './types';

const agendaPath = (uid: string) => userPath(uid, AGENDA_COLLECTION);
const playersPath = (uid: string) => userPath(uid, PLAYERS_COLLECTION);

interface AgendaArg {
  playerId: string;
  limit: number;
}

// Newest first; the tab sorts into Now / Coming up / Someday / Past on the client.
const playerAgendaConstraints = ({ playerId, limit: max }: AgendaArg) => [
  where('playerId', '==', playerId),
  orderBy('createdAt', 'desc'),
  limit(max),
];

/** Open "now" items of every player. Equality-only: no composite index needed. */
const openNowConstraints = () => [where('done', '==', false), where('kind', '==', 'now')];

/** Open dated items from `today` on, soonest first. Needs the (done, when) index. */
const upcomingConstraints = (today: string) => [
  where('done', '==', false),
  where('when', '>=', today),
  orderBy('when', 'asc'),
];

const agendaApi = api.injectEndpoints({
  endpoints: (build) => ({
    agendaGetAgendaItems: build.query<AgendaItem[], AgendaArg>({
      queryFn: (arg, { getState }) =>
        runQuery(() =>
          getDocuments<AgendaItem>(
            agendaPath(requireUid(getState)),
            ...playerAgendaConstraints(arg),
          ),
        ),
      onCacheEntryAdded: (arg, lifecycle) =>
        syncWhileCached(
          () =>
            subscribeToCollection<AgendaItem>(
              agendaPath(requireUid(lifecycle.getState)),
              playerAgendaConstraints(arg),
              (items) => lifecycle.updateCachedData(() => items),
            ),
          lifecycle,
        ),
    }),
    /** Open "now" items plus open dated items from `today` on, for every player. */
    agendaGetUpcomingItems: build.query<{ now: AgendaItem[]; upcoming: AgendaItem[] }, string>({
      queryFn: (today, { getState }) =>
        runQuery(async () => {
          const path = agendaPath(requireUid(getState));
          const [now, upcoming] = await Promise.all([
            getDocuments<AgendaItem>(path, ...openNowConstraints()),
            getDocuments<AgendaItem>(path, ...upcomingConstraints(today)),
          ]);
          return { now, upcoming };
        }),
      onCacheEntryAdded: (today, lifecycle) =>
        syncWhileCached(() => {
          const path = agendaPath(requireUid(lifecycle.getState));
          const stopNow = subscribeToCollection<AgendaItem>(path, openNowConstraints(), (now) =>
            lifecycle.updateCachedData((draft) => ({ ...draft, now })),
          );
          const stopUpcoming = subscribeToCollection<AgendaItem>(
            path,
            upcomingConstraints(today),
            (upcoming) => lifecycle.updateCachedData((draft) => ({ ...draft, upcoming })),
          );
          return () => {
            stopNow();
            stopUpcoming();
          };
        }, lifecycle),
    }),
    /** Read-only view of the roster's players: just what Upcoming shows. */
    agendaGetPlayerRefs: build.query<PlayerRef[], void>({
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
    agendaCreateAgendaItem: build.mutation<string, AgendaInput>({
      queryFn: (input, { getState }) =>
        runQuery(() => createDocument<AgendaItem>(agendaPath(requireUid(getState)), input)),
    }),
    agendaUpdateAgendaItem: build.mutation<null, { itemId: string; changes: AgendaValues }>({
      queryFn: ({ itemId, changes }, { getState }) =>
        runQuery(async () => {
          await updateDocument<AgendaItem>(agendaPath(requireUid(getState)), itemId, changes);
          return null;
        }),
    }),
    agendaToggleAgendaItemDone: build.mutation<null, { itemId: string; done: boolean }>({
      queryFn: ({ itemId, done }, { getState }) =>
        runQuery(async () => {
          await updateDocument<AgendaItem>(agendaPath(requireUid(getState)), itemId, { done });
          return null;
        }),
    }),
    agendaDeleteAgendaItem: build.mutation<null, string>({
      queryFn: (itemId, { getState }) =>
        runQuery(async () => {
          await deleteDocument(agendaPath(requireUid(getState)), itemId);
          return null;
        }),
    }),
  }),
});

export const {
  useAgendaGetAgendaItemsQuery,
  useAgendaGetUpcomingItemsQuery,
  useAgendaGetPlayerRefsQuery,
  useAgendaCreateAgendaItemMutation,
  useAgendaUpdateAgendaItemMutation,
  useAgendaToggleAgendaItemDoneMutation,
  useAgendaDeleteAgendaItemMutation,
} = agendaApi;
