import { Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LEGAL_NAMESPACE, TERMS_VERSION, type LegalSection } from '../types';

interface LegalDocumentProps {
  /** Locale key holding `title` and `sections` (e.g. 'terms' or 'privacy'). */
  documentKey: 'terms' | 'privacy';
}

// DRAFT: needs legal review. The Terms and Privacy texts live in ../locales/*.json.
export const LegalDocument = ({ documentKey }: LegalDocumentProps) => {
  const { t } = useTranslation(LEGAL_NAMESPACE);
  const sections = t(`${documentKey}.sections`, { returnObjects: true }) as LegalSection[];

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 4,
        [theme.breakpoints.down('sm')]: { p: 2 },
      })}
    >
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            {t(`${documentKey}.title`)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('version', { version: TERMS_VERSION })}
          </Typography>
        </Stack>
        {sections.map((section, index) => (
          <Stack key={section.title} spacing={1} component="section">
            <Typography variant="h6" component="h2">
              {index + 1}. {section.title}
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{section.body}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};
