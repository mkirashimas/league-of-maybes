import { Alert, Box, CircularProgress } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCycleGetProfileQuery } from '../api';
import { getPhaseInfo, todayIso } from '../phase';
import { DEFAULT_PROFILE } from '../types';
import { CurrentPhaseCard } from './CurrentPhaseCard';
import { CycleSetupCard } from './CycleSetupCard';
import { PhaseNotesLog } from './PhaseNotesLog';

/** Current phase, cycle data and phase notes of a subject (player id or SELF_ID). */
export const CyclePanel = ({ subjectId }: { subjectId: string }) => {
  const { t } = useTranslation('common');
  const { data: stored, isLoading, isError } = useCycleGetProfileQuery(subjectId);
  const profile = useMemo(() => ({ ...DEFAULT_PROFILE, ...stored }), [stored]);
  const info = useMemo(() => getPhaseInfo(profile, todayIso()), [profile]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">{t('loadError')}</Alert>;
  }

  return (
    <Box
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 2,
        alignItems: 'start',
        [theme.breakpoints.down('md')]: { gridTemplateColumns: 'minmax(0, 1fr)' },
      })}
    >
      <CurrentPhaseCard info={info} />
      <CycleSetupCard subjectId={subjectId} profile={profile} />
      <Box sx={{ gridColumn: '1 / -1' }}>
        <PhaseNotesLog subjectId={subjectId} profile={profile} currentPhase={info?.phase ?? null} />
      </Box>
    </Box>
  );
};
