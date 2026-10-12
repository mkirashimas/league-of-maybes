import { Alert, Autocomplete, Box, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatSetChatProfileMutation } from '../api';
import {
  CHAT_NAMESPACE,
  isValidPhone,
  PROFILE_COMPLETENESS_FIELDS,
  PROFILE_OPTIONS,
  profileCompleteness,
  type ChatProfileInput,
  type ProfileOptionField,
} from '../types';
import { Section } from './Section';

interface ChatProfileFormProps {
  playerId: string;
  /** The stored profile (or the empty one); the form copies it on mount. */
  profile: ChatProfileInput;
}

const OPTION_FIELDS = Object.keys(PROFILE_OPTIONS) as ProfileOptionField[];

export const ChatProfileForm = ({ playerId, profile }: ChatProfileFormProps) => {
  const { t } = useTranslation([CHAT_NAMESPACE, 'common']);
  const [setProfile, { isLoading, isError, isSuccess, reset }] = useChatSetChatProfileMutation();
  const [values, setValues] = useState<ChatProfileInput>(profile);
  const [touched, setTouched] = useState(false);

  const phoneInvalid = !isValidPhone(values.phone);
  const filled = profileCompleteness(values);

  const update = (changes: Partial<ChatProfileInput>) => {
    reset();
    setValues((current) => ({ ...current, ...changes }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (phoneInvalid) return;
    // aiNotes is edited in the AI brief card; leave it out so this form never overwrites it.
    const { aiNotes: _aiNotes, ...changes } = values;
    void _aiNotes;
    void setProfile({ playerId, changes });
  };

  const topicsField = (field: 'topicsThatLand' | 'topicsToAvoid') => (
    <Autocomplete
      multiple
      freeSolo
      options={[]}
      value={values[field]}
      onChange={(_event, next) =>
        update({ [field]: next.map((item) => item.trim()).filter(Boolean) })
      }
      renderValue={(selected, getItemProps) =>
        selected.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} size="small" label={option} {...itemProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          label={t(`profile.${field}`)}
          helperText={t('profile.topicsHelper')}
        />
      )}
    />
  );

  return (
    <Section
      title={t('profile.title')}
      aside={
        <Chip
          size="small"
          color={filled === PROFILE_COMPLETENESS_FIELDS.length ? 'success' : 'default'}
          label={t('profile.completeness', { filled, total: PROFILE_COMPLETENESS_FIELDS.length })}
        />
      }
    >
      <Stack component="form" onSubmit={handleSubmit} spacing={2} noValidate>
        <Box
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
          })}
        >
          {OPTION_FIELDS.map((field) => (
            <TextField
              key={field}
              select
              size="small"
              label={t(`profile.${field}`)}
              value={values[field]}
              onChange={(event) => update({ [field]: event.target.value })}
            >
              <MenuItem value="">
                <em>{t('profile.notSet')}</em>
              </MenuItem>
              {PROFILE_OPTIONS[field].map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`option.${field}.${option}`)}
                </MenuItem>
              ))}
            </TextField>
          ))}
          <TextField
            size="small"
            label={t('profile.phone')}
            value={values.phone}
            onChange={(event) => update({ phone: event.target.value.replace(/\D/g, '') })}
            error={touched && phoneInvalid}
            helperText={
              touched && phoneInvalid ? t('profile.phoneInvalid') : t('profile.phoneHelper')
            }
            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 15 } }}
          />
        </Box>
        {topicsField('topicsThatLand')}
        {topicsField('topicsToAvoid')}
        {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: 'center', justifyContent: 'flex-end' }}
        >
          {isSuccess && (
            <Box sx={{ typography: 'body2', color: 'success.main' }}>{t('profile.saved')}</Box>
          )}
          <Button type="submit" variant="contained" loading={isLoading}>
            {t('common:actions.save')}
          </Button>
        </Stack>
      </Stack>
    </Section>
  );
};
