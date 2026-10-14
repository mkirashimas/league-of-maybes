import { Alert, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../hooks/useDateFormat';
import type { PhaseInfo } from '../phase';
import { CYCLE_NAMESPACE } from '../types';
import { CycleStrip } from './CycleStrip';
import { PhaseIcon } from './PhaseIcon';

/** Today's phase, where it sits in the cycle and what it usually brings. */
export const CurrentPhaseCard = ({ info }: { info: PhaseInfo | null }) => {
  const { t } = useTranslation(CYCLE_NAMESPACE);
  const formatDate = useDateFormat();

  return (
    <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          {t('current.title')}
        </Typography>
        {!info ? (
          <Typography color="text.secondary">{t('current.noData')}</Typography>
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <PhaseIcon phase={info.phase} size={7} />
              <Stack sx={{ minWidth: 0 }}>
                <Typography variant="h5" component="p">
                  {t(`phase.${info.phase}`)}
                </Typography>
                <Typography color="text.secondary">
                  {t('badge.day', { day: info.cycleDay, length: info.cycleLength })} ·{' '}
                  {t('badge.nextPeriod', { date: formatDate(info.nextPeriod) })}
                </Typography>
              </Stack>
            </Stack>
            <CycleStrip info={info} />
            <Typography>{t(`description.${info.phase}`)}</Typography>
            {info.stale && <Alert severity="warning">{t('badge.stale')}</Alert>}
            <Typography variant="caption" color="text.secondary">
              {info.averaged
                ? t('current.averaged', { length: info.cycleLength })
                : t('current.manual', { length: info.cycleLength })}{' '}
              {t('current.disclaimer')}
            </Typography>
          </>
        )}
      </Stack>
    </Paper>
  );
};
