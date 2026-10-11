import { ArrowBackOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { generatePath, Outlet, Link as RouterLink, useLocation, useParams } from 'react-router';
import { PATHS } from '../../../types';
import { useRosterGetPlayerQuery } from '../api';
import { ROSTER_NAMESPACE } from '../types';
import { PlayerAvatar } from './PlayerAvatar';
import { StatusChip } from './StatusChip';

const TABS = [
  { key: 'profile', path: PATHS.PLAYER },
  { key: 'intel', path: PATHS.PLAYER_INTEL },
  { key: 'chat', path: PATHS.PLAYER_CHAT },
  { key: 'dates', path: PATHS.PLAYER_DATES },
  { key: 'now', path: PATHS.PLAYER_AGENDA },
  { key: 'keyNotes', path: PATHS.PLAYER_KEY_NOTES },
] as const;

/** Player page shell: header plus one tab per feature. Each feature renders its tab in the Outlet. */
export const PlayerLayout = () => {
  const { t } = useTranslation([ROSTER_NAMESPACE, 'common']);
  const { playerId = '' } = useParams();
  const { pathname } = useLocation();
  const {
    data: player,
    isLoading,
    isError,
  } = useRosterGetPlayerQuery(playerId, {
    skip: !playerId,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !player) {
    return (
      <Stack spacing={2}>
        <Alert severity={isError ? 'error' : 'warning'}>
          {isError ? t('common:loadError') : t('notFound')}
        </Alert>
        <Box>
          <RouterLink to={PATHS.ROSTER}>{t('backToRoster')}</RouterLink>
        </Box>
      </Stack>
    );
  }

  const tabPaths = TABS.map((tab) => generatePath(tab.path, { playerId }));
  const currentTab = Math.max(0, tabPaths.indexOf(pathname.replace(/\/$/, '')));

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', minWidth: 0 }}>
        <Tooltip title={t('backToRoster')}>
          <IconButton
            component={RouterLink}
            to={PATHS.ROSTER}
            aria-label={t('backToRoster')}
            edge="start"
          >
            <ArrowBackOutlined />
          </IconButton>
        </Tooltip>
        <PlayerAvatar nickname={player.nickname} color={player.avatarColor} size="large" />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" noWrap>
            {player.nickname}
          </Typography>
          <StatusChip status={player.status} />
        </Box>
      </Stack>

      <Tabs
        value={currentTab}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={(theme) => ({ borderBottom: `1px solid ${theme.palette.divider}` })}
      >
        {TABS.map((tab, index) => (
          <Tab
            key={tab.key}
            label={t(`tabs.${tab.key}`)}
            component={RouterLink}
            to={tabPaths[index]}
          />
        ))}
      </Tabs>

      <Outlet />
    </Stack>
  );
};
