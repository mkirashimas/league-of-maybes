import { Alert, Box, Button, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAppSelector } from '../../../store';
import { selectCurrentUser } from '../../../store/authSlice';
import { PATHS } from '../../../types';
import { useLegalGetUserDocumentQuery } from '../api';
import { hasAcceptedCurrentTerms, LEGAL_NAMESPACE } from '../types';

export interface ConsentRedirectState {
  /** Where the user was going before being sent to the consent page. */
  from?: string;
}

/** Renders the app only once the signed-in user has accepted the current TERMS_VERSION. */
export const ConsentGate = () => {
  const { t } = useTranslation(LEGAL_NAMESPACE);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();
  const { data, isLoading, isError, refetch } = useLegalGetUserDocumentQuery(user?.uid ?? '', {
    skip: !user,
  });

  if (!user) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8, px: 2 }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              {t('gate.retry')}
            </Button>
          }
        >
          {t('gate.loadError')}
        </Alert>
      </Box>
    );
  }

  if (!hasAcceptedCurrentTerms(data)) {
    const state: ConsentRedirectState = { from: location.pathname + location.search };
    return <Navigate to={PATHS.CONSENT} replace state={state} />;
  }

  return <Outlet />;
};
