import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDatesCreateDateMutation, useDatesUpdateDateMutation } from '../api';
import {
  DATES_NAMESPACE,
  OUTCOMES,
  RATING_MAX,
  RATING_MIN,
  todayIso,
  type DateInput,
  type DateRecord,
  type Outcome,
} from '../types';

const FORM_ID = 'date-form';
const DEFAULT_RATING = 7;

interface DateFormProps {
  playerId: string;
  /** The date being edited, or undefined for a new one. */
  existing?: DateRecord;
  onSubmit: (input: DateInput) => void;
}

/** The form itself, mounted fresh on every open so it starts from `existing`. */
const DateForm = ({ playerId, existing, onSubmit }: DateFormProps) => {
  const { t } = useTranslation(DATES_NAMESPACE);
  const [date, setDate] = useState(existing?.date ?? todayIso());
  const [activity, setActivity] = useState(existing?.activity ?? '');
  const [venue, setVenue] = useState(existing?.venue ?? '');
  const [rated, setRated] = useState(existing ? existing.rating !== null : true);
  const [rating, setRating] = useState(existing?.rating ?? DEFAULT_RATING);
  const [outcome, setOutcome] = useState<Outcome>(existing?.outcome ?? 'good');
  const [highlights, setHighlights] = useState(existing?.highlights ?? '');
  const [nextStep, setNextStep] = useState(existing?.nextStep ?? '');
  const [touched, setTouched] = useState(false);

  const dateMissing = date === '';

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (dateMissing) return;
    onSubmit({
      playerId,
      date,
      activity: activity.trim(),
      venue: venue.trim(),
      rating: rated ? rating : null,
      outcome,
      highlights: highlights.trim(),
      nextStep: nextStep.trim(),
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
      <Box
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
          [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
        })}
      >
        <TextField
          label={t('form.date')}
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
          error={touched && dateMissing}
          helperText={touched && dateMissing ? t('form.dateRequired') : undefined}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          select
          label={t('form.outcome')}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value as Outcome)}
        >
          {OUTCOMES.map((value) => (
            <MenuItem key={value} value={value}>
              {t(`outcome.${value}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t('form.activity')}
          value={activity}
          onChange={(event) => setActivity(event.target.value)}
          helperText={t('form.activityHelper')}
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
        <TextField
          label={t('form.venue')}
          value={venue}
          onChange={(event) => setVenue(event.target.value)}
          slotProps={{ htmlInput: { maxLength: 80 } }}
        />
      </Box>

      <Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <FormControlLabel
            control={
              <Switch checked={rated} onChange={(event) => setRated(event.target.checked)} />
            }
            label={t('form.rating')}
          />
          <Typography variant="h6" component="p" color={rated ? 'text.primary' : 'text.secondary'}>
            {rated ? rating : t('form.ratingNone')}
          </Typography>
        </Stack>
        <Slider
          value={rating}
          min={RATING_MIN}
          max={RATING_MAX}
          step={1}
          marks
          disabled={!rated}
          valueLabelDisplay="auto"
          aria-label={t('form.rating')}
          onChange={(_event, value) => setRating(value as number)}
        />
      </Box>

      <TextField
        label={t('form.highlights')}
        value={highlights}
        onChange={(event) => setHighlights(event.target.value)}
        multiline
        minRows={3}
        slotProps={{ htmlInput: { maxLength: 2000 } }}
      />
      <TextField
        label={t('form.nextStep')}
        value={nextStep}
        onChange={(event) => setNextStep(event.target.value)}
        helperText={t('form.nextStepHelper')}
        slotProps={{ htmlInput: { maxLength: 200 } }}
      />
    </Stack>
  );
};

interface DateFormDialogProps {
  open: boolean;
  playerId: string;
  existing?: DateRecord;
  onClose: () => void;
}

export const DateFormDialog = ({ open, playerId, existing, onClose }: DateFormDialogProps) => {
  const { t } = useTranslation([DATES_NAMESPACE, 'common']);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [createDate, createState] = useDatesCreateDateMutation();
  const [updateDate, updateState] = useDatesUpdateDateMutation();

  const handleClose = () => {
    createState.reset();
    updateState.reset();
    onClose();
  };

  const handleSubmit = async (input: DateInput) => {
    const result = existing
      ? await updateDate({ dateId: existing.id, input })
      : await createDate(input);
    if (!('error' in result)) handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle>{existing ? t('form.titleEdit') : t('form.titleNew')}</DialogTitle>
      <DialogContent>
        {open && (
          <DateForm
            playerId={playerId}
            existing={existing}
            onSubmit={(input) => void handleSubmit(input)}
          />
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
