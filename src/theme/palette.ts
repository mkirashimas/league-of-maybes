import { alpha, type PaletteOptions } from '@mui/material/styles';
import { DARK_ONLY_THEMES, type ThemeMode, type ThemeName } from '../types';

/** Colours of one theme in one mode. Status colours drive player status chips and timeline freshness. */
interface PaletteSpec {
  bg: string;
  paper: string;
  sidebar: string;
  text: string;
  textSecondary: string;
  divider: string;
  hover: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  success: string;
  info: string;
  warning: string;
  error: string;
  /** Optional CSS gradient drawn under the top bar. */
  stripe?: string;
}

const fromSpec = (mode: ThemeMode, spec: PaletteSpec): PaletteOptions => ({
  mode,
  primary: { main: spec.primary, contrastText: spec.onPrimary },
  secondary: { main: spec.secondary, contrastText: spec.onSecondary },
  success: { main: spec.success },
  info: { main: spec.info },
  warning: { main: spec.warning },
  error: { main: spec.error },
  background: { default: spec.bg, paper: spec.paper },
  surface: { sidebar: spec.sidebar, stripe: spec.stripe },
  text: { primary: spec.text, secondary: spec.textSecondary },
  divider: spec.divider,
  action: { hover: spec.hover, selected: alpha(spec.primary, 0.14) },
});

