export * from './paths';

/** Supported languages, alphabetically ordered. */
export const LANGUAGES = ['en', 'es', 'fr', 'it', 'ro'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export const THEME_MODES = ['light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/** Colour themes offered in the theme picker. */
export const THEME_NAMES = [
  'slate',
  'roseCourt',
  'floodlight',
  'pitchTrophy',
  'mangoTango',
  'lagoon',
  'pride',
  'velvetLounge',
  'deepEnd',
  'blackout',
] as const;

export type ThemeName = (typeof THEME_NAMES)[number];

export const DEFAULT_THEME_NAME: ThemeName = 'slate';

/** Themes without a light variant; they always render dark. */
export const DARK_ONLY_THEMES: readonly ThemeName[] = ['velvetLounge', 'deepEnd', 'blackout'];

/** Fields every Firestore document has once mapped by src/firebase/firestore.ts. Timestamps are epoch millis. */
export interface BaseDocument {
  id: string;
  createdAt: number | null;
  updatedAt: number | null;
}
