import { useEffect, useMemo, useRef } from 'react';
import { useRosterGetTraitDefinitionsQuery, useRosterSeedDefaultTraitsMutation } from '../api';
import { DEFAULT_TRAITS, type TraitDefinition, type TraitDefinitionInput } from '../types';

const EMPTY: TraitDefinition[] = [];

/**
 * The built-in definitions missing from `stored`. All of them for a new account; for an existing
 * one, the built-ins added in a later version, placed after the current last trait.
 * Built-ins can't be deleted (only switched off), so a missing key is always a new one.
 */
const missingDefaults = (stored: TraitDefinition[]): TraitDefinitionInput[] => {
  if (stored.length === 0) return DEFAULT_TRAITS;
  const keys = new Set(stored.map((definition) => definition.key));
  const lastOrder = Math.max(...stored.map((definition) => definition.order));
  return DEFAULT_TRAITS.filter((definition) => !keys.has(definition.key)).map(
    (definition, index) => ({ ...definition, order: lastOrder + 1 + index }),
  );
};

/**
 * The realtime trait definitions, ordered. Missing built-in traits are seeded once, when the
 * list first arrives. The seed uses the trait key as document id, so a repeated run
 * (StrictMode, two tabs) rewrites the same documents instead of creating duplicates.
 */
export const useTraitDefinitions = () => {
  const { data, isLoading, isError } = useRosterGetTraitDefinitionsQuery();
  const [seedDefaults, { isError: seedFailed }] = useRosterSeedDefaultTraitsMutation();
  const seeded = useRef(false);
  const missing = useMemo(() => (data ? missingDefaults(data) : []), [data]);
  const empty = data !== undefined && data.length === 0;

  useEffect(() => {
    if (missing.length > 0 && !seeded.current) {
      seeded.current = true;
      void seedDefaults(missing);
    }
  }, [missing, seedDefaults]);

  const definitions = data ?? EMPTY;

  return {
    definitions,
    activeDefinitions: definitions.filter((definition) => definition.active),
    // While the first seed is in flight the list is still empty: keep showing a loader.
    isLoading: isLoading || (empty && !seedFailed),
    isError: isError || seedFailed,
  };
};