// Neutral slate surfaces with a monochrome primary, sampled from the reference designs.
const slate: Record<ThemeMode, PaletteOptions> = {
  light: {
    mode: 'light',
    primary: { main: '#2f3a44', contrastText: '#ffffff' },
    secondary: { main: '#4a5157' },
    background: { default: '#e6e8e9', paper: '#f6f7f7' },
    surface: { sidebar: '#dadddf' },
    text: { primary: '#1e2124', secondary: '#585e64' }, // secondary ≥ 4.5:1 on every light surface
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

// Dark only: aubergine lounge, hot pink and gold.
const velvetLounge: PaletteSpec = {
  bg: '#170f1f',
  paper: '#20162b',
  sidebar: '#130b1a',
  text: '#f3eaf7',
  textSecondary: '#b8a6c4',
  divider: '#33263f',
  hover: '#2b1f38',
  primary: '#ff5fa2',
  onPrimary: '#3a0420',
  secondary: '#ffc857',
  onSecondary: '#3a2600',
  success: '#6ee7b7',
  info: '#a5b4fc',
  warning: '#ffc857',
  error: '#ff6b6b',
};

// Dark only: pure black for OLED screens, near-white primary, one red accent.
const blackout: PaletteSpec = {
  bg: '#000000',
  paper: '#0b0b0b',
  sidebar: '#000000',
  text: '#ededed',
  textSecondary: '#9b9b9b',
  divider: '#1f1f1f',
  hover: '#161616',
  primary: '#ededed',
  onPrimary: '#000000',
  secondary: '#e5484d',
  onSecondary: '#000000',
  success: '#3dd68c',
  info: '#70b8ff',
  warning: '#ffc53d',
  error: '#ff6369',
};

const prideStripe = (colors: string[]) => `linear-gradient(90deg, ${colors.join(', ')})`;

// Dark only: deep-water ink, electric cyan and peach.
const deepEnd: PaletteSpec = {
  bg: '#07161c',
  paper: '#0d2129',
  sidebar: '#051116',
  text: '#e3f4f7',
  textSecondary: '#94b5bd',
  divider: '#1a343d',
  hover: '#143039',
  primary: '#3fe0d0',
  onPrimary: '#032a27',
  secondary: '#ffab76',
  onSecondary: '#3a1700',
  success: '#7ee08a',
  info: '#7cc4ff',
  warning: '#ffd166',
  error: '#ff7a8a',
};

// Colour themes. Dark-only themes reuse their dark spec under `light` so the map stays total.
const specs: Record<Exclude<ThemeName, 'slate'>, Record<ThemeMode, PaletteSpec>> = {
  // Berry rose with plum, pink-tinted neutrals.
  roseCourt: {
    light: {
      bg: '#f8f0f2',
      paper: '#fffafb',
      sidebar: '#f1e3e7',
      text: '#2a1a20',
      textSecondary: '#6c5560',
      divider: '#ebd8dd',
      hover: '#f4e5ea',
      primary: '#b3264f',
      onPrimary: '#ffffff',
      secondary: '#7a3e8f',
      onSecondary: '#ffffff',
      success: '#b3264f',
      info: '#7a3e8f',
      warning: '#9a6a12',
      error: '#c2410c',
    },
    dark: {
      bg: '#1c1317',
      paper: '#251a1f',
      sidebar: '#181014',
      text: '#f6e9ed',
      textSecondary: '#c1a8b1',
      divider: '#3a2a31',
      hover: '#33242b',
      primary: '#ff8fb0',
      onPrimary: '#3d0a1d',
      secondary: '#d4a5e6',
      onSecondary: '#2a0f36',
      success: '#ff8fb0',
      info: '#d4a5e6',
      warning: '#e9b85a',
      error: '#ff9a6b',
    },
  },
  // Stadium at night: navy, coral accent, teal for active.
  floodlight: {
    light: {
      bg: '#eef1f6',
      paper: '#ffffff',
      sidebar: '#e2e7f0',
      text: '#141b2d',
      textSecondary: '#4e5a71',
      divider: '#d6dde8',
      hover: '#e8edf5',
      primary: '#1f2b5c',
      onPrimary: '#ffffff',
      secondary: '#e2503a',
      onSecondary: '#ffffff',
      success: '#0b8a78',
      info: '#3559e0',
      warning: '#a86f00',
      error: '#d2412b',
    },
    dark: {
      bg: '#0d1220',
      paper: '#141b2e',
      sidebar: '#0a0e19',
      text: '#e8ecf5',
      textSecondary: '#9aa6bf',
      divider: '#232c44',
      hover: '#1b2440',
      primary: '#aebdff',
      onPrimary: '#111a3d',
      secondary: '#ff7a5c',
      onSecondary: '#3a0d04',
      success: '#3fd6bd',
      info: '#8aa5ff',
      warning: '#f2bb4b',
      error: '#ff7a5c',
    },
  },
  // Green pitch with gold silverware.
  pitchTrophy: {
    light: {
      bg: '#edf1ed',
      paper: '#fbfcfa',
      sidebar: '#e0e8e1',
      text: '#16231b',
      textSecondary: '#4b5c51',
      divider: '#d2dcd4',
      hover: '#e3ebe4',
      primary: '#1f5c43',
      onPrimary: '#ffffff',
      secondary: '#a87a0a',
      onSecondary: '#ffffff',
      success: '#1f7a52',
      info: '#2f6fb0',
      warning: '#9a6f08',
      error: '#b84a33',
    },
    dark: {
      bg: '#0f1712',
      paper: '#15201a',
      sidebar: '#0c130f',
      text: '#e5eee7',
      textSecondary: '#9cb1a2',
      divider: '#24332a',
      hover: '#1d2b23',
      primary: '#86d6ab',
      onPrimary: '#0a2417',
      secondary: '#e8c055',
      onSecondary: '#2b2002',
      success: '#86d6ab',
      info: '#8cbcf0',
      warning: '#e8c055',
      error: '#f08a70',
    },
  },
  // Tangerine with fuchsia, peach-tinted neutrals.
  mangoTango: {
    light: {
      bg: '#fbf1ea',
      paper: '#fffaf6',
      sidebar: '#f5e4d8',
      text: '#2b1a10',
      textSecondary: '#6d5546',
      divider: '#eedbcd',
      hover: '#f6e6da',
      primary: '#c2410c',
      onPrimary: '#ffffff',
      secondary: '#b0207a',
      onSecondary: '#ffffff',
      success: '#178a5a',
      info: '#7a3ec8',
      warning: '#a86500',
      error: '#c81e3a',
    },
    dark: {
      bg: '#1d140f',
      paper: '#271b14',
      sidebar: '#18100b',
      text: '#fbeee5',
      textSecondary: '#c9ab98',
      divider: '#3d2b20',
      hover: '#352419',
      primary: '#ff9a5c',
      onPrimary: '#3a1300',
      secondary: '#f58ad0',
      onSecondary: '#3a0727',
      success: '#5fd39a',
      info: '#c3a0ff',
      warning: '#ffc560',
      error: '#ff7b8e',
    },
  },
  // Turquoise water with hot coral-pink.
  lagoon: {
    light: {
      bg: '#eaf6f5',
      paper: '#fbfefe',
      sidebar: '#dcefee',
      text: '#0f2427',
      textSecondary: '#46625f',
      divider: '#cfe5e3',
      hover: '#dff0ef',
      primary: '#0b7380',
      onPrimary: '#ffffff',
      secondary: '#d6336c',
      onSecondary: '#ffffff',
      success: '#0f8a5f',
      info: '#2563c9',
      warning: '#a86b00',
      error: '#c8402c',
    },
    dark: {
      bg: '#0b1a1c',
      paper: '#102427',
      sidebar: '#081416',
      text: '#e2f5f4',
      textSecondary: '#93b8b5',
      divider: '#1d3a3d',
      hover: '#163135',
      primary: '#5fdde0',
      onPrimary: '#032a2c',
      secondary: '#ff8aa8',
      onSecondary: '#3d0718',
      success: '#5fe0a8',
      info: '#8ab4ff',
      warning: '#f5c04f',
      error: '#ff8f78',
    },
  },
  velvetLounge: { light: velvetLounge, dark: velvetLounge },
  deepEnd: { light: deepEnd, dark: deepEnd },
  blackout: { light: blackout, dark: blackout },
  // Rainbow flag: the six stripes run under the top bar; status and avatar colours walk the rainbow.
  pride: {
    light: {
      bg: '#f6f3f9',
      paper: '#fffdff',
      sidebar: '#ece6f3',
      text: '#1f1726',
      textSecondary: '#5f5469',
      divider: '#e2daea',
      hover: '#ece5f3',
      primary: '#732982',
      onPrimary: '#ffffff',
      secondary: '#c2185b',
      onSecondary: '#ffffff',
      success: '#1e7f3a',
      info: '#24408e',
      warning: '#b35400',
      error: '#d0021b',
      stripe: prideStripe(['#e40303', '#ff8c00', '#ffed00', '#008026', '#24408e', '#732982']),
    },
    dark: {
      bg: '#15121b',
      paper: '#1d1925',
      sidebar: '#120f17',
      text: '#f1edf6',
      textSecondary: '#aea6ba',
      divider: '#2e2838',
      hover: '#282233',
      primary: '#c58cf0',
      onPrimary: '#2a0d3d',
      secondary: '#ff8cc6',
      onSecondary: '#3d0722',
      success: '#5fd38a',
      info: '#7fa8ff',
      warning: '#ffaa4d',
      error: '#ff6b6b',
      stripe: prideStripe(['#ff3b3b', '#ff9f1c', '#ffe14d', '#2fbf5b', '#4d7cff', '#a64dd6']),
    },
  },
};

/** Dark-only themes always render in dark mode, whatever the stored mode is. */
const effectiveMode = (name: ThemeName, mode: ThemeMode): ThemeMode =>
  DARK_ONLY_THEMES.includes(name) ? 'dark' : mode;

export const getPalette = (name: ThemeName, mode: ThemeMode): PaletteOptions => {
  const resolved = effectiveMode(name, mode);
  return name === 'slate' ? slate[resolved] : fromSpec(resolved, specs[name][resolved]);
};

/** Colours for the theme picker preview dots. */
export const getThemeSwatch = (name: ThemeName, mode: ThemeMode) => {
  const resolved = effectiveMode(name, mode);
  if (name === 'slate') {
    const palette = slate[resolved];
    return {
      background: palette.background?.default ?? '',
      primary: (palette.primary as { main: string }).main,
      secondary: (palette.secondary as { main: string }).main,
      stripe: undefined,
    };
  }
  const spec = specs[name][resolved];
  return {
    background: spec.bg,
    primary: spec.primary,
    secondary: spec.secondary,
    stripe: spec.stripe,
  };
};
