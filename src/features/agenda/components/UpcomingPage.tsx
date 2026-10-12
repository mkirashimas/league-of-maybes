import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAgendaGetPlayerRefsQuery,
  useAgendaGetUpcomingItemsQuery,
  useAgendaToggleAgendaItemDoneMutation,
} from '../api';
import { AGENDA_NAMESPACE, dayOf, todayIso, type AgendaItem, type PlayerRef } from '../types';
import { AgendaItemRow } from './AgendaItemRow';

interface Group {
  key: string;
  title: string;
  items: AgendaItem[];
}

const toUtcDay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

/** Everything coming up across the roster: open "now" items, then dated items by day. */
export const UpcomingPage = () => {
  const { t, i18n } = useTranslation([AGENDA_NAMESPACE, 'common']);
  const today = todayIso();
  const items = useAgendaGetUpcomingItemsQuery(today);
  const players = useAgendaGetPlayerRefsQuery();
  const [toggleDone] = useAgendaToggleAgendaItemDoneMutation();

  const groups = useMemo<Group[]>(() => {
    // Items of retired or deleted players are left out.
    const byId = new Map<string, PlayerRef>(
      (players.data ?? [])
        .filter((player) => player.status !== 'retired')
        .map((player) => [player.id, player]),
    );
    const keep = (item: AgendaItem) => byId.has(item.playerId);
    const relative = new Intl.RelativeTimeFormat(i18n.resolvedLanguage, { numeric: 'auto' });
    const dayFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const result: Group[] = [];
    const now = (items.data?.now ?? []).filter(keep);
    if (now.length > 0) result.push({ key: 'now', title: t('upcoming.now'), items: now });

    const byDay = new Map<string, AgendaItem[]>();
    (items.data?.upcoming ?? []).filter(keep).forEach((item) => {
      if (!item.when) return;
      const day = dayOf(item.when);
      byDay.set(day, [...(byDay.get(day) ?? []), item]);
    });
    byDay.forEach((dayItems, day) => {
      const offset = Math.round((toUtcDay(day) - toUtcDay(today)) / 86_400_000);
      const title =
        offset <= 1
          ? relative.format(offset, 'day')
          : dayFormat.format(new Date(`${day}T00:00:00`));
      result.push({ key: day, title, items: dayItems });
    });
    return result;
  }, [items.data, players.data, today, t, i18n.resolvedLanguage]);

  const playerOf = (item: AgendaItem) =>
    players.data?.find((player) => player.id === item.playerId);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          {t('upcoming.title')}
        </Typography>
        <Typography color="text.secondary">{t('upcoming.intro')}</Typography>
      </Box>

      {items.isLoading || players.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.isError || players.isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : groups.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('upcoming.empty')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {groups.map((group) => (
            <Paper key={group.key} variant="outlined">
              <Typography
                variant="subtitle2"
                component="h2"
                sx={(theme) => ({
                  px: 2,
                  py: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  color: group.key === 'now' ? 'success.main' : 'text.secondary',
                  '&::first-letter': { textTransform: 'uppercase' },
                })}
              >
                {group.title}
              </Typography>
              <Stack
                divider={
                  <Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}` })} />
                }
              >
                {group.items.map((item) => (
                  <AgendaItemRow
                    key={item.id}
                    item={item}
                    player={playerOf(item)}
                    onToggleDone={() => void toggleDone({ itemId: item.id, done: !item.done })}
                  />
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
