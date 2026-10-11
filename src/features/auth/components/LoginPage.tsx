import GoogleIcon from '@mui/icons-material/Google';
import { Alert, Box, Button, Link, Paper, Stack, Typography } from '@mui/material';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Link as RouterLink } from 'react-router';
import { signInWithGoogle } from '../../../firebase/auth';
import { useAppSelector } from '../../../store';
import { selectCurrentUser } from '../../../store/authSlice';
import { PATHS } from '../../../types';
import { AUTH_NAMESPACE } from '../types';

const IGNORED_ERROR_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

export const LoginPage = () => {
  const { t } = useTranslation([AUTH_NAMESPACE, 'common']);
  const user = useAppSelector(selectCurrentUser);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  if (user) {
    return <Navigate to={PATHS.HOME} replace />;
  }

  const handleSignIn = async () => {
    setPending(true);
    setFailed(false);
    try {
      await signInWithGoogle();
    } catch (error) {
      if (!(error instanceof FirebaseError && IGNORED_ERROR_CODES.includes(error.code))) {
        setFailed(true);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 420 }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Stack spacing={1}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              {t('common:appName')}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {t('common:motto')}
            </Typography>
          </Stack>
          {failed && (
            <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
              {t('signInError')}
            </Alert>
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleSignIn}
            loading={pending}
            fullWidth
          >
            {t('signInWithGoogle')}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {t('privateNote')}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ typography: 'caption', color: 'text.secondary' }}
          >
            <Link component={RouterLink} to={PATHS.TERMS} color="inherit">
              {t('common:legalLinks.terms')}
            </Link>
            <span aria-hidden>·</span>
            <Link component={RouterLink} to={PATHS.PRIVACY} color="inherit">
              {t('common:legalLinks.privacy')}
            </Link>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
