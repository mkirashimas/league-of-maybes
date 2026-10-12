import { Link, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router';
import { PATHS } from '../types';

/** "Terms · Privacy" links used in the sidebar footer and on public pages. */
export const LegalLinks = () => {
  const { t } = useTranslation('common');

  return (
    <Stack direction="row" spacing={1} sx={{ typography: 'caption', color: 'text.secondary' }}>
      <Link component={RouterLink} to={PATHS.TERMS} color="inherit">
        {t('legalLinks.terms')}
      </Link>
      <span aria-hidden>·</span>
      <Link component={RouterLink} to={PATHS.PRIVACY} color="inherit">
        {t('legalLinks.privacy')}
      </Link>
    </Stack>
  );
};
