import { CloseOutlined } from '@mui/icons-material';
import {
  Box,
  IconButton,
  InputAdornment,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTraitLabels } from '../hooks/useTraitLabels';
import {
  ROSTER_NAMESPACE,
  SCALE_MAX,
  SCALE_MIN,
  type TraitDefinition,
  type TraitValue,
} from '../types';

interface TraitEditorProps {
  definition: TraitDefinition;
  value: TraitValue | undefined;
  /** null clears the value. */
  onChange: (value: TraitValue | null) => void;
}

const SCALE_MIDDLE = Math.round((SCALE_MIN + SCALE_MAX) / 2);

const ScaleEditor = ({ definition, value, onChange }: TraitEditorProps) => {
  const { t } = useTranslation(ROSTER_NAMESPACE);
  const { traitLabel } = useTraitLabels();
  const saved = typeof value === 'number' ? value : null;
  // Local value while dragging; saved once on release.
  const [dragValue, setDragValue] = useState<number | null>(null);
  const shown = dragValue ?? saved;
  const label = traitLabel(definition);

  return (
    <Box>
      <Stack
        direction="row"
        sx={(theme) => ({
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: theme.spacing(4),
        })}
      >
        <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography variant="body2" color={shown === null ? 'text.secondary' : 'text.primary'}>
            {shown === null ? t('profile.notRated') : shown}
          </Typography>
          {saved !== null && (
            <Tooltip title={t('profile.clear')}>
              <IconButton
                size="small"
                onClick={() => onChange(null)}
                aria-label={t('profile.clear')}
              >
                <CloseOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Slider
        value={shown ?? SCALE_MIDDLE}
        min={SCALE_MIN}
        max={SCALE_MAX}
        step={1}
        marks
        valueLabelDisplay="auto"
        aria-label={label}
        onChange={(_event, next) => setDragValue(next as number)}
        onChangeCommitted={(_event, next) => {
          setDragValue(null);
          onChange(next as number);
        }}
        sx={{ opacity: shown === null ? 0.4 : 1 }}
      />
    </Box>
  );
};

const NumberEditor = ({ definition, value, onChange }: TraitEditorProps) => {
  const { traitLabel, unitLabel } = useTraitLabels();
  const unit = unitLabel(definition);

  return (
    <TextField
      // Remounts when the stored value changes, so the field shows the saved value.
      key={String(value ?? '')}
      label={traitLabel(definition)}
      type="number"
      size="small"
      defaultValue={typeof value === 'number' ? value : ''}
      onBlur={(event) => {
        const raw = event.target.value.trim();
        const next = raw === '' ? null : Number(raw);
        if (next !== null && !Number.isFinite(next)) return;
        if (next !== (typeof value === 'number' ? value : null)) onChange(next);
      }}
      slotProps={{
        input: unit
          ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> }
          : undefined,
        htmlInput: { min: 0 },
      }}
      fullWidth
    />
  );
};

const EnumEditor = ({ definition, value, onChange }: TraitEditorProps) => {
  const { t } = useTranslation(ROSTER_NAMESPACE);
  const { traitLabel, optionLabel } = useTraitLabels();

  return (
    <TextField
      select
      size="small"
      label={traitLabel(definition)}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value === '' ? null : event.target.value)}
      fullWidth
    >
      <MenuItem value="">
        <em>{t('profile.notSet')}</em>
      </MenuItem>
      {definition.options.map((option) => (
        <MenuItem key={option} value={option}>
          {optionLabel(definition, option)}
        </MenuItem>
      ))}
    </TextField>
  );
};

export const TraitEditor = (props: TraitEditorProps) => {
  if (props.definition.kind === 'scale') return <ScaleEditor {...props} />;
  if (props.definition.kind === 'number') return <NumberEditor {...props} />;
  return <EnumEditor {...props} />;
};
