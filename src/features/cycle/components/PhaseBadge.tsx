import { Box, Stack, Tooltip, Typography } from '@mui/material';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCyclePhase } from '../hooks/useCyclePhase';
import { useDateFormat } from '../hooks/useDateFormat';
import { CYCLE_NAMESPACE, RATING_KEYS } from '../types';
import { PhaseIcon } from './PhaseIcon';

/** Badge size per avatar size, in theme spacing units. */
const SIZES = { small: 2.25, medium: 2.75, large: 4 } as const;

interface PhaseBadgeProps {
  /** Player id, or SELF_ID for the user. */
  subjectId: string;
  size?: keyof typeof SIZES;
}

// Inside clickable rows and cards: show the tooltip, don't open the player.
const stop = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

/** Today's cycle phase as an icon with the details in a tooltip; nothing without cycle data. */
export const PhaseBadge = ({ subjectId, size = 'medium' }: PhaseBadgeProps) => {
  const { t } = useTranslation(CYCLE_NAMESPACE);
  const formatDate = useDateFormat();
  const { info, profile } = useCyclePhase(subjectId);

  if (!info) {
    return null;
  }

  const phaseName = t(`phase.${info.phase}`);
  const summary = profile?.phaseSummaries?.[info.phase];
  const averages = summary
    ? RATING_KEYS.flatMap((key) => {
        const value = summary.avg[key];
        return value === null ? [] : [`${t(`rating.${key}`)} ${value.toFixed(1)}`];
      })
    : [];

  const title = (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <PhaseIcon phase={info.phase} size={2.5} />
        <Typography variant="subtitle2" component="span">
          {phaseName}
        </Typography>
      </Stack>
      <Typography variant="caption" component="span">
        {t('badge.day', { day: info.cycleDay, length: info.cycleLength })} ·{' '}
        {t('badge.nextPeriod', { date: formatDate(info.nextPeriod) })}
      </Typography>
      <Typography variant="caption" component="span">
        {t(`description.${info.phase}`)}
      </Typography>
      {summary && (
        <Typography variant="caption" component="span">
          {t('badge.notes', { value: summary.count })}
          {averages.length > 0 && ` · ${averages.join(', ')}`}
        </Typography>
      )}
      {summary?.lastText && (
        <Typography variant="caption" component="span" sx={{ fontStyle: 'italic' }}>
          “{summary.lastText}”
        </Typography>
      )}
      {info.stale && (
        <Typography variant="caption" component="span" sx={{ fontWeight: 'fontWeightMedium' }}>
          {t('badge.stale')}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Tooltip title={title} enterTouchDelay={0} leaveTouchDelay={4000} arrow>
      <Box
        component="span"
        role="img"
        tabIndex={0}
        aria-label={t('badge.label', { phase: phaseName, day: info.cycleDay })}
        onClick={stop}
        sx={(theme) => ({
          display: 'inline-flex',
          borderRadius: '50%',
          border: `2px solid ${theme.palette.background.paper}`,
          bgcolor: 'background.paper',
          cursor: 'help',
          opacity: info.stale ? 0.6 : 1,
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: theme.spacing(0.25),
          },
        })}
      >
        <PhaseIcon phase={info.phase} size={SIZES[size]} />
      </Box>
    </Tooltip>
  );
};
