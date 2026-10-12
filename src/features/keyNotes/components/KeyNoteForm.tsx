import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IMPORTANCE_KEYS,
  IMPORTANCE_LEVELS,
  KEY_NOTE_CATEGORIES,
  KEY_NOTES_NAMESPACE,
  MAX_TEXT_LENGTH,
  type Importance,
  type KeyNoteCategory,
  type KeyNoteValues,
} from '../types';

interface KeyNoteFormProps {
  initial?: KeyNoteValues;
  submitLabel: string;
  saving: boolean;
  /** Resolves true when saved, so the add form can clear itself. */
  onSubmit: (values: KeyNoteValues) => Promise<boolean>;
  resetOnSave?: boolean;
  autoFocus?: boolean;
}

export const KeyNoteForm = ({
  initial,
  submitLabel,
  saving,
  onSubmit,
  resetOnSave = false,
  autoFocus = false,
}: KeyNoteFormProps) => {
  const { t } = useTranslation(KEY_NOTES_NAMESPACE);
  const [category, setCategory] = useState<KeyNoteCategory>(initial?.category ?? 'birthday');
  const [importance, setImportance] = useState<Importance>(initial?.importance ?? 2);
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [text, setText] = useState(initial?.text ?? '');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const saved = await onSubmit({ category, importance, pinned, text: trimmed });
    if (saved && resetOnSave) {
      setText('');
      setPinned(false);
    }
  };

  return (
    <Stack component="form" onSubmit={(event) => void handleSubmit(event)} spacing={2}>
      <Box
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: `${theme.spacing(24)} ${theme.spacing(18)} minmax(0, 1fr)`,
          gap: 2,
          alignItems: 'start',
          [theme.breakpoints.down('md')]: { gridTemplateColumns: '1fr 1fr' },
          [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
        })}
      >
        <TextField
          select
          size="small"
          label={t('form.category')}
          value={category}
          onChange={(event) => setCategory(event.target.value as KeyNoteCategory)}
        >
          {KEY_NOTE_CATEGORIES.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`category.${value}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('form.importance')}
          value={importance}
          onChange={(event) => setImportance(Number(event.target.value) as Importance)}
        >
          {IMPORTANCE_LEVELS.map((level) => (
            <MenuItem key={level} value={level}>
              {t(`importance.${IMPORTANCE_KEYS[level]}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label={t('form.text')}
          placeholder={t(`placeholder.${category}`)}
          value={text}
          onChange={(event) => setText(event.target.value)}
          multiline
          maxRows={4}
          autoFocus={autoFocus}
          slotProps={{ htmlInput: { maxLength: MAX_TEXT_LENGTH } }}
          sx={(theme) => ({ [theme.breakpoints.down('md')]: { gridColumn: '1 / -1' } })}
        />
      </Box>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
          }
          label={t('form.pinned')}
        />
        <Button type="submit" variant="contained" disabled={!text.trim()} loading={saving}>
          {submitLabel}
        </Button>
      </Stack>
    </Stack>
  );
};
