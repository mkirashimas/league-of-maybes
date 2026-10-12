import { AppBar, Box, Link, Toolbar } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink } from 'react-router';
import { PATHS } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

/** Shell for pages outside the app: Login, Terms, Privacy and Consent. */
export const PublicLayout = () => {
  const { t } = useTranslation('common');

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
      })}
    >
      <AppBar>
        <Toolbar
          sx={(theme) => ({
            gap: 2,
            [theme.breakpoints.down('sm')]: { gap: 1 },
          })}
        >
          <Link
            component={RouterLink}
            to={PATHS.HOME}
            color="inherit"
            underline="none"
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, minWidth: 0, fontWeight: 700 }}
          >
            {t('appName')}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Box>
    </Box>
  );
};
