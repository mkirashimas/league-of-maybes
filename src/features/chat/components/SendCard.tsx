import { ContentCopyOutlined, OpenInNewOutlined } from '@mui/icons-material';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHAT_NAMESPACE, whatsappLink } from '../types';
import { Section } from './Section';

interface SendCardProps {
  phone: string;
}

/** Write (or paste) a message, then copy it or open WhatsApp with it prefilled. */
export const SendCard = ({ phone }: SendCardProps) => {
  const { t } = useTranslation(CHAT_NAMESPACE);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

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
          href={whatsappLink(phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          disabled={!message.trim()}
        >
          {t('send.whatsapp')}
        </Button>
      </Stack>
      {!phone && <Alert severity="info">{t('send.noPhone')}</Alert>}
    </Section>
  );
};
