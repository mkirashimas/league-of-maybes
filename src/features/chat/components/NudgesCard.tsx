import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  deletePushToken,
  getPushSupport,
  requestPushToken,
  type PushSupport,
} from '../../../firebase/messaging';
import {
  useChatRegisterDeviceMutation,
  useChatRemoveDeviceMutation,
  useChatSetChatSettingsMutation,
} from '../api';
import { browserTimeZone, CHAT_NAMESPACE, DEVICE_ID_STORAGE_KEY } from '../types';

const readDeviceId = () => {
  try {
    return localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeDeviceId = (deviceId: string | null) => {
  try {
    if (deviceId) localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    else localStorage.removeItem(DEVICE_ID_STORAGE_KEY);
  } catch {
    // Storage can be unavailable; the device doc then stays until the account is deleted.
  }
};

type Problem = 'denied' | 'unsupported' | 'failed' | null;

/**
 * Nudges on/off. Turning them on asks for notification permission (only from this click),
 * saves this browser's push token in `devices`, and stores the time zone for quiet hours.
 */
export const NudgesCard = ({ enabled }: { enabled: boolean }) => {
  const { t, i18n } = useTranslation(CHAT_NAMESPACE);
  const [support, setSupport] = useState<PushSupport | null>(null);
  const [deviceId, setDeviceId] = useState(readDeviceId);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [detail, setDetail] = useState('');
  const [registerDevice] = useChatRegisterDeviceMutation();
  const [removeDevice] = useChatRemoveDeviceMutation();
  const [saveSettings] = useChatSetChatSettingsMutation();

  useEffect(() => {
    void getPushSupport().then(setSupport);
  }, []);

  const addThisDevice = async () => {
    const token = await requestPushToken();
    if (!token) {
      setProblem(Notification.permission === 'denied' ? 'denied' : 'unsupported');
      return false;
    }
    const id = await registerDevice({ token, language: i18n.resolvedLanguage ?? 'en' }).unwrap();
    writeDeviceId(id);
    setDeviceId(id);
    return true;
  };

  const turnOn = async () => {
    if (await addThisDevice()) {
      await saveSettings({ nudgesEnabled: true, timeZone: browserTimeZone() }).unwrap();
    }
  };

  const turnOff = async () => {
    if (deviceId) await removeDevice(deviceId).unwrap();
    await deletePushToken();
    writeDeviceId(null);
    setDeviceId(null);
    await saveSettings({ nudgesEnabled: false }).unwrap();
  };

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setProblem(null);
    setDetail('');
    try {
      await action();
    } catch (error) {
      // Keep the real reason visible: push setup fails for browser-specific reasons.
      console.error('Changing nudges failed', error);
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
      const message = error instanceof Error ? error.message : String(error);
      setDetail(code ? `${code}: ${message}` : message);
      setProblem('failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Paper variant="outlined" sx={(theme) => ({ p: 3, [theme.breakpoints.down('sm')]: { p: 2 } })}>
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          {t('nudges.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('nudges.intro')}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              disabled={busy || support === 'unsupported'}
              onChange={(event) => void run(event.target.checked ? turnOn : turnOff)}
            />
          }
          label={enabled ? t('nudges.on') : t('nudges.off')}
        />
        {enabled && !deviceId && support === 'supported' && (
          <Box>
            <Button onClick={() => void run(addThisDevice)} loading={busy}>
              {t('nudges.addDevice')}
            </Button>
          </Box>
        )}
        {enabled && deviceId && (
          <Typography variant="body2" color="success.main">
            {t('nudges.thisDevice')}
          </Typography>
        )}
        {(support === 'unsupported' || problem === 'unsupported') && (
          <Alert severity="info">{t('nudges.unsupported')}</Alert>
        )}
        {(support === 'denied' || problem === 'denied') && (
          <Alert severity="warning">{t('nudges.denied')}</Alert>
        )}
        {problem === 'failed' && (
          <Alert severity="error">
            {t('nudges.failed')}
            {detail && (
              <Typography
                variant="caption"
                component="div"
                sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
              >
                {detail}
              </Typography>
            )}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};
