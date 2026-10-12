import { AddOutlined } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useDatesDeleteDateMutation, useDatesGetDatesQuery } from '../api';
import { DATES_NAMESPACE, PAGE_SIZE, type DateRecord } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { DateCard } from './DateCard';
import { DateFormDialog } from './DateFormDialog';

/** Player tab: the log of dates with this player, newest first. */
export const DatesTab = () => {
  const { t } = useTranslation([DATES_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const [max, setMax] = useState(PAGE_SIZE);
  const {
    data: dates,
    isLoading,
    isError,
    isFetching,
  } = useDatesGetDatesQuery({ playerId, limit: max }, { skip: !playerId });
  const [deleteDate] = useDatesDeleteDateMutation();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DateRecord | undefined>(undefined);
  const [deleting, setDeleting] = useState<DateRecord | null>(null);

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h6" component="h2">
          {t('tab.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={openNew}>
          {t('tab.add')}
        </Button>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : !dates || dates.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">{t('tab.empty')}</Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {dates.map((record) => (
            <DateCard
              key={record.id}
              record={record}
              onEdit={() => {
                setEditing(record);
                setFormOpen(true);
              }}
              onDelete={() => setDeleting(record)}
            />
          ))}
          {dates.length >= max && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button onClick={() => setMax((current) => current + PAGE_SIZE)} loading={isFetching}>
                {t('tab.loadMore')}
              </Button>
            </Box>
          )}
        </Stack>
      )}

      <DateFormDialog
        open={formOpen}
        playerId={playerId}
        existing={editing}
        onClose={() => setFormOpen(false)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('delete.title')}
        message={t('delete.message')}
        confirmLabel={t('common:actions.delete')}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) void deleteDate({ dateId: deleting.id, playerId: deleting.playerId });
          setDeleting(null);
        }}
      />
    </Stack>
  );
};
