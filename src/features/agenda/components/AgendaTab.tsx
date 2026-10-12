import { AddOutlined } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import {
  useAgendaDeleteAgendaItemMutation,
  useAgendaGetAgendaItemsQuery,
  useAgendaToggleAgendaItemDoneMutation,
} from '../api';
import { AGENDA_NAMESPACE, isPast, PAGE_SIZE, todayIso, type AgendaItem } from '../types';
import { AgendaItemDialog } from './AgendaItemDialog';
import { AgendaItemRow } from './AgendaItemRow';
import { ConfirmDialog } from './ConfirmDialog';

type SectionKey = 'now' | 'comingUp' | 'someday' | 'past';

/** Splits a player's items into the four sections of the tab. */
const sectionsOf = (items: AgendaItem[], today: string): Record<SectionKey, AgendaItem[]> => {
  const open = items.filter((item) => !item.done && !isPast(item, today));
  const byWhen = (a: AgendaItem, b: AgendaItem) => (a.when ?? '').localeCompare(b.when ?? '');
  return {
    now: open.filter((item) => item.kind === 'now'),
    comingUp: open.filter((item) => item.kind !== 'now' && item.when !== null).sort(byWhen),
    someday: open.filter((item) => item.kind !== 'now' && item.when === null),
    past: items.filter((item) => item.done || isPast(item, today)).sort((a, b) => byWhen(b, a)),
  };
};

/** Player tab "Now & Next": what is going on, what is coming, and what happened. */
export const AgendaTab = () => {
  const { t } = useTranslation([AGENDA_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const [max, setMax] = useState(PAGE_SIZE);
  const {
    data: items,
    isLoading,
    isError,
    isFetching,
  } = useAgendaGetAgendaItemsQuery({ playerId, limit: max }, { skip: !playerId });
  const [toggleDone] = useAgendaToggleAgendaItemDoneMutation();
  const [deleteItem] = useAgendaDeleteAgendaItemMutation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgendaItem | undefined>(undefined);
  const [deleting, setDeleting] = useState<AgendaItem | null>(null);
  const [showPast, setShowPast] = useState(false);

  const sections = sectionsOf(items ?? [], todayIso());
  const visible: SectionKey[] = showPast
    ? ['now', 'comingUp', 'someday', 'past']
    : ['now', 'comingUp', 'someday'];

  const renderItem = (item: AgendaItem) => (
    <AgendaItemRow
      key={item.id}
      item={item}
      onToggleDone={() => void toggleDone({ itemId: item.id, done: !item.done })}
      onEdit={() => {
        setEditing(item);
        setDialogOpen(true);
      }}
      onDelete={() => setDeleting(item)}
    />
  );

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h6" component="h2">
          {t('tab.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddOutlined />}
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          {t('tab.add')}
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : !items || items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('tab.empty')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {visible
            .filter((key) => sections[key].length > 0)
            .map((key) => (
              <Paper key={key} variant="outlined">
                <Typography
                  variant="subtitle2"
                  component="h3"
                  color="text.secondary"
                  sx={(theme) => ({
                    px: 2,
                    py: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  })}
                >
                  {t(`section.${key}`)}
                </Typography>
                <Stack
                  divider={
                    <Box sx={(theme) => ({ borderTop: `1px solid ${theme.palette.divider}` })} />
                  }
                >
                  {sections[key].map(renderItem)}
                </Stack>
              </Paper>
            ))}
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
            {sections.past.length > 0 && (
              <Button onClick={() => setShowPast((current) => !current)}>
                {showPast ? t('tab.hidePast') : t('tab.showPast', { total: sections.past.length })}
              </Button>
            )}
            {items.length >= max && (
              <Button onClick={() => setMax((current) => current + PAGE_SIZE)} loading={isFetching}>
                {t('tab.loadMore')}
              </Button>
            )}
          </Stack>
        </Stack>
      )}

      <AgendaItemDialog
        open={dialogOpen}
        playerId={playerId}
        existing={editing}
        onClose={() => setDialogOpen(false)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('delete.title')}
        message={t('delete.message')}
        confirmLabel={t('common:actions.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void deleteItem(deleting.id);
          setDeleting(null);
        }}
      />
    </Stack>
  );
};
