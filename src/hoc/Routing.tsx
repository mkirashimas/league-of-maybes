import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, Route, Routes } from 'react-router';
import { LoginPage } from '../features/auth';
import { ConsentGate, ConsentPage, PrivacyPage, TermsPage } from '../features/legal';
import { useAppSelector } from '../store';
import { selectAuthInitialized, selectCurrentUser } from '../store/authSlice';
import { PATHS } from '../types';
import { Layout } from './Layout';
import { PublicLayout } from './PublicLayout';

// App features load on demand (one chunk per feature); Layout shows a spinner meanwhile.
const roster = () => import('../features/roster');
const LeagueTablePage = lazy(() => roster().then((m) => ({ default: m.LeagueTablePage })));
const PlayerFormPage = lazy(() => roster().then((m) => ({ default: m.PlayerFormPage })));
const PlayerLayout = lazy(() => roster().then((m) => ({ default: m.PlayerLayout })));
const PlayerProfilePage = lazy(() => roster().then((m) => ({ default: m.PlayerProfilePage })));
const TraitSettingsPage = lazy(() => roster().then((m) => ({ default: m.TraitSettingsPage })));
const dates = () => import('../features/dates');
const DatesTab = lazy(() => dates().then((m) => ({ default: m.DatesTab })));
const TimelinePage = lazy(() => dates().then((m) => ({ default: m.TimelinePage })));
const IntelTab = lazy(() => import('../features/intel').then((m) => ({ default: m.IntelTab })));
const KeyNotesTab = lazy(() =>
  import('../features/keyNotes').then((m) => ({ default: m.KeyNotesTab })),
);

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
    <Route element={<PublicLayout />}>
      <Route path={PATHS.LOGIN} element={<LoginPage />} />
      <Route path={PATHS.TERMS} element={<TermsPage />} />
      <Route path={PATHS.PRIVACY} element={<PrivacyPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      {/* Signed in, terms not accepted yet. */}
      <Route element={<PublicLayout />}>
        <Route path={PATHS.CONSENT} element={<ConsentPage />} />
      </Route>

      {/* The app itself: signed in and current terms accepted. */}
      <Route element={<ConsentGate />}>
        <Route element={<Layout />}>
          <Route path={PATHS.HOME} element={<Navigate to={PATHS.ROSTER} replace />} />
          <Route path={PATHS.ROSTER} element={<LeagueTablePage />} />
          <Route path={PATHS.PLAYER_NEW} element={<PlayerFormPage />} />

          {/* Player page: the roster shell with one tab per feature. */}
          <Route element={<PlayerLayout />}>
            <Route path={PATHS.PLAYER} element={<PlayerProfilePage />} />
            <Route path={PATHS.PLAYER_INTEL} element={<IntelTab />} />
            <Route path={PATHS.PLAYER_CHAT} element={<ComingSoon />} />
            <Route path={PATHS.PLAYER_DATES} element={<DatesTab />} />
            <Route path={PATHS.PLAYER_AGENDA} element={<ComingSoon />} />
            <Route path={PATHS.PLAYER_KEY_NOTES} element={<KeyNotesTab />} />
          </Route>

          <Route path={PATHS.TIMELINE} element={<TimelinePage />} />
          <Route path={PATHS.AGENDA} element={<ComingSoon />} />
          <Route path={PATHS.TRAIT_SETTINGS} element={<TraitSettingsPage />} />
          <Route path={PATHS.CHAT_SETTINGS} element={<ComingSoon />} />
          <Route path={PATHS.ACCOUNT} element={<ComingSoon />} />
        </Route>
      </Route>
    </Route>

    <Route path={PATHS.NOT_FOUND} element={<Navigate to={PATHS.HOME} replace />} />
  </Routes>
);
