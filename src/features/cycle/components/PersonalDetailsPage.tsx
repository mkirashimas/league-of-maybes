import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCycleGetPersonalSettingsQuery, useCycleSavePersonalSettingsMutation } from '../api';
import {
  CYCLE_NAMESPACE,
  GENDERS,
  MAX_HEALTH_NOTES_LENGTH,
  SELF_ID,
  type Gender,
  type PersonalSettings,
} from '../types';
import { CyclePanel } from './CyclePanel';

/** The user's own details: gender, health notes and, for women, their cycle. */
export const PersonalDetailsPage = () => {
  const { t } = useTranslation([CYCLE_NAMESPACE, 'common']);
  const { data: settings, isLoading, isError } = useCycleGetPersonalSettingsQuery();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          {t('personal.title')}
        </Typography>
        <Typography color="text.secondary">{t('personal.intro')}</Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : (
        <>
          {/* Keyed on the stored values, so the form picks up changes saved elsewhere. */}
          <DetailsForm
            key={`${settings?.gender ?? ''}|${settings?.healthNotes ?? ''}`}
            settings={settings ?? null}
          />
          {settings?.gender === 'female' && <CyclePanel subjectId={SELF_ID} />}
        </>
      )}
    </Stack>
  );
};

const DetailsForm = ({ settings }: { settings: PersonalSettings | null }) => {
  const { t } = useTranslation([CYCLE_NAMESPACE, 'common']);
  const [save, { isLoading, isError }] = useCycleSavePersonalSettingsMutation();
  const [healthNotes, setHealthNotes] = useState(settings?.healthNotes ?? '');
  const storedNotes = settings?.healthNotes ?? '';

  return (
    <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
      <Stack spacing={2}>
        {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
        <TextField
          select
          label={t('personal.gender')}
          value={settings?.gender ?? ''}
          onChange={(event) => void save({ gender: event.target.value as Gender })}
          helperText={t('personal.genderHelper')}
          sx={(theme) => ({ maxWidth: theme.spacing(40) })}
        >
          <MenuItem value="">{t('gender.unset')}</MenuItem>
          {GENDERS.map((gender) => (
            <MenuItem key={gender} value={gender}>
              {t(`gender.${gender}`)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t('health.label')}
          placeholder={t('health.placeholder')}
          helperText={t('health.helper')}
          value={healthNotes}
          onChange={(event) => setHealthNotes(event.target.value)}
          multiline
          minRows={3}
          slotProps={{ htmlInput: { maxLength: MAX_HEALTH_NOTES_LENGTH } }}
        />
        <Box>
          <Button
            variant="contained"
            disabled={healthNotes.trim() === storedNotes}
            loading={isLoading}
            onClick={() => void save({ healthNotes: healthNotes.trim() })}
          >
            {t('common:actions.save')}
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};
