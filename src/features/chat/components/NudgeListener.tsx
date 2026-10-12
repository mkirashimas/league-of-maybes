import { Button, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { onForegroundMessage } from '../../../firebase/messaging';
import { CHAT_NAMESPACE } from '../types';

interface ForegroundNudge {
  body: string;
  link: string;
}

/**
 * Shows a nudge that arrives while the app is open (the OS shows nothing then).
 * "Open" goes to the player's chat tab with ?nudge=1, like a click on the notification.
 */
export const NudgeListener = () => {
  const { t } = useTranslation(CHAT_NAMESPACE);
  const navigate = useNavigate();
  const [nudge, setNudge] = useState<ForegroundNudge | null>(null);

  useEffect(
    () =>
      onForegroundMessage((payload) => {
        const link = payload.fcmOptions?.link ?? payload.data?.link;
        if (!link) return;
        // Keep only the path: the link is absolute in the push (it must be for background clicks).
        const path = link.startsWith('http') ? new URL(link).pathname + new URL(link).search : link;
        setNudge({ body: payload.notification?.body ?? t('nudge.foreground'), link: path });
      }),
    [t],
  );

  return (
    <Snackbar
      open={nudge !== null}
      onClose={() => setNudge(null)}
      autoHideDuration={15_000}
      message={nudge?.body}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() => {
            if (nudge) void navigate(nudge.link);
            setNudge(null);
          }}
        >
          {t('nudge.open')}
        </Button>
      }
    />
  );
};
