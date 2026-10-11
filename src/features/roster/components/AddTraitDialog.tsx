import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useRosterUpsertTraitDefinitionMutation } from '../api';
import {
  MAX_TRAIT_WEIGHT,
  ROSTER_NAMESPACE,
  toTraitKey,
  TRAIT_KINDS,
  type TraitKind,
} from '../types';

const FORM_ID = 'add-trait-form';

interface AddTraitDialogProps {
  open: boolean;
  /** Order given to the new trait (after the existing ones). */
  nextOrder: number;
  onClose: () => void;
}

const parseOptions = (raw: string) =>
  Array.from(
    new Set(
      raw
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean),
    ),
  );

export const AddTraitDialog = ({ open, nextOrder, onClose }: AddTraitDialogProps) => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const [upsert, { isLoading, isError, reset }] = useRosterUpsertTraitDefinitionMutation();
  const [label, setLabel] = useState('');
  const [kind, setKind] = useState<TraitKind>('scale');
  const [unit, setUnit] = useState('');
  const [options, setOptions] = useState('');
  const [weight, setWeight] = useState(1);
  const [touched, setTouched] = useState(false);

  const labelMissing = label.trim() === '';
  const optionsMissing = kind === 'enum' && parseOptions(options).length < 2;

  const handleClose = () => {
    setLabel('');
    setKind('scale');
    setUnit('');
    setOptions('');
    setWeight(1);
    setTouched(false);
    reset();
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (labelMissing || optionsMissing) return;
    const result = await upsert({
      key: toTraitKey(label),
      builtIn: false,
      customLabel: label.trim(),
      kind,
      unit: kind === 'number' ? unit.trim() : '',
      options: kind === 'enum' ? parseOptions(options) : [],
      weight: kind === 'scale' ? weight : 0,
      order: nextOrder,
      active: true,
    });
    if (!('error' in result)) handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('traitSettings.addTitle')}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id={FORM_ID}
          onSubmit={(event) => void handleSubmit(event)}
          spacing={2}
          sx={{ pt: 1 }}
          noValidate
        >
          <TextField
            label={t('traitSettings.label')}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            required
            autoFocus
            error={touched && labelMissing}
            slotProps={{ htmlInput: { maxLength: 30 } }}
          />
          <TextField
            select
            label={t('traitSettings.kind')}
            value={kind}
            onChange={(event) => setKind(event.target.value as TraitKind)}
          >
            {TRAIT_KINDS.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`kind.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          {kind === 'scale' && (
            <TextField
              select
              label={t('traitSettings.weight')}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
              helperText={t('traitSettings.weightHelper')}
            >
              {Array.from({ length: MAX_TRAIT_WEIGHT + 1 }, (_, value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
          )}
          {kind === 'number' && (
            <TextField
              label={t('traitSettings.unit')}
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 10 } }}
            />
          )}
          {kind === 'enum' && (
            <TextField
              label={t('traitSettings.options')}
              value={options}
              onChange={(event) => setOptions(event.target.value)}
              error={touched && optionsMissing}
              helperText={t('traitSettings.optionsHelper')}
            />
          )}
          {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common:actions.cancel')}</Button>
        <Button type="submit" form={FORM_ID} variant="contained" loading={isLoading}>
          {t('common:actions.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
