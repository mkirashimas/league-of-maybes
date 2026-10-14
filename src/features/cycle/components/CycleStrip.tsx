import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { phaseDays, type PhaseInfo } from '../phase';
import { PHASE_STYLES } from '../phaseIcons';
import { CYCLE_NAMESPACE } from '../types';

/** One segment per cycle day, coloured by phase, with today raised. */
export const CycleStrip = ({ info }: { info: PhaseInfo }) => {
  const { t } = useTranslation(CYCLE_NAMESPACE);
  const days = phaseDays(info.cycleLength, info.periodLength);

  return (
    <Stack spacing={0.5}>
      <Box
        role="img"
        aria-label={t('badge.day', { day: info.cycleDay, length: info.cycleLength })}
        sx={{ display: 'flex', gap: 0.25, alignItems: 'flex-end' }}
      >
        {days.map((phase, index) => {
          const day = index + 1;
          const today = day === info.cycleDay;
          return (
            <Tooltip key={day} title={`${t('strip.day', { day })} · ${t(`phase.${phase}`)}`}>
              <Box
                sx={(theme) => ({
                  flex: 1,
                  minWidth: 0,
                  height: theme.spacing(today ? 3 : 1.5),
                  borderRadius: 0.5,
                  bgcolor: theme.palette[PHASE_STYLES[phase].color].main,
                  opacity: today ? 1 : 0.45,
                })}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {t('strip.day', { day: 1 })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('strip.day', { day: info.cycleLength })}
        </Typography>
      </Stack>
    </Stack>
  );
};
