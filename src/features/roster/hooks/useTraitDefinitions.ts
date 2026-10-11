import { useEffect, useRef } from 'react';
import { useRosterGetTraitDefinitionsQuery, useRosterSeedDefaultTraitsMutation } from '../api';
import type { TraitDefinition } from '../types';

const EMPTY: TraitDefinition[] = [];

/**
 * The realtime trait definitions, ordered. When the list first arrives empty, the default
 * traits are seeded. The seed uses the trait key as document id, so a repeated run
 * (StrictMode, two tabs) rewrites the same documents instead of creating duplicates.
 */
export const useTraitDefinitions = () => {
  const { data, isLoading, isError } = useRosterGetTraitDefinitionsQuery();
  const [seedDefaults, { isError: seedFailed }] = useRosterSeedDefaultTraitsMutation();
  const seeded = useRef(false);
  const empty = data !== undefined && data.length === 0;

  useEffect(() => {
    if (empty && !seeded.current) {
      seeded.current = true;
      void seedDefaults();
    }
  }, [empty, seedDefaults]);

  const definitions = data ?? EMPTY;

  return {
    definitions,
    activeDefinitions: definitions.filter((definition) => definition.active),
    // While the seed is in flight the list is still empty: keep showing a loader.
    isLoading: isLoading || (empty && !seedFailed),
    isError: isError || seedFailed,
  };
};
