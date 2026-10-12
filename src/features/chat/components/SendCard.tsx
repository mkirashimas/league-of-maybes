import { AutoAwesomeOutlined, ContentCopyOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatGenerateOpenersMutation } from '../api';
import {
  CHAT_NAMESPACE,
  whatsappLink,
  type ChatProfileInput,
  type ChatSettingsInput,
  type ChatState,
} from '../types';
import { Section } from './Section';

interface SendCardProps {
  playerId: string;
  profile: ChatProfileInput;
  settings: ChatSettingsInput;
  state: ChatState | null;
  /** Increments when openers should be generated without a click (opened from a nudge). */
  openersRequest: number;
}

const languageNameOf = (language: string | undefined) => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(language ?? 'en') ?? 'English';
  } catch {
    return 'English';
  }
};

/** Suggest openers (Gemini), write or pick a message, then copy it or open WhatsApp with it. */
export const SendCard = ({ playerId, profile, settings, state, openersRequest }: SendCardProps) => {
  const { t, i18n } = useTranslation(CHAT_NAMESPACE);
  const [generate, { data: openers, isLoading, isError, reset }] = useChatGenerateOpenersMutation();
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const lastRequest = useRef(0);

  const suggest = () => {
    reset();
    void generate({
      playerId,
      profile,
      settings,
      state,
      languageName: languageNameOf(i18n.resolvedLanguage),
      defaultStyle: t('settings.defaultInstructions'),
    });
  };

  // Opened from a nudge and the user confirmed the chat state: suggest openers once.
  useEffect(() => {
    if (openersRequest > lastRequest.current) {
      lastRequest.current = openersRequest;
      suggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs only when a new request arrives
  }, [openersRequest]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Section title={t('send.title')}>
      <Box>
        <Button
          variant="outlined"
          startIcon={<AutoAwesomeOutlined />}
          onClick={suggest}
          loading={isLoading}
        >
          {t('openers.suggest')}
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
          {t('openers.privacy')}
        </Typography>
      </Box>
      {isError && <Alert severity="error">{t('openers.error')}</Alert>}
      {openers && openers.length === 0 && <Alert severity="info">{t('openers.none')}</Alert>}
      {openers && openers.length > 0 && (
        <Stack spacing={1}>
          {openers.map((opener) => (
            <Paper key={opener.text} variant="outlined" sx={{ p: 1.5 }}>
              <Stack spacing={1}>
                <Typography sx={{ overflowWrap: 'anywhere' }}>{opener.text}</Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Chip size="small" variant="outlined" label={t(`openers.tone.${opener.tone}`)} />
                  <Button size="small" onClick={() => setMessage(opener.text)}>
                    {t('openers.use')}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <TextField
        label={t('send.message')}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        multiline
        minRows={2}
        fullWidth
      />
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          startIcon={<ContentCopyOutlined />}
          onClick={() => void copy()}
          disabled={!message.trim()}
        >
          {copied ? t('send.copied') : t('send.copy')}
        </Button>
        <Button
          variant="contained"
          startIcon={<OpenInNewOutlined />}
          href={whatsappLink(profile.phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!message.trim()}
        >
          {t('send.whatsapp')}
        </Button>
      </Stack>
      {!profile.phone && <Alert severity="info">{t('send.noPhone')}</Alert>}
    </Section>
  );
};
