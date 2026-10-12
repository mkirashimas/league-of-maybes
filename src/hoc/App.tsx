import { CssBaseline, ThemeProvider } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { onAuthChanged } from '../firebase/auth';
import { toLanguage } from '../i18n';
import { store, useAppDispatch, useAppSelector } from '../store';
import { api } from '../store/api';
import { setUser } from '../store/authSlice';
import {
  selectEffectiveThemeMode,
  selectThemeMode,
  selectThemeName,
  THEME_MODE_STORAGE_KEY,
  THEME_NAME_STORAGE_KEY,
} from '../store/themeSlice';
import { createAppTheme, MUI_LOCALES } from '../theme';
import { Routing } from './Routing';

const AppShell = () => {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const language = toLanguage(i18n.resolvedLanguage);
  const mode = useAppSelector(selectThemeMode);
  const themeName = useAppSelector(selectThemeName);
  const renderedMode = useAppSelector(selectEffectiveThemeMode);

  const theme = useMemo(
    () => createAppTheme(themeName, renderedMode, MUI_LOCALES[language]),
    [themeName, renderedMode, language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
    } catch {
      // Storage can be unavailable; the mode then lasts for this session only.
    }
  }, [mode]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_NAME_STORAGE_KEY, themeName);
    } catch {
      // Storage can be unavailable; the theme then lasts for this session only.
    }
  }, [themeName]);

  // Browser and installed-PWA chrome follow the top bar colour.
  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.palette.background.default);
  }, [theme]);

  useEffect(
    () =>
      onAuthChanged((user) => {
        if (!user) {
          // Drop any cached data of the previous user.
          dispatch(api.util.resetApiState());
        }
        dispatch(
          setUser(
            user
              ? {
                  uid: user.uid,
                  displayName: user.displayName,
                  email: user.email,
                  photoURL: user.photoURL,
                }
              : null,
          ),
        );
      }),
    [dispatch],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routing />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export const App = () => (
  <Provider store={store}>
    <AppShell />
  </Provider>
);
