import { CallMadeOutlined, CallReceivedOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatLogMessageMutation } from '../api';
import {
  CHAT_NAMESPACE,
  computeReminders,
  RULE_KEYS,
  type ChatProfileInput,
  type ChatSettingsInput,
  type ChatState,
  type Reminder,
  type Sender,
} from '../types';
import { Section } from './Section';

interface ChatStateCardProps {
  playerId: string;
  state: ChatState | null;
  settings: ChatSettingsInput;
  profile: ChatProfileInput;
  now: Date;
}

/** Today at HH:mm (local), or now when empty. A time later than now means yesterday. */
const resolveTime = (hhmm: string, now: Date): number => {
  if (!hhmm) return now.getTime();
  const [hours, minutes] = hhmm.split(':').map(Number);
  const at = new Date(now);
  at.setHours(hours, minutes, 0, 0);
  if (at.getTime() > now.getTime()) at.setDate(at.getDate() - 1);
  return at.getTime();
};

export const ChatStateCard = ({ playerId, state, settings, profile, now }: ChatStateCardProps) => {
  const { t, i18n } = useTranslation([CHAT_NAMESPACE, 'common']);
  const [logMessage, { isLoading, isError }] = useChatLogMessageMutation();
  const [time, setTime] = useState('');
  const language = i18n.resolvedLanguage;
  const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const clock = new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' });
  const dayAndTime = new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const ago = (millis: number) => {
    const minutes = Math.round((now.getTime() - millis) / 60_000);
    if (minutes < 60) return relative.format(-minutes, 'minute');
    const hours = Math.round(minutes / 60);
    return hours < 48
      ? relative.format(-hours, 'hour')
      : relative.format(-Math.round(hours / 24), 'day');
  };

  const log = (sender: Sender) => {
    void logMessage({
      playerId,
      sender,
      at: resolveTime(time, now),
      resumeAfterHours: settings.resumeAfterHours,
      previous: state,
    }).then((result) => {
      if (!('error' in result)) setTime('');
    });
  };

  const reminders = computeReminders(state, settings, profile, now);

  const reminderText = (reminder: Reminder) => {
    switch (reminder.rule) {
      case 'noDoubleText':
        return reminder.until !== null
          ? t('reminders.noDoubleText', { date: dayAndTime.format(reminder.until) })
          : t('reminders.noDoubleTextNoDate');
      case 'noInstantReply':
        return t('reminders.noInstantReply', { time: clock.format(reminder.after) });
      case 'matchPace':
        return t('reminders.matchPace', { pace: t(`pace.${reminder.pace}`) });
      default:
        return t(`reminders.${reminder.rule}`);
    }
  };

  const lastAt = state
    ? state.lastSender === 'me'
      ? state.lastOutboundAt
      : state.lastInboundAt
    : null;
  const enabledRules = RULE_KEYS.filter((rule) => settings.rules[rule]);

  return (
    <Section title={t('state.title')}>
      <Typography color={state ? 'text.primary' : 'text.secondary'}>
        {state && lastAt !== null
          ? t(state.lastSender === 'me' ? 'state.lastMe' : 'state.lastThem', { ago: ago(lastAt) })
          : t('state.none')}
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={(theme) => ({
          alignItems: 'center',
          flexWrap: 'wrap',
          [theme.breakpoints.down('sm')]: { flexDirection: 'column', alignItems: 'stretch' },
        })}
      >
        <Button
          variant="outlined"
          startIcon={<CallReceivedOutlined />}
          onClick={() => log('them')}
          loading={isLoading}
        >
          {t('state.theyReplied')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<CallMadeOutlined />}
          onClick={() => log('me')}
          loading={isLoading}
        >
          {t('state.iReplied')}
        </Button>
        <TextField
          size="small"
          type="time"
          label={t('state.at')}
          value={time}
          onChange={(event) => setTime(event.target.value)}
          helperText={t('state.atHelper')}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={(theme) => ({
            width: theme.spacing(20),
            [theme.breakpoints.down('sm')]: { width: '100%' },
          })}
        />
      </Stack>
      {isError && <Alert severity="error">{t('common:saveError')}</Alert>}

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {t('reminders.title')}
        </Typography>
        {state ? (
          reminders.length > 0 ? (
            <Stack spacing={1}>
              {reminders.map((reminder) => (
                <Alert
                  key={reminder.rule}
                  severity={
                    reminder.rule === 'noDoubleText' ||
                    reminder.rule === 'noInstantReply' ||
                    reminder.rule === 'quietHours'
                      ? 'warning'
                      : reminder.rule === 'resumeAfter'
                        ? 'success'
                        : 'info'
                  }
                >
                  {reminderText(reminder)}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">{t('reminders.noneActive')}</Typography>
          )
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('reminders.noState')}
            </Typography>
            <List dense disablePadding sx={{ listStyleType: 'disc', pl: 2.5 }}>
              {enabledRules.map((rule) => (
                <ListItem key={rule} disableGutters sx={{ display: 'list-item' }}>
                  <ListItemText primary={t(`rules.${rule}`)} />
                </ListItem>
              ))}
            </List>
          </>
        )}
      </Box>
    </Section>
  );
};
