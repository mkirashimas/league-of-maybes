import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { INTEL_CATEGORIES, INTEL_NAMESPACE, MAX_TEXT_LENGTH, type IntelCategory } from '../types';

interface IntelFormProps {
  initialCategory?: IntelCategory;
  initialText?: string;
  submitLabel: string;
  saving: boolean;
  /** Resolves true when saved, so a new-entry form can clear itself. */
  onSubmit: (values: { category: IntelCategory; text: string }) => Promise<boolean>;
  /** Clears the text after a successful save (the add form). */
  resetOnSave?: boolean;
  autoFocus?: boolean;
}

export const IntelForm = ({
  initialCategory = 'howWeMet',
  initialText = '',
  submitLabel,
  saving,
  onSubmit,
  resetOnSave = false,
  autoFocus = false,
}: IntelFormProps) => {
  const { t } = useTranslation(INTEL_NAMESPACE);
  const [category, setCategory] = useState<IntelCategory>(initialCategory);
  const [text, setText] = useState(initialText);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const saved = await onSubmit({ category, text: trimmed });
    if (saved && resetOnSave) setText('');
  };

  return (
    <Stack
      component="form"
      onSubmit={(event) => void handleSubmit(event)}
      direction="row"
      spacing={2}
      useFlexGap
      sx={(theme) => ({
        alignItems: 'flex-start',
        [theme.breakpoints.down('sm')]: { flexDirection: 'column', alignItems: 'stretch' },
      })}
    >
      <TextField
        select
        size="small"
        label={t('form.category')}
        value={category}
        onChange={(event) => setCategory(event.target.value as IntelCategory)}
        sx={(theme) => ({ minWidth: theme.spacing(22) })}
      >
        {INTEL_CATEGORIES.map((value) => (
          <MenuItem key={value} value={value}>
            {t(`category.${value}`)}
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
        maxRows={6}
        fullWidth
        autoFocus={autoFocus}
        slotProps={{ htmlInput: { maxLength: MAX_TEXT_LENGTH } }}
      />
      <Button type="submit" variant="contained" disabled={!text.trim()} loading={saving}>
        {submitLabel}
      </Button>
    </Stack>
  );
};
