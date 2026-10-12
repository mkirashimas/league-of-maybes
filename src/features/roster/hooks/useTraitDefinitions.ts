import { useEffect, useMemo, useRef } from 'react';
import { useRosterGetTraitDefinitionsQuery, useRosterSyncTraitDefinitionsMutation } from '../api';
import {
  DEFAULT_TRAITS,
  upgradeDefinition,
  type TraitDefinition,
  type TraitDefinitionInput,
} from '../types';

const EMPTY: TraitDefinition[] = [];

/**
 * What must be written so `stored` matches this version of the app:
 * - every built-in for a new account
 * - built-ins added in a later version, placed after the current last trait (built-ins can't
 *   be deleted, only switched off, so a missing key is always a new one)
 * - stored definitions that changed shape (see upgradeDefinition)
 */
const pendingWrites = (stored: TraitDefinition[]): TraitDefinitionInput[] => {
  if (stored.length === 0) return DEFAULT_TRAITS;
  const keys = new Set(stored.map((definition) => definition.key));
  const lastOrder = Math.max(...stored.map((definition) => definition.order));
  const added = DEFAULT_TRAITS.filter((definition) => !keys.has(definition.key)).map(
    (definition, index) => ({ ...definition, order: lastOrder + 1 + index }),
  );
  const upgraded = stored
    .map(upgradeDefinition)
    .filter((definition): definition is TraitDefinitionInput => definition !== null);
  return [...added, ...upgraded];
};

/**
 * The realtime trait definitions, ordered. When the list first arrives, anything missing or
 * outdated is written once (pendingWrites). Writes use the trait key as document id, so a
 * repeated run (StrictMode, two tabs) rewrites the same documents instead of creating duplicates.
 */
export const useTraitDefinitions = () => {
  const { data, isLoading, isError } = useRosterGetTraitDefinitionsQuery();
  const [syncDefinitions, { isError: syncFailed }] = useRosterSyncTraitDefinitionsMutation();
  const synced = useRef(false);
  const pending = useMemo(() => (data ? pendingWrites(data) : []), [data]);
  const empty = data !== undefined && data.length === 0;

  useEffect(() => {
    if (pending.length > 0 && !synced.current) {
      synced.current = true;
      void syncDefinitions(pending);
    }
  }, [pending, syncDefinitions]);

  const definitions = data ?? EMPTY;

  return {
    definitions,
    activeDefinitions: definitions.filter((definition) => definition.active),
    // While the first seed is in flight the list is still empty: keep showing a loader.
    isLoading: isLoading || (empty && !syncFailed),
    isError: isError || syncFailed,
  };
};
