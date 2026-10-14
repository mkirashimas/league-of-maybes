import type { BaseDocument } from '../../types';

export const CYCLE_NAMESPACE = 'cycle';

export const CYCLE_PROFILES_COLLECTION = 'cycleProfiles';
export const CYCLE_NOTES_COLLECTION = 'cycleNotes';
export const SETTINGS_COLLECTION = 'settings';
export const PERSONAL_SETTINGS_ID = 'personal';

/** Subject id of the signed-in user. Player ids are 20-character Firestore ids, so it can't clash. */
export const SELF_ID = 'self';

export const CYCLE_PHASES = [
  'menstrual',
  'follicular',
  'ovulation',
  'earlyLuteal',
  'lateLuteal',
] as const;

export type CyclePhase = (typeof CYCLE_PHASES)[number];

export const GENDERS = ['female', 'male', 'other'] as const;

/** Empty when not set. */
export type Gender = (typeof GENDERS)[number] | '';

export const RATING_KEYS = ['mood', 'energy', 'libido', 'sociability'] as const;

export type RatingKey = (typeof RATING_KEYS)[number];

/** 1–5 per aspect, null when not rated. */
export type Ratings = Record<RatingKey, number | null>;

export const EMPTY_RATINGS: Ratings = { mood: null, energy: null, libido: null, sociability: null };

export const RATING_MAX = 5;

export const DEFAULT_CYCLE_LENGTH = 28;
export const MIN_CYCLE_LENGTH = 21;
export const MAX_CYCLE_LENGTH = 45;
export const DEFAULT_PERIOD_LENGTH = 5;
export const MIN_PERIOD_LENGTH = 2;
export const MAX_PERIOD_LENGTH = 10;
/** Period starts kept per subject; the average cycle length uses the latest few. */
export const MAX_PERIOD_STARTS = 12;
export const MAX_NOTE_LENGTH = 1000;
export const MAX_HEALTH_NOTES_LENGTH = 2000;

/** What the notes of one phase add up to; kept on the profile so badges need no note reads. */
export interface PhaseSummary {
  count: number;
  /** Average of each rating over the notes that have it, null when none has. */
  avg: Ratings;
  /** Start of the latest note's text. */
  lastText: string;
}

/** cycleProfiles/{subjectId}: subjectId is a player id or SELF_ID. */
export interface CycleProfile extends BaseDocument {
  /** ISO dates (yyyy-mm-dd), newest first. */
  periodStarts: string[];
  /** Used until two period starts give an average. */
  cycleLength: number;
  periodLength: number;
  phaseSummaries?: Partial<Record<CyclePhase, PhaseSummary>>;
}

export type CycleProfileInput = Omit<CycleProfile, keyof BaseDocument>;

/** cycleNotes/{id}: playerId is SELF_ID for the user's own notes (the delete cascade matches it). */
export interface CycleNote extends BaseDocument {
  playerId: string;
  /** ISO date (yyyy-mm-dd) the observation is about. */
  date: string;
  /** Phase and cycle day on that date, computed when the note is saved. Null without cycle data. */
  phase: CyclePhase | null;
  cycleDay: number | null;
  text: string;
  ratings: Ratings;
}

export type CycleNoteInput = Omit<CycleNote, keyof BaseDocument>;

/** What the note dialog edits; phase and cycle day are computed from the date. */
export type CycleNoteValues = Pick<CycleNoteInput, 'date' | 'text' | 'ratings'>;

/** settings/personal: the user's own details. */
export interface PersonalSettings extends BaseDocument {
  gender: Gender;
  healthNotes: string;
}

export type PersonalSettingsInput = Omit<PersonalSettings, keyof BaseDocument>;

export const DEFAULT_PROFILE: CycleProfileInput = {
  periodStarts: [],
  cycleLength: DEFAULT_CYCLE_LENGTH,
  periodLength: DEFAULT_PERIOD_LENGTH,
};
