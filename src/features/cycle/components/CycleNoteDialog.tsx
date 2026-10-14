import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { isIsoDate, todayIso } from '../phase';
import {
  CYCLE_NAMESPACE,
  EMPTY_RATINGS,
  MAX_NOTE_LENGTH,
  RATING_KEYS,
  RATING_MAX,
  type CycleNote,
  type CycleNoteValues,
  type Ratings,
} from '../types';

interface CycleNoteDialogProps {
  open: boolean;
  /** The note being edited; a new note otherwise. */
  initial?: CycleNote | null;
  saving: boolean;
  onSubmit: (values: CycleNoteValues) => void;
  onClose: () => void;
}

const FORM_ID = 'cycle-note-form';

/** Date, text and optional 1–5 ratings of an observation. The phase comes from the date. */
export const CycleNoteDialog = (props: CycleNoteDialogProps) => (
  // Mounted per open, so the fields start from the note being edited.
  <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
    {props.open && <CycleNoteForm {...props} />}
  </Dialog>
);

const CycleNoteForm = ({ initial, saving, onSubmit, onClose }: CycleNoteDialogProps) => {
  const { t } = useTranslation([CYCLE_NAMESPACE, 'common']);
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [text, setText] = useState(initial?.text ?? '');
  const [ratings, setRatings] = useState<Ratings>({ ...EMPTY_RATINGS, ...initial?.ratings });

  const hasRating = RATING_KEYS.some((key) => ratings[key] !== null);
  const valid = isIsoDate(date) && (text.trim() !== '' || hasRating);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (valid) onSubmit({ date, text: text.trim(), ratings });
  };

  return (
    <>
      <DialogTitle>{initial ? t('notes.editTitle') : t('notes.addTitle')}</DialogTitle>
      <DialogContent>
        <Box component="form" id={FORM_ID} onSubmit={handleSubmit} noValidate sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <TextField
              label={t('notes.date')}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              helperText={t('notes.dateHelper')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t('notes.text')}
              placeholder={t('notes.textPlaceholder')}
              value={text}
              onChange={(event) => setText(event.target.value)}
              multiline
              minRows={3}
              autoFocus
              slotProps={{ htmlInput: { maxLength: MAX_NOTE_LENGTH } }}
            />
            <Box
              sx={(theme) => ({
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
              })}
            >
              {RATING_KEYS.map((key) => (
                <Stack key={key} spacing={0.5}>
                  <Typography variant="body2" color="text.secondary" id={`rating-${key}`}>
                    {t(`rating.${key}`)}
                  </Typography>
                  <Rating
                    max={RATING_MAX}
                    value={ratings[key]}
                    onChange={(_event, value) =>
                      setRatings((current) => ({ ...current, [key]: value }))
                    }
                    aria-labelledby={`rating-${key}`}
                  />
                </Stack>
              ))}
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common:actions.cancel')}</Button>
        <Button type="submit" form={FORM_ID} variant="contained" disabled={!valid} loading={saving}>
          {t('common:actions.save')}
        </Button>
      </DialogActions>
    </>
  );
};
