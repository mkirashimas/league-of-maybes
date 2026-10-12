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
  /** Shows a scale trait as a League Table column. Missing on older docs: see isShownInTable. */
  showInTable?: boolean;
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

/** Whether a trait is a League Table column: active scale traits, on by user choice or default. */
export const isShownInTable = (definition: TraitDefinition): boolean =>
  definition.active &&
  definition.kind === 'scale' &&
  (definition.showInTable ?? TABLE_DEFAULT_KEYS.includes(definition.key));

/** Weight of a scale trait in the overall score: 1–10. Other kinds don't count (weight 0). */
export const MIN_TRAIT_WEIGHT = 1;
export const MAX_TRAIT_WEIGHT = 10;

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
});

/**
 * A stored definition brought up to date, or null when it already is:
 * - built-ins take the kind, unit and options of DEFAULT_TRAITS (the user can't edit those)
 * - scale traits weigh at least 1, since weight 0 is no longer an option
 * The user's own choices (order, active, table, weight) are kept.
 */
export const upgradeDefinition = (stored: TraitDefinition): TraitDefinitionInput | null => {
  const builtInDefault = stored.builtIn
    ? DEFAULT_TRAITS.find((definition) => definition.key === stored.key)
    : undefined;
  const kind = builtInDefault?.kind ?? stored.kind;
  const unit = builtInDefault?.unit ?? stored.unit;
  const options = builtInDefault?.options ?? stored.options;
  const weight =
    kind === 'scale' ? Math.min(MAX_TRAIT_WEIGHT, Math.max(MIN_TRAIT_WEIGHT, stored.weight)) : 0;
  const unchanged =
    kind === stored.kind &&
    unit === stored.unit &&
    options.join('|') === stored.options.join('|') &&
    weight === stored.weight;
  return unchanged ? null : { ...toTraitInput(stored), kind, unit, options, weight };
};

/**
 * Weighted average of the active scale traits that have a value (weights 1–10),
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
