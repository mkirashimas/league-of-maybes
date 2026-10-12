import type { BaseDocument } from '../../types';

export const ROSTER_NAMESPACE = 'roster';

export const PLAYERS_COLLECTION = 'players';
export const TRAIT_DEFINITIONS_COLLECTION = 'traitDefinitions';

export const PLAYER_STATUSES = [
  'prospect',
  'active',
  'bench',
  'injuredReserve',
  'retired',
] as const;

export type PlayerStatus = (typeof PLAYER_STATUSES)[number];

/** Avatar colors are palette keys, so they follow the light and dark themes. */
export const AVATAR_COLORS = [
  'primary',
  'secondary',
  'info',
  'success',
  'warning',
  'error',
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

export type TraitValue = number | string;

export interface Player extends BaseDocument {
  /** A nickname only, never a real name. */
  nickname: string;
  age: number | null;
  occupation: string;
  city: string;
  metAt: string;
  /** ISO date (yyyy-mm-dd) or empty. */
  metOn: string;
  avatarColor: AvatarColor;
  status: PlayerStatus;
  traits: Record<string, TraitValue>;
}

export type PlayerInput = Omit<Player, keyof BaseDocument>;

export const TRAIT_KINDS = ['scale', 'number', 'enum'] as const;

export type TraitKind = (typeof TRAIT_KINDS)[number];

export const SCALE_MIN = 1;
export const SCALE_MAX = 10;

/** traitDefinitions/{key}: the document id is the key, which makes seeding idempotent. */
export interface TraitDefinition extends BaseDocument {
  key: string;
  /** Set for built-in traits: the label comes from `trait.<key>` in the roster namespace. */
  builtIn: boolean;
  /** Label of a trait the user added. */
  customLabel: string;
  kind: TraitKind;
  /** i18n unit key for built-in number traits (e.g. 'cm'), free text for custom ones. */
  unit: string;
  /** Allowed values of an enum trait. Built-in option labels come from `traitOption.<key>.<option>`. */
  options: string[];
  /** Weight in the overall score; only scale traits count. 0 = not counted. */
  weight: number;
  order: number;
  active: boolean;
}

export type TraitDefinitionInput = Omit<TraitDefinition, keyof BaseDocument>;

const builtIn = (
  key: string,
  kind: TraitKind,
  order: number,
  extra: Partial<TraitDefinitionInput> = {},
): TraitDefinitionInput => ({
  key,
  builtIn: true,
  customLabel: '',
  kind,
  unit: '',
  options: [],
  weight: kind === 'scale' ? 1 : 0,
  order,
  active: true,
  ...extra,
});

/** Seeded on first use. "crazyEyes" has weight 0 so it never raises the overall score. */
export const DEFAULT_TRAITS: TraitDefinitionInput[] = [
  builtIn('height', 'number', 0, { unit: 'cm' }),
  builtIn('weight', 'number', 1, { unit: 'kg' }),
  builtIn('hot', 'scale', 2),
  builtIn('funny', 'scale', 3),
  builtIn('communication', 'scale', 4),
  builtIn('chemistry', 'scale', 5),
  builtIn('consistency', 'scale', 6),
  builtIn('ambition', 'scale', 7),
  builtIn('crazyEyes', 'scale', 8, { weight: 0 }),
  builtIn('attachmentStyle', 'enum', 9, {
    options: ['secure', 'anxious', 'avoidant', 'fearfulAvoidant'],
  }),
];

export const MAX_TRAIT_WEIGHT = 3;

/**
 * Weighted average of the scale traits that have a value and a weight above 0,
 * or null when nothing counts yet. Computed on the client, never stored.
 */
export const computeOverall = (
  traits: Record<string, TraitValue>,
  definitions: TraitDefinition[],
): number | null => {
  let total = 0;
  let weights = 0;
  definitions.forEach((definition) => {
    const value = traits[definition.key];
    if (
      definition.active &&
      definition.kind === 'scale' &&
      definition.weight > 0 &&
      typeof value === 'number'
    ) {
      total += value * definition.weight;
      weights += definition.weight;
    }
  });
  return weights > 0 ? total / weights : null;
};

/** Up to two initials from a nickname, for the avatar. */
export const initialsOf = (nickname: string): string =>
  nickname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/** Turns a custom label into a trait key that is safe as a Firestore document id. */
export const toTraitKey = (label: string): string => {
  const slug = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `custom_${slug || 'trait'}_${Date.now().toString(36)}`;
};
