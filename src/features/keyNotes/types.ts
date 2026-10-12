import type { BaseDocument } from '../../types';

export const KEY_NOTES_NAMESPACE = 'keyNotes';

export const KEY_NOTES_COLLECTION = 'keyNotes';

export const KEY_NOTE_CATEGORIES = [
  'birthday',
  'family',
  'pets',
  'allergies',
  'insideJoke',
  'giftIdea',
  'noGoTopic',
  'other',
] as const;

export type KeyNoteCategory = (typeof KEY_NOTE_CATEGORIES)[number];

/** 1 = low, 2 = medium, 3 = high. Stored as a number so it sorts. */
export const IMPORTANCE_LEVELS = [3, 2, 1] as const;

export type Importance = (typeof IMPORTANCE_LEVELS)[number];

export const IMPORTANCE_KEYS: Record<Importance, 'high' | 'medium' | 'low'> = {
  3: 'high',
  2: 'medium',
  1: 'low',
};

export interface KeyNote extends BaseDocument {
  playerId: string;
  category: KeyNoteCategory;
  text: string;
  pinned: boolean;
  importance: Importance;
}

export type KeyNoteInput = Omit<KeyNote, keyof BaseDocument>;

export type KeyNoteValues = Omit<KeyNoteInput, 'playerId'>;

export const PAGE_SIZE = 20;
export const MAX_TEXT_LENGTH = 500;
