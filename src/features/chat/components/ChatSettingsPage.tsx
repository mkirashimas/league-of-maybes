import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatSetChatSettingsMutation } from '../api';
import { useChatSettings } from '../hooks/useChatSettings';
import { NudgesCard } from './NudgesCard';
import {
  browserTimeZone,
  CHAT_NAMESPACE,
  RULE_KEYS,
  type ChatSettingsInput,
  type RuleKey,
} from '../types';

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
    <Stack spacing={2}>
      <Typography variant="h6" component="h2">
        {title}
      </Typography>
      {children}
    </Stack>
  </Paper>
);

const SettingsForm = ({ initial }: { initial: ChatSettingsInput }) => {
  const { t } = useTranslation([CHAT_NAMESPACE, 'common']);
  const [save, { isLoading, isError, isSuccess, reset }] = useChatSetChatSettingsMutation();
  const [values, setValues] = useState(initial);

  const update = (changes: Partial<ChatSettingsInput>) => {
    reset();
    setValues((current) => ({ ...current, ...changes }));
  };

  const toggleRule = (rule: RuleKey, enabled: boolean) =>
    update({ rules: { ...values.rules, [rule]: enabled } });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void save({
      aiInstructions: values.aiInstructions.trim(),
      rules: values.rules,
      resumeAfterHours: Math.max(1, Math.round(values.resumeAfterHours)),
      minReplyDelayMin: Math.max(0, Math.round(values.minReplyDelayMin)),
      quietHours: values.quietHours,
      timeZone: browserTimeZone(),
    });
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={2} noValidate>
      <Card title={t('settings.aiTitle')}>
        <TextField
          label={t('settings.aiInstructions')}
          value={values.aiInstructions}
          onChange={(event) => update({ aiInstructions: event.target.value })}
          placeholder={t('settings.defaultInstructions')}
          helperText={t('settings.aiInstructionsHelper')}
          multiline
          minRows={4}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
        />
      </Card>

      <Card title={t('settings.rulesTitle')}>
        <Stack>
          {RULE_KEYS.map((rule) => (
            <FormControlLabel
              key={rule}
              control={
                <Switch
                  checked={values.rules[rule]}
                  onChange={(event) => toggleRule(rule, event.target.checked)}
                />
              }
              label={t(`rules.${rule}`)}
            />
          ))}
        </Stack>
      </Card>

      <Card title={t('settings.timingTitle')}>
        <Box
          sx={(theme) => ({
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            [theme.breakpoints.down('sm')]: { gridTemplateColumns: '1fr' },
          })}
        >
          <TextField
            type="number"
            label={t('settings.resumeAfterHours')}
            helperText={t('settings.resumeAfterHelper')}
            value={values.resumeAfterHours}
            onChange={(event) => update({ resumeAfterHours: Number(event.target.value) })}
            slotProps={{ htmlInput: { min: 1, max: 720 } }}
          />
          <TextField
            type="number"
            label={t('settings.minReplyDelayMin')}
            helperText={t('settings.minReplyDelayHelper')}
            value={values.minReplyDelayMin}
            onChange={(event) => update({ minReplyDelayMin: Number(event.target.value) })}
            slotProps={{ htmlInput: { min: 0, max: 1440 } }}
          />
          <TextField
            type="time"
            label={t('settings.quietStart')}
            value={values.quietHours.start}
            onChange={(event) =>
              update({ quietHours: { ...values.quietHours, start: event.target.value } })
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            type="time"
            label={t('settings.quietEnd')}
            value={values.quietHours.end}
            onChange={(event) =>
              update({ quietHours: { ...values.quietHours, end: event.target.value } })
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t('settings.timeZone', { zone: browserTimeZone() })}
        </Typography>
      </Card>

      {isError && <Alert severity="error">{t('common:saveError')}</Alert>}
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        {isSuccess && (
          <Box sx={{ typography: 'body2', color: 'success.main' }}>{t('settings.saved')}</Box>
        )}
        <Button type="submit" variant="contained" loading={isLoading}>
          {t('common:actions.save')}
        </Button>
      </Stack>
    </Stack>
  );
};

/** Chat settings: AI instructions, rule toggles, timings and quiet hours. */
export const ChatSettingsPage = () => {
  const { t } = useTranslation([CHAT_NAMESPACE, 'common']);
  const { settings, stored, isLoading, isError } = useChatSettings();
  const [saveSettings] = useChatSetChatSettingsMutation();

  // Keep the stored time zone current (the nudge function uses it for quiet hours).
  useEffect(() => {
    if (stored && stored.timeZone !== browserTimeZone()) {
      void saveSettings({ timeZone: browserTimeZone() });
    }
  }, [stored, saveSettings]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          {t('settings.title')}
        </Typography>
        <Typography color="text.secondary">{t('settings.intro')}</Typography>
      </Box>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Alert severity="error">{t('common:loadError')}</Alert>
      ) : (
        <>
          <NudgesCard enabled={settings.nudgesEnabled} />
          <SettingsForm initial={settings} />
        </>
      )}
    </Stack>
  );
};
