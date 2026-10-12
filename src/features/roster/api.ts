import { orderBy } from 'firebase/firestore';
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
} from '../../firebase/firestore';
import { api } from '../../store/api';
import { requireUid, runQuery, syncWhileCached } from '../../store/realtime';
import {
  PLAYERS_COLLECTION,
  rangeOf,
  TRAIT_DEFINITIONS_COLLECTION,
  type Player,
  type PlayerInput,
  type PlayerStatus,
  type TraitDefinition,
  type TraitDefinitionInput,
  type TraitValue,
} from './types';

const playersPath = (uid: string) => userPath(uid, PLAYERS_COLLECTION);
const traitsPath = (uid: string) => userPath(uid, TRAIT_DEFINITIONS_COLLECTION);

// Lists and the open player are realtime, so edits show up everywhere without refetching.
const rosterApi = api
  .enhanceEndpoints({ addTagTypes: ['Player', 'TraitDefinition'] })
  .injectEndpoints({
    endpoints: (build) => ({
      rosterGetPlayers: build.query<Player[], void>({
        queryFn: (_arg, { getState }) =>
          runQuery(() =>
            getDocuments<Player>(playersPath(requireUid(getState)), orderBy('nickname')),
          ),
        onCacheEntryAdded: (_arg, lifecycle) =>
          syncWhileCached(
            () =>
              subscribeToCollection<Player>(
                playersPath(requireUid(lifecycle.getState)),
                [orderBy('nickname')],
                (players) => lifecycle.updateCachedData(() => players),
              ),
            lifecycle,
          ),
      }),
      rosterGetPlayer: build.query<Player | null, string>({
        queryFn: (playerId, { getState }) =>
          runQuery(() => getDocument<Player>(playersPath(requireUid(getState)), playerId)),
        onCacheEntryAdded: (playerId, lifecycle) =>
          syncWhileCached(
            () =>
              subscribeToDocument<Player>(
                playersPath(requireUid(lifecycle.getState)),
                playerId,
                (player) => lifecycle.updateCachedData(() => player),
              ),
            lifecycle,
          ),
      }),
      rosterCreatePlayer: build.mutation<string, PlayerInput>({
        queryFn: (input, { getState }) =>
          runQuery(() => createDocument<Player>(playersPath(requireUid(getState)), input)),
      }),
      rosterUpdatePlayer: build.mutation<null, { playerId: string; changes: Partial<PlayerInput> }>(
        {
          queryFn: ({ playerId, changes }, { getState }) =>
            runQuery(async () => {
              await updateDocument<Player>(playersPath(requireUid(getState)), playerId, changes);
              return null;
            }),
        },
      ),
      rosterSetPlayerStatus: build.mutation<null, { playerId: string; status: PlayerStatus }>({
        queryFn: ({ playerId, status }, { getState }) =>
          runQuery(async () => {
            await updateDocument<Player>(playersPath(requireUid(getState)), playerId, { status });
            return null;
          }),
      }),
      rosterUpdatePlayerTraits: build.mutation<
        null,
        { playerId: string; traits: Record<string, TraitValue> }
      >({
        queryFn: ({ playerId, traits }, { getState }) =>
          runQuery(async () => {
            await updateDocument<Player>(playersPath(requireUid(getState)), playerId, { traits });
            return null;
          }),
      }),
      /** Deletes the player doc only; the onPlayerDeleted function removes their records. */
      rosterDeletePlayer: build.mutation<null, string>({
        queryFn: (playerId, { getState }) =>
          runQuery(async () => {
            await deleteDocument(playersPath(requireUid(getState)), playerId);
            return null;
          }),
      }),

      rosterGetTraitDefinitions: build.query<TraitDefinition[], void>({
        queryFn: (_arg, { getState }) =>
          runQuery(() =>
            getDocuments<TraitDefinition>(traitsPath(requireUid(getState)), orderBy('order')),
          ),
        onCacheEntryAdded: (_arg, lifecycle) =>
          syncWhileCached(
            () =>
              subscribeToCollection<TraitDefinition>(
                traitsPath(requireUid(lifecycle.getState)),
                [orderBy('order')],
                (definitions) => lifecycle.updateCachedData(() => definitions),
              ),
            lifecycle,
          ),
      }),
      rosterUpsertTraitDefinition: build.mutation<null, TraitDefinitionInput>({
        queryFn: (definition, { getState }) =>
          runQuery(async () => {
            await setDocument<TraitDefinition>(
              traitsPath(requireUid(getState)),
              definition.key,
              definition,
              { merge: true },
            );
            return null;
          }),
      }),
      rosterDeleteTraitDefinition: build.mutation<null, string>({
        queryFn: (key, { getState }) =>
          runQuery(async () => {
            await deleteDocument(traitsPath(requireUid(getState)), key);
            return null;
          }),
      }),
      /** Writes the new `order` of every definition in one batch. */
      rosterReorderTraitDefinitions: build.mutation<null, string[]>({
        queryFn: (orderedKeys, { getState }) =>
          runQuery(async () => {
            const path = traitsPath(requireUid(getState));
            await runBatch(
              orderedKeys.map((key, order) => ({ type: 'update', path, id: key, data: { order } })),
            );
            return null;
          }),
      }),
      /**
       * Writes new or upgraded definitions in one batch (idempotent: the document id is the
       * trait key). Players' numbers for a trait that became a list of ranges (height, weight)
       * are moved into the matching range in the same batch.
       */
      rosterSyncTraitDefinitions: build.mutation<null, TraitDefinitionInput[]>({
        queryFn: (definitions, { getState }) =>
          runQuery(async () => {
            const uid = requireUid(getState);
            const path = traitsPath(uid);
            const ranged = definitions.filter((definition) => definition.kind === 'enum');
            const players = ranged.length ? await getDocuments<Player>(playersPath(uid)) : [];
            const playerUpdates = players.flatMap((player) => {
              const traits = { ...player.traits };
              let changed = false;
              ranged.forEach(({ key }) => {
                const value = traits[key];
                if (typeof value !== 'number') return;
                const option = rangeOf(key, value);
                if (option) traits[key] = option;
                else delete traits[key];
                changed = true;
              });
              return changed
                ? [
                    {
                      type: 'update' as const,
                      path: playersPath(uid),
                      id: player.id,
                      data: { traits },
                    },
                  ]
                : [];
            });
            await runBatch([
              ...definitions.map((definition) => ({
                type: 'set' as const,
                path,
                id: definition.key,
                data: definition,
              })),
              ...playerUpdates,
            ]);
            return null;
          }),
      }),
    }),
  });

export const {
  useRosterGetPlayersQuery,
  useRosterGetPlayerQuery,
  useRosterCreatePlayerMutation,
  useRosterUpdatePlayerMutation,
  useRosterSetPlayerStatusMutation,
  useRosterUpdatePlayerTraitsMutation,
  useRosterDeletePlayerMutation,
  useRosterGetTraitDefinitionsQuery,
  useRosterUpsertTraitDefinitionMutation,
  useRosterDeleteTraitDefinitionMutation,
  useRosterReorderTraitDefinitionsMutation,
  useRosterSyncTraitDefinitionsMutation,
} = rosterApi;
