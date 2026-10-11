import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { THEME_MODES, type ThemeMode } from '../types';

export const THEME_MODE_STORAGE_KEY = 'themeMode';

interface ThemeState {
  mode: ThemeMode;
}

/** Stored choice first, otherwise the OS preference. */
const getInitialMode = (): ThemeMode => {
  try {
    const stored = localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const mode = THEME_MODES.find((value) => value === stored);
    if (mode) {
      return mode;
    }
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const initialState: ThemeState = {
  mode: getInitialMode(),
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
  },
});

export const { setThemeMode, toggleThemeMode } = themeSlice.actions;
export const themeReducer = themeSlice.reducer;

export const selectThemeMode = (state: { theme: ThemeState }) => state.theme.mode;
