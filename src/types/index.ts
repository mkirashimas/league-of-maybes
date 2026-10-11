export * from './paths';

/** Supported languages, alphabetically ordered. */
export const LANGUAGES = ['en', 'es', 'fr', 'it', 'ro'] as const;

export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

export const THEME_MODES = ['light', 'dark'] as const;

export type ThemeMode = (typeof THEME_MODES)[number];

/** Fields every Firestore document has once mapped by src/firebase/firestore.ts. Timestamps are epoch millis. */
export interface BaseDocument {
  id: string;
  createdAt: number | null;
  updatedAt: number | null;
}
