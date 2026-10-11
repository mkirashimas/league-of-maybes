import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { LoginPage } from '../features/auth';
import { useAppSelector } from '../store';
import { selectAuthInitialized, selectCurrentUser } from '../store/authSlice';
import { PATHS } from '../types';
import { Layout } from './Layout';

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
    <CircularProgress />
  </Box>
);

const ProtectedRoute = () => {
  const user = useAppSelector(selectCurrentUser);
  const initialized = useAppSelector(selectAuthInitialized);

  if (!initialized) {
    return <Loading />;
  }

  return user ? <Outlet /> : <Navigate to={PATHS.LOGIN} replace />;
};

/** Placeholder for sections whose feature lands in a later stage. */
const ComingSoon = () => {
  const { t } = useTranslation('common');

  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h6" component="h1" gutterBottom>
        {t('comingSoon.title')}
      </Typography>
      <Typography color="text.secondary">{t('comingSoon.body')}</Typography>
    </Paper>
  );
};

export const Routing = () => (
  <Routes>
    <Route path={PATHS.LOGIN} element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path={PATHS.HOME} element={<Navigate to={PATHS.ROSTER} replace />} />
        <Route path={PATHS.ROSTER} element={<ComingSoon />} />
        <Route path={PATHS.TIMELINE} element={<ComingSoon />} />
        <Route path={PATHS.AGENDA} element={<ComingSoon />} />
        <Route path={PATHS.TRAIT_SETTINGS} element={<ComingSoon />} />
        <Route path={PATHS.CHAT_SETTINGS} element={<ComingSoon />} />
        <Route path={PATHS.ACCOUNT} element={<ComingSoon />} />
      </Route>
    </Route>
    <Route path={PATHS.NOT_FOUND} element={<Navigate to={PATHS.HOME} replace />} />
  </Routes>
);
