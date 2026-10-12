import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  DARK_ONLY_THEMES,
  DEFAULT_THEME_NAME,
  THEME_MODES,
  THEME_NAMES,
  type ThemeMode,
  type ThemeName,
} from '../types';

export const THEME_MODE_STORAGE_KEY = 'themeMode';
export const THEME_NAME_STORAGE_KEY = 'themeName';

interface ThemeState {
  mode: ThemeMode;
  name: ThemeName;
}

const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
};

/** Stored choice first, otherwise the OS preference. */
const getInitialMode = (): ThemeMode => {
  const stored = readStorage(THEME_MODE_STORAGE_KEY);
  const mode = THEME_MODES.find((value) => value === stored);
  if (mode) {
    return mode;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialName = (): ThemeName => {
  const stored = readStorage(THEME_NAME_STORAGE_KEY);
  return THEME_NAMES.find((value) => value === stored) ?? DEFAULT_THEME_NAME;
};

const initialState: ThemeState = {
  mode: getInitialMode(),
  name: getInitialName(),
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
    },
    toggleThemeMode: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setThemeName: (state, action: PayloadAction<ThemeName>) => {
      state.name = action.payload;
    },
  },
});

export const { setThemeMode, toggleThemeMode, setThemeName } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;

/** The stored light/dark choice; it is kept while a dark-only theme is active. */
export const selectThemeMode = (state: { theme: ThemeState }) => state.theme.mode;
export const selectThemeName = (state: { theme: ThemeState }) => state.theme.name;
export const selectIsDarkOnlyTheme = (state: { theme: ThemeState }) =>
  DARK_ONLY_THEMES.includes(state.theme.name);
/** The mode actually rendered: dark-only themes force dark. */
export const selectEffectiveThemeMode = (state: { theme: ThemeState }): ThemeMode =>
  selectIsDarkOnlyTheme(state) ? 'dark' : state.theme.mode;
