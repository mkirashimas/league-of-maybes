import {
  DarkModeOutlined,
  EventOutlined,
  ForumOutlined,
  LeaderboardOutlined,
  LightModeOutlined,
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
  Select,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  type SelectChangeEvent,
} from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link as RouterLink, useLocation } from 'react-router';
import { signOut } from '../firebase/auth';
import { toLanguage } from '../i18n';
import { useAppDispatch, useAppSelector } from '../store';
import { selectCurrentUser } from '../store/authSlice';
import { selectThemeMode, toggleThemeMode } from '../store/themeSlice';
import { LANGUAGES, PATHS, type Language } from '../types';

const SIDEBAR_WIDTH = 240;

const NAV_ITEMS = [
  { key: 'leagueTable', to: PATHS.ROSTER, icon: <LeaderboardOutlined /> },
  { key: 'timeline', to: PATHS.TIMELINE, icon: <TimelineOutlined /> },
  { key: 'upcoming', to: PATHS.AGENDA, icon: <EventOutlined /> },
  { key: 'traits', to: PATHS.TRAIT_SETTINGS, icon: <TuneOutlined /> },
  { key: 'chatSettings', to: PATHS.CHAT_SETTINGS, icon: <ForumOutlined /> },
] as const;

export const Layout = () => {
  const { t, i18n } = useTranslation('common');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const themeMode = useAppSelector(selectThemeMode);
  const themeToggleLabel = t(themeMode === 'light' ? 'theme.switchToDark' : 'theme.switchToLight');
  const { pathname } = useLocation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLanguageChange = (event: SelectChangeEvent<Language>) => {
    void i18n.changeLanguage(event.target.value);
  };

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

          <Select
            value={toLanguage(i18n.resolvedLanguage)}
            onChange={handleLanguageChange}
            variant="standard"
            disableUnderline
            renderValue={(language) =>
              isSmall ? language.toUpperCase() : t(`languages.${language}`)
            }
            inputProps={{ 'aria-label': t('language') }}
            sx={{ color: 'inherit', '& .MuiSvgIcon-root': { color: 'inherit' } }}
          >
            {LANGUAGES.map((language) => (
              <MenuItem key={language} value={language}>
                {t(`languages.${language}`)}
              </MenuItem>
            ))}
          </Select>

          <Tooltip title={themeToggleLabel}>
            <IconButton
              color="inherit"
              onClick={() => dispatch(toggleThemeMode())}
              aria-label={themeToggleLabel}
            >
              {themeMode === 'light' ? <DarkModeOutlined /> : <LightModeOutlined />}
            </IconButton>
          </Tooltip>

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
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {t('motto')}
          </Typography>
        </Box>
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
