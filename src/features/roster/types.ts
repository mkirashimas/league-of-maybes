import type { BaseDocument } from '../../types';
import type { Gender } from '../cycle';

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
  /** Empty when not set (and on players saved before it existed). Women get cycle tracking. */
  gender?: Gender;
  /** Free-text health problems; empty or missing when none. */
  healthNotes?: string;
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
  /** Weight in the overall score, 1–10, for scale and choice traits. Number traits: 0 (not counted). */
  weight: number;
  order: number;
  active: boolean;
  /** Shows a scale or choice trait as a League Table column. Missing on older docs: see isShownInTable. */
  showInTable?: boolean;
  /** Choice traits: the 1–10 score of each option in the overall. Missing: see optionScore. */
  optionScores?: Record<string, number>;
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
  weight: kind === 'number' ? 0 : 1,
  order,
  active: true,
  ...extra,
});

/** The scale traits shown in the League Table until the user changes it in the trait settings. */
export const TABLE_DEFAULT_KEYS: readonly string[] = ['hot', 'sex', 'crazyEyes'];

/**
 * Height and weight are picked from ranges: nobody knows the exact numbers. Each option covers
 * values below `below`. Used to move numbers entered before the ranges into the right one.
 */
const RANGES: Record<string, { option: string; below: number }[]> = {
  height: [
    { option: 'under160', below: 160 },
    { option: '160to169', below: 170 },
    { option: '170to179', below: 180 },
    { option: '180to189', below: 190 },
    { option: '190plus', below: Infinity },
  ],
  weight: [
    { option: 'under50', below: 50 },
    { option: '50to59', below: 60 },
    { option: '60to69', below: 70 },
    { option: '70to79', below: 80 },
    { option: '80to89', below: 90 },
    { option: '90to99', below: 100 },
    { option: '100plus', below: Infinity },
  ],
};

const rangeOptions = (key: string) => RANGES[key].map((range) => range.option);

/** The range option a number falls into, for traits that moved from numbers to ranges. */
export const rangeOf = (key: string, value: number): string | null =>
  RANGES[key]?.find((range) => value < range.below)?.option ?? null;

/** The Big Five personality traits, rated 1–10 like the others. */
export const BIG_FIVE_KEYS = [
  'openness',
  'conscientiousness',
  'extraversion',
  'agreeableness',
  'neuroticism',
] as const;

/**
 * Seeded on first use; built-ins added later are seeded for existing accounts too, and stored
 * built-ins follow the kind, unit and options defined here (see upgradeDefinition).
 */
export const DEFAULT_TRAITS: TraitDefinitionInput[] = [
  builtIn('height', 'enum', 0, { options: rangeOptions('height') }),
  builtIn('weight', 'enum', 1, { options: rangeOptions('weight') }),
  builtIn('hot', 'scale', 2),
  builtIn('sex', 'scale', 3),
  builtIn('funny', 'scale', 4),
  builtIn('communication', 'scale', 5),
  builtIn('chemistry', 'scale', 6),
  builtIn('consistency', 'scale', 7),
  builtIn('ambition', 'scale', 8),
  builtIn('crazyEyes', 'scale', 9),
  builtIn('attachmentStyle', 'enum', 10, {
    options: ['secure', 'anxious', 'avoidant', 'fearfulAvoidant'],
  }),
  ...BIG_FIVE_KEYS.map((key, index) => builtIn(key, 'scale', 11 + index)),
].map((definition) => ({
  ...definition,
  showInTable: TABLE_DEFAULT_KEYS.includes(definition.key),
}));

/** Whether a trait is a League Table column: active scale and choice traits, on by user choice or default. */
export const isShownInTable = (definition: TraitDefinition): boolean =>
  definition.active &&
  isWeighted(definition.kind) &&
  (definition.showInTable ?? TABLE_DEFAULT_KEYS.includes(definition.key));

/** Weight in the overall score: 1–10 for scale and choice traits. Number traits don't count (0). */
export const MIN_TRAIT_WEIGHT = 1;
export const MAX_TRAIT_WEIGHT = 10;

