import {
  EventOutlined,
  ForumOutlined,
  LeaderboardOutlined,
  Menu as MenuIcon,
  TimelineOutlined,
  TuneOutlined,
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Container,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation } from 'react-router';
import { signOut } from '../firebase/auth';
import { useAppSelector } from '../store';
import { selectCurrentUser } from '../store/authSlice';
import { PATHS } from '../types';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LegalLinks } from './LegalLinks';
import { ThemeToggle } from './ThemeToggle';

const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { key: 'leagueTable', to: PATHS.ROSTER, icon: <LeaderboardOutlined /> },
  { key: 'timeline', to: PATHS.TIMELINE, icon: <TimelineOutlined /> },
  { key: 'upcoming', to: PATHS.AGENDA, icon: <EventOutlined /> },
  { key: 'traits', to: PATHS.TRAIT_SETTINGS, icon: <TuneOutlined /> },
  { key: 'chatSettings', to: PATHS.CHAT_SETTINGS, icon: <ForumOutlined /> },
] as const;

export const Layout = () => {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useAppSelector(selectCurrentUser);
  const { pathname } = useLocation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = () => {
    setMenuAnchor(null);
    void signOut();
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <AppBar sx={(theme) => ({ zIndex: theme.zIndex.drawer + 1 })}>
        <Toolbar
          sx={(theme) => ({
            gap: 2,
            [theme.breakpoints.down('sm')]: { gap: 1 },
          })}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={t('openMenu')}
            sx={(theme) => ({
              display: 'none',
              [theme.breakpoints.down('md')]: { display: 'inline-flex' },
            })}
          >
            <MenuIcon />
          </IconButton>

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

          <Tooltip title={t('account')}>
            <IconButton
              onClick={(event: MouseEvent<HTMLElement>) => setMenuAnchor(event.currentTarget)}
              aria-label={t('account')}
              sx={{ p: 0 }}
            >
              <Avatar src={user?.photoURL ?? undefined} alt={user?.displayName ?? ''} />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem disabled>
              <ListItemText primary={user?.displayName} secondary={user?.email} />
            </MenuItem>
            <MenuItem component={RouterLink} to={PATHS.ACCOUNT} onClick={() => setMenuAnchor(null)}>
              {t('account')}
            </MenuItem>
            <MenuItem onClick={handleSignOut}>{t('signOut')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={(theme) => ({
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
          // The temporary drawer's root is the full-screen modal.
          [theme.breakpoints.down('md')]: { width: 'auto' },
        })}
      >
        <Toolbar />
        <Box component="nav" sx={{ p: 1.5, flexGrow: 1 }}>
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {NAV_ITEMS.map((item) => (
              <ListItemButton
                key={item.key}
                component={RouterLink}
                to={item.to}
                selected={pathname.startsWith(item.to)}
                onClick={() => setSidebarOpen(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={t(`nav.${item.key}`)} />
              </ListItemButton>
            ))}
          </List>
        </Box>
        <Stack spacing={1} sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {t('motto')}
          </Typography>
          <LegalLinks />
        </Stack>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar />
        <Container
          sx={(theme) => ({
            py: 4,
            [theme.breakpoints.down('md')]: { py: 2, px: 2 },
          })}
        >
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};
