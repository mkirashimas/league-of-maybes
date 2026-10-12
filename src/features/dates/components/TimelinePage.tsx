import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Tooltip,
  Typography,
  type ChipProps,
} from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link as RouterLink } from 'react-router';
import { PATHS } from '../../../types';
import { useDatesGetDateSummariesQuery, useDatesGetPlayerRefsQuery } from '../api';
import {
  COOLING_DAYS,
  DATES_NAMESPACE,
  daysSince,
  FRESH_DAYS,
  freshnessOf,
  initialsOf,
  TIMELINE_DAYS,
  TIMELINE_STATUSES,
  todayIso,
  type DateSummary,
  type Freshness,
  type PlayerRef,
} from '../types';

const FRESHNESS_COLORS: Record<Freshness, ChipProps['color']> = {
  fresh: 'success',
  cooling: 'warning',
  cold: 'error',
};

interface Row {
  player: PlayerRef;
  summary: DateSummary | undefined;
  /** Days since the last date, or null if never dated. */
  days: number | null;
}

/** Last TIMELINE_DAYS days as a strip: one dot per date, today on the right. */
const DotStrip = ({ days, today, label }: { days: string[]; today: string; label: string }) => {
  const { i18n } = useTranslation();
  const format = new Intl.DateTimeFormat(i18n.resolvedLanguage, { day: 'numeric', month: 'short' });

  return (
    <Box
      role="img"
      aria-label={label}
      sx={(theme) => ({
        position: 'relative',
        height: theme.spacing(2),
        mx: 1,
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          borderTop: `1px solid ${theme.palette.divider}`,
        },
      })}
    >
      {days.map((day) => {
        const age = daysSince(day, today);
        if (age < 0 || age >= TIMELINE_DAYS) return null;
        return (
          <Tooltip key={day} title={format.format(new Date(`${day}T00:00:00`))}>
            <Box
              sx={(theme) => ({
                position: 'absolute',
                top: '50%',
                left: `${100 - (age / (TIMELINE_DAYS - 1)) * 100}%`,
                width: theme.spacing(1.25),
                height: theme.spacing(1.25),
                borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                border: `2px solid ${theme.palette.background.paper}`,
                transform: 'translate(-50%, -50%)',
              })}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};

export const TimelinePage = () => {
  const { t, i18n } = useTranslation([DATES_NAMESPACE, 'common']);
  const players = useDatesGetPlayerRefsQuery();
  const summaries = useDatesGetDateSummariesQuery();
  const today = todayIso();
  const relative = new Intl.RelativeTimeFormat(i18n.resolvedLanguage, { numeric: 'auto' });

  const rows = useMemo<Row[]>(() => {
    const byPlayer = new Map((summaries.data ?? []).map((summary) => [summary.id, summary]));
    return (players.data ?? [])
      .filter((player) => TIMELINE_STATUSES.includes(player.status))
      .map((player) => {
        const summary = byPlayer.get(player.id);
        return {
          player,
          summary,
          days: summary?.lastDateAt ? daysSince(summary.lastDateAt, today) : null,
        };
      })
      .sort((a, b) => {
        // Stalest first: never dated, then the longest time since the last date.
        if (a.days === null && b.days === null)
          return a.player.nickname.localeCompare(b.player.nickname);
        if (a.days === null) return -1;
        if (b.days === null) return 1;
        return b.days - a.days;
      });
  }, [players.data, summaries.data, today]);

  const header = (
    <Stack spacing={1}>
      <Typography variant="h4" component="h1">
        {t('timeline.title')}
      </Typography>
      <Typography color="text.secondary">{t('timeline.intro', { days: TIMELINE_DAYS })}</Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip
          size="small"
          color="success"
          label={t('timeline.legend.fresh', { days: FRESH_DAYS })}
        />
        <Chip
          size="small"
          color="warning"
          label={t('timeline.legend.cooling', { from: FRESH_DAYS, to: COOLING_DAYS })}
        />
        <Chip
          size="small"
          color="error"
          label={t('timeline.legend.cold', { days: COOLING_DAYS })}
        />
      </Stack>
    </Stack>
  );

  if (players.isLoading || summaries.isLoading) {
    return (
      <Stack spacing={3}>
        {header}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Stack>
    );
  }

  if (players.isError || summaries.isError) {
    return (
      <Stack spacing={3}>
        {header}
        <Alert severity="error">{t('common:loadError')}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      {header}
      {rows.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('timeline.empty')}</Typography>
        </Paper>
      ) : (
        <Paper variant="outlined">
          <Stack
            divider={<Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}` })} />}
          >
            {rows.map(({ player, summary, days }) => {
              const label = days === null ? t('timeline.never') : relative.format(-days, 'day');
              return (
                <Box
                  key={player.id}
                  sx={(theme) => ({
                    display: 'grid',
                    gridTemplateColumns: `${theme.spacing(28)} minmax(0, 1fr) auto`,
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    [theme.breakpoints.down('md')]: {
                      gridTemplateColumns: 'minmax(0, 1fr) auto',
                      gridTemplateAreas: '"player chip" "dots dots"',
                      rowGap: 1.5,
                    },
                  })}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={(theme) => ({
                      alignItems: 'center',
                      minWidth: 0,
                      [theme.breakpoints.down('md')]: { gridArea: 'player' },
                    })}
                  >
                    <Avatar
                      sx={(theme) => ({
                        width: theme.spacing(4),
                        height: theme.spacing(4),
                        fontSize: theme.typography.body2.fontSize,
                        bgcolor: theme.palette[player.avatarColor].main,
                        color: theme.palette[player.avatarColor].contrastText,
                      })}
                    >
                      {initialsOf(player.nickname) || '?'}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Link
                        component={RouterLink}
                        to={generatePath(PATHS.PLAYER_DATES, { playerId: player.id })}
                        color="inherit"
                        underline="hover"
                        noWrap
                        sx={{ display: 'block', fontWeight: 'fontWeightMedium' }}
                      >
                        {player.nickname}
                      </Link>
                      <Typography variant="caption" color="text.secondary">
                        {t('timeline.total', { total: summary?.count ?? 0 })}
                      </Typography>
                    </Box>
                  </Stack>
                  <Box sx={(theme) => ({ [theme.breakpoints.down('md')]: { gridArea: 'dots' } })}>
                    <DotStrip
                      days={summary?.recentDates ?? []}
                      today={today}
                      label={t('timeline.dotsLabel', { days: TIMELINE_DAYS })}
                    />
                  </Box>
                  <Box sx={(theme) => ({ [theme.breakpoints.down('md')]: { gridArea: 'chip' } })}>
                    <Chip
                      label={label}
                      color={days === null ? 'default' : FRESHNESS_COLORS[freshnessOf(days)]}
                      variant={days === null ? 'outlined' : 'filled'}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};
