import { AddOutlined, CloseOutlined } from '@mui/icons-material';
import { Alert, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCycleSaveProfileMutation } from '../api';
import { useDateFormat } from '../hooks/useDateFormat';
import { effectiveCycleLength, isIsoDate, sortStarts, todayIso } from '../phase';
import {
  CYCLE_NAMESPACE,
  MAX_CYCLE_LENGTH,
  MAX_PERIOD_LENGTH,
  MIN_CYCLE_LENGTH,
  MIN_PERIOD_LENGTH,
  type CycleProfileInput,
} from '../types';

const range = (min: number, max: number) =>
  Array.from({ length: max - min + 1 }, (_, index) => min + index);

interface CycleSetupCardProps {
  subjectId: string;
  profile: CycleProfileInput;
}

/** Logged period starts and cycle lengths. Every change is saved right away. */
export const CycleSetupCard = ({ subjectId, profile }: CycleSetupCardProps) => {
  const { t } = useTranslation([CYCLE_NAMESPACE, 'common']);
  const formatDate = useDateFormat();
  const [save, { isLoading, isError }] = useCycleSaveProfileMutation();
  const [newStart, setNewStart] = useState(todayIso());

  const starts = sortStarts(profile.periodStarts);
  const { averaged } = effectiveCycleLength(profile);
  const canAdd = isIsoDate(newStart) && newStart <= todayIso() && !starts.includes(newStart);

  const update = (changes: Partial<CycleProfileInput>) =>
    void save({
      subjectId,
      changes: {
        periodStarts: profile.periodStarts,
        cycleLength: profile.cycleLength,
        periodLength: profile.periodLength,
        ...changes,
      },
    });

  return (
    <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          {t('setup.title')}
        </Typography>
        <Typography color="text.secondary">{t('setup.intro')}</Typography>
        {isError && <Alert severity="error">{t('common:saveError')}</Alert>}

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <TextField
            label={t('setup.startDate')}
            type="date"
            size="small"
            value={newStart}
            onChange={(event) => setNewStart(event.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayIso() } }}
          />
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            disabled={!canAdd}
            loading={isLoading}
            onClick={() => update({ periodStarts: [newStart, ...starts] })}
          >
            {t('setup.addStart')}
          </Button>
        </Stack>

        {starts.length === 0 ? (
          <Typography color="text.secondary">{t('setup.noStarts')}</Typography>
        ) : (
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {starts.map((start) => (
              <Chip
                key={start}
                label={formatDate(start)}
                onDelete={() => update({ periodStarts: starts.filter((item) => item !== start) })}
                deleteIcon={<CloseOutlined aria-label={t('setup.removeStart')} />}
              />
            ))}
          </Stack>
        )}

        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label={t('setup.cycleLength')}
            value={profile.cycleLength}
            onChange={(event) => update({ cycleLength: Number(event.target.value) })}
            helperText={averaged ? t('setup.cycleLengthAveraged') : t('setup.cycleLengthHelper')}
            sx={(theme) => ({ minWidth: theme.spacing(22), flex: 1 })}
          >
            {range(MIN_CYCLE_LENGTH, MAX_CYCLE_LENGTH).map((value) => (
              <MenuItem key={value} value={value}>
                {t('setup.days', { value })}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label={t('setup.periodLength')}
            value={profile.periodLength}
            onChange={(event) => update({ periodLength: Number(event.target.value) })}
            sx={(theme) => ({ minWidth: theme.spacing(22), flex: 1 })}
          >
            {range(MIN_PERIOD_LENGTH, MAX_PERIOD_LENGTH).map((value) => (
              <MenuItem key={value} value={value}>
                {t('setup.days', { value })}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>
    </Paper>
  );
};
