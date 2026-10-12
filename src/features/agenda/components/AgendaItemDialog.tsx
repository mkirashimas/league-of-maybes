import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgendaCreateAgendaItemMutation, useAgendaUpdateAgendaItemMutation } from '../api';
import {
  AGENDA_KINDS,
  AGENDA_NAMESPACE,
  dayOf,
  timeOf,
  toWhen,
  type AgendaItem,
  type AgendaKind,
  type AgendaValues,
} from '../types';

const FORM_ID = 'agenda-item-form';

interface AgendaFormProps {
  existing?: AgendaItem;
  onSubmit: (values: AgendaValues) => void;
}

/** Mounted fresh on every open, so it starts from `existing`. */
const AgendaForm = ({ existing, onSubmit }: AgendaFormProps) => {
  const { t } = useTranslation(AGENDA_NAMESPACE);
  const [kind, setKind] = useState<AgendaKind>(existing?.kind ?? 'event');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [day, setDay] = useState(existing?.when ? dayOf(existing.when) : '');
  const [time, setTime] = useState(existing?.when ? timeOf(existing.when) : '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [touched, setTouched] = useState(false);

  const titleMissing = title.trim() === '';
  const dated = kind !== 'now';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (titleMissing) return;
    onSubmit({
      kind,
      title: title.trim(),
      notes: notes.trim(),
      // "now" items are never dated, so they never show up in the dated Upcoming query.
      when: dated ? toWhen(day, time) : null,
    });
  };

  return (
    <Stack
      component="form"
      id={FORM_ID}
      onSubmit={handleSubmit}
      spacing={2}
      sx={{ pt: 1 }}
      noValidate
    >
      <TextField
        select
        label={t('form.kind')}
        value={kind}
        onChange={(event) => setKind(event.target.value as AgendaKind)}
        helperText={t(`kindHelp.${kind}`)}
      >
        {AGENDA_KINDS.map((value) => (
          <MenuItem key={value} value={value}>
            {t(`kind.${value}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={t('form.title')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        required
        autoFocus={!existing}
        error={touched && titleMissing}
        helperText={touched && titleMissing ? t('form.titleRequired') : undefined}
        slotProps={{ htmlInput: { maxLength: 120 } }}
      />
      {dated && (
        <Box
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
          })}
        >
          <TextField
            label={t('form.day')}
            type="date"
            value={day}
            onChange={(event) => setDay(event.target.value)}
            helperText={kind === 'plan' ? t('form.dayOptional') : undefined}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('form.time')}
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            disabled={!day}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
      )}
      <TextField
        label={t('form.notes')}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        multiline
        minRows={2}
        slotProps={{ htmlInput: { maxLength: 1000 } }}
      />
    </Stack>
  );
};

interface AgendaItemDialogProps {
  open: boolean;
  playerId: string;
  existing?: AgendaItem;
  onClose: () => void;
}

export const AgendaItemDialog = ({ open, playerId, existing, onClose }: AgendaItemDialogProps) => {
  const { t } = useTranslation([AGENDA_NAMESPACE, 'common']);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [createItem, createState] = useAgendaCreateAgendaItemMutation();
  const [updateItem, updateState] = useAgendaUpdateAgendaItemMutation();

  const handleClose = () => {
    createState.reset();
    updateState.reset();
    onClose();
  };

  const handleSubmit = async (values: AgendaValues) => {
    const result = existing
      ? await updateItem({ itemId: existing.id, changes: values })
      : await createItem({ playerId, done: false, ...values });
    if (!('error' in result)) handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{existing ? t('form.titleEdit') : t('form.titleNew')}</DialogTitle>
      <DialogContent>
        {open && (
          <AgendaForm existing={existing} onSubmit={(values) => void handleSubmit(values)} />
        )}
        {(createState.isError || updateState.isError) && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t('common:saveError')}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
        <Button
          type="submit"
          form={FORM_ID}
          variant="contained"
          loading={createState.isLoading || updateState.isLoading}
        >
          {t('common:actions.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