/** Trait kinds that count in the overall score, and so have a weight. */
export const isWeighted = (kind: TraitKind) => kind === 'scale' || kind === 'enum';

/** The 1–10 values a weight or an option score can take. */
export const TRAIT_WEIGHTS = Array.from(
  { length: MAX_TRAIT_WEIGHT - MIN_TRAIT_WEIGHT + 1 },
  (_, index) => MIN_TRAIT_WEIGHT + index,
);

/** The stored fields of a definition, as written back by an upsert. */
export const toTraitInput = (definition: TraitDefinition): TraitDefinitionInput => ({
  key: definition.key,
  builtIn: definition.builtIn,
  customLabel: definition.customLabel,
  kind: definition.kind,
  unit: definition.unit,
  options: definition.options,
  weight: definition.weight,
  order: definition.order,
  active: definition.active,
  showInTable: definition.showInTable ?? TABLE_DEFAULT_KEYS.includes(definition.key),
  ...(definition.optionScores ? { optionScores: definition.optionScores } : {}),
});

/**
 * A stored definition brought up to date, or null when it already is:
 * - built-ins take the kind, unit and options of DEFAULT_TRAITS (the user can't edit those)
 * - scale and choice traits weigh 1–10 (weight 0 is no longer an option); number traits 0
 * The user's own choices (order, active, table, weight) are kept.
 */
export const upgradeDefinition = (stored: TraitDefinition): TraitDefinitionInput | null => {
  const builtInDefault = stored.builtIn
    ? DEFAULT_TRAITS.find((definition) => definition.key === stored.key)
    : undefined;
  const kind = builtInDefault?.kind ?? stored.kind;
  const unit = builtInDefault?.unit ?? stored.unit;
  const options = builtInDefault?.options ?? stored.options;
  const weight = isWeighted(kind)
    ? Math.min(MAX_TRAIT_WEIGHT, Math.max(MIN_TRAIT_WEIGHT, stored.weight))
    : 0;
  const unchanged =
    kind === stored.kind &&
    unit === stored.unit &&
    options.join('|') === stored.options.join('|') &&
    weight === stored.weight;
  return unchanged ? null : { ...toTraitInput(stored), kind, unit, options, weight };
};

/** Built-in choices whose default scores aren't simply spread by position. */
const DEFAULT_OPTION_SCORES: Record<string, Record<string, number>> = {
  attachmentStyle: { secure: 10, anxious: 5, avoidant: 4, fearfulAvoidant: 2 },
};

/**
 * The 1–10 score of a choice: the user's score for it, else the built-in default, else spread
 * evenly by position (first option 1, last 10). Null when the option isn't in the list.
 */
export const optionScore = (definition: TraitDefinition, option: string): number | null => {
  const index = definition.options.indexOf(option);
  if (index < 0) return null;
  const stored =
    definition.optionScores?.[option] ?? DEFAULT_OPTION_SCORES[definition.key]?.[option];
  if (stored !== undefined) return stored;
  const last = definition.options.length - 1;
  return last > 0 ? Math.round(1 + (9 * index) / last) : MAX_TRAIT_WEIGHT;
};

/**
 * Weighted average of the active scale and choice traits that have a value (weights 1–10;
 * a choice counts with its option score),
 * or null when nothing counts yet. Computed on the client, never stored.
 */
export const computeOverall = (
  traits: Record<string, TraitValue>,
  definitions: TraitDefinition[],
): number | null => {
  let total = 0;
  let weights = 0;
  definitions.forEach((definition) => {
    if (!definition.active || definition.weight <= 0) return;
    const value = traits[definition.key];
    const score =
      definition.kind === 'scale' && typeof value === 'number'
        ? value
        : definition.kind === 'enum' && typeof value === 'string'
          ? optionScore(definition, value)
          : null;
    if (score === null) return;
    total += score * definition.weight;
    weights += definition.weight;
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
