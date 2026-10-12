import { Alert, Box, Button, CircularProgress, Link, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import { PATHS } from '../../../types';
import { useChatGetChatProfileQuery, useChatGetChatStateQuery } from '../api';
import { useChatSettings } from '../hooks/useChatSettings';
import { useNow } from '../hooks/useNow';
import { CHAT_NAMESPACE, EMPTY_PROFILE, type ChatProfile, type ChatProfileInput } from '../types';
import { AiBriefCard } from './AiBriefCard';
import { ChatProfileForm } from './ChatProfileForm';
import { ChatStateCard } from './ChatStateCard';
import { QuirksLog } from './QuirksLog';
import { SendCard } from './SendCard';

const toInput = (profile: ChatProfile | null | undefined): ChatProfileInput =>
  profile
    ? {
        platform: profile.platform ?? '',
        textingStyle: profile.textingStyle ?? '',
        replyTime: profile.replyTime ?? '',
        initiator: profile.initiator ?? '',
        bestTime: profile.bestTime ?? '',
        topicsThatLand: profile.topicsThatLand ?? [],
        topicsToAvoid: profile.topicsToAvoid ?? [],
        phone: profile.phone ?? '',
        aiNotes: profile.aiNotes ?? '',
      }
    : EMPTY_PROFILE;

/** Player tab "Chat": state and reminders, sending, the AI brief, the chat profile and quirks. */
export const ChatTab = () => {
  const { t } = useTranslation([CHAT_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const now = useNow();
  const profileQuery = useChatGetChatProfileQuery(playerId, { skip: !playerId });
  const stateQuery = useChatGetChatStateQuery(playerId, { skip: !playerId });
  const { settings, isLoading: settingsLoading, isError: settingsFailed } = useChatSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const fromNudge = searchParams.get('nudge') === '1';
  const [openersRequest, setOpenersRequest] = useState(0);

  // Opened from a push: once the user confirms the chat state, drop ?nudge=1 and suggest openers.
  const confirmNudge = () => {
    setSearchParams({}, { replace: true });
    setOpenersRequest((current) => current + 1);
  };

  if (profileQuery.isLoading || stateQuery.isLoading || settingsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (profileQuery.isError || stateQuery.isError || settingsFailed) {
    return <Alert severity="error">{t('common:loadError')}</Alert>;
  }

  const profile = toInput(profileQuery.data);
  const state = stateQuery.data ?? null;

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}
      >
        <Typography variant="h6" component="h2">
          {t('tab.title')}
        </Typography>
        <Link component={RouterLink} to={PATHS.CHAT_SETTINGS} variant="body2">
          {t('tab.settingsLink')}
        </Link>
      </Stack>
      {fromNudge && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={confirmNudge}>
              {t('nudge.confirm')}
            </Button>
          }
        >
          {t('nudge.banner')}
        </Alert>
      )}
      <Box
        sx={(theme) => ({
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 2,
          alignItems: 'start',
          [theme.breakpoints.down('md')]: { gridTemplateColumns: 'minmax(0, 1fr)' },
        })}
      >
        <Stack spacing={2}>
          <ChatStateCard
            playerId={playerId}
            state={state}
            settings={settings}
            profile={profile}
            now={now}
          />
          <SendCard
            playerId={playerId}
            profile={profile}
            settings={settings}
            state={state}
            openersRequest={openersRequest}
          />
          <AiBriefCard playerId={playerId} profile={profile} settings={settings} state={state} />
        </Stack>
        <Stack spacing={2}>
          {/* Remounts when the stored profile fields change (not aiNotes, edited elsewhere). */}
          <ChatProfileForm
            key={JSON.stringify({ ...profile, aiNotes: '' })}
            playerId={playerId}
            profile={profile}
          />
          <QuirksLog playerId={playerId} />
        </Stack>
      </Box>
    </Stack>
  );
};
