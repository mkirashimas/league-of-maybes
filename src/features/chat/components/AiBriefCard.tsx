import { ContentCopyOutlined } from '@mui/icons-material';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatSetChatProfileMutation, useLazyChatGetBriefContextQuery } from '../api';
import { buildBrief } from '../brief';
import {
  CHAT_NAMESPACE,
  type ChatProfileInput,
  type ChatSettingsInput,
  type ChatState,
} from '../types';
import { Section } from './Section';

interface AiBriefCardProps {
  playerId: string;
  profile: ChatProfileInput;
  settings: ChatSettingsInput;
  state: ChatState | null;
}

/** Copies a ready-made brief for the user's own AI tool. The brief is built on click, never stored. */
export const AiBriefCard = ({ playerId, profile, settings, state }: AiBriefCardProps) => {
  const { t, i18n } = useTranslation([CHAT_NAMESPACE, 'common']);
  const [fetchContext, { isFetching }] = useLazyChatGetBriefContextQuery();
  const [setProfile, { isError: saveFailed }] = useChatSetChatProfileMutation();
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    try {
      const context = await fetchContext(playerId).unwrap();
      const brief = buildBrief({
        t,
        language: i18n.resolvedLanguage,
        context,
        profile,
        settings,
        state,
        now: new Date(),
      });
      await navigator.clipboard.writeText(brief);
      setStatus('copied');
      window.setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('failed');
    }
  };

  return (
    <Section title={t('brief.title')}>
      <Typography variant="body2" color="text.secondary">
        {t('brief.intro')}
      </Typography>
      <Box>
        <Button
          variant="contained"
          startIcon={<ContentCopyOutlined />}
          onClick={() => void copy()}
          loading={isFetching}
        >
          {status === 'copied' ? t('brief.copied') : t('brief.copy')}
        </Button>
      </Box>
      {status === 'failed' && <Alert severity="error">{t('brief.copyError')}</Alert>}
      <TextField
        // Remounts when the stored notes change, so the field shows the saved value.
        key={profile.aiNotes}
        label={t('brief.aiNotes')}
        helperText={t('brief.aiNotesHelper')}
        defaultValue={profile.aiNotes}
        onBlur={(event) => {
          const aiNotes = event.target.value.trim();
          if (aiNotes !== profile.aiNotes) void setProfile({ playerId, changes: { aiNotes } });
        }}
        multiline
        minRows={2}
        fullWidth
        slotProps={{ htmlInput: { maxLength: 1000 } }}
      />
      {saveFailed && <Alert severity="error">{t('common:saveError')}</Alert>}
    </Section>
  );
};
