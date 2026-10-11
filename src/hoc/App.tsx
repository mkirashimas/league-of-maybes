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
import { selectThemeMode, THEME_MODE_STORAGE_KEY } from '../store/themeSlice';
import { createAppTheme, MUI_LOCALES } from '../theme';
import { Routing } from './Routing';

const AppShell = () => {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const language = toLanguage(i18n.resolvedLanguage);
  const mode = useAppSelector(selectThemeMode);

  const theme = useMemo(() => createAppTheme(mode, MUI_LOCALES[language]), [mode, language]);

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
