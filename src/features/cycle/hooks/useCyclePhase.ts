import { useMemo } from 'react';
import { useCycleGetProfilesQuery } from '../api';
import { getPhaseInfo, todayIso, type PhaseInfo } from '../phase';
import { DEFAULT_PROFILE, type CycleProfile } from '../types';

/**
 * Today's phase of a subject (player id or SELF_ID), from the shared realtime list of profiles.
 * Null while loading or without a logged period.
 */
export const useCyclePhase = (
  subjectId: string,
): { info: PhaseInfo | null; profile: CycleProfile | null } => {
  const { data: profiles } = useCycleGetProfilesQuery();
  const profile = profiles?.find((candidate) => candidate.id === subjectId) ?? null;
  const info = useMemo(
    () => (profile ? getPhaseInfo({ ...DEFAULT_PROFILE, ...profile }, todayIso()) : null),
    [profile],
  );
  return { info, profile };
};
