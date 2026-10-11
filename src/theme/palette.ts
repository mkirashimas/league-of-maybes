import type { PaletteOptions } from '@mui/material/styles';
import type { ThemeMode } from '../types';

// Neutral slate surfaces with a monochrome primary, sampled from the reference designs.
const palettes: Record<ThemeMode, PaletteOptions> = {
  light: {
    mode: 'light',
    primary: { main: '#2f3a44', contrastText: '#ffffff' },
    secondary: { main: '#4a5157' },
    background: { default: '#e6e8e9', paper: '#f6f7f7' },
    surface: { sidebar: '#dadddf' },
    text: { primary: '#1e2124', secondary: '#5e646a' },
    divider: '#d3d7da',
    action: { hover: '#dde0e2', selected: '#f6f7f7' },
  },
  dark: {
    mode: 'dark',
    primary: { main: '#e3e5e7', contrastText: '#232527' },
    secondary: { main: '#a9bccf' },
    background: { default: '#232527', paper: '#26292b' },
    surface: { sidebar: '#232527' },
    text: { primary: '#e3e5e7', secondary: '#a2a8ae' },
    divider: '#2f3234',
    action: { hover: '#32373c', selected: '#353a3f' },
  },
};

export const getPalette = (mode: ThemeMode): PaletteOptions => palettes[mode];
