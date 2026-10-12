import type { BaseDocument } from '../../types';

export const INTEL_NAMESPACE = 'intel';

export const INTEL_COLLECTION = 'intel';

/** Display order of the groups on the Intel tab. */
export const INTEL_CATEGORIES = [
  'howWeMet',
  'socials',
  'interests',
  'greenFlag',
  'redFlag',
  'mutualFriends',
  'openerIdea',
] as const;

export type IntelCategory = (typeof INTEL_CATEGORIES)[number];

export interface IntelEntry extends BaseDocument {
  playerId: string;
  category: IntelCategory;
  text: string;
}

export type IntelInput = Omit<IntelEntry, keyof BaseDocument>;

export const PAGE_SIZE = 20;
export const MAX_TEXT_LENGTH = 1000;
