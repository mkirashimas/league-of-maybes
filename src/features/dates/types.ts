import type { BaseDocument } from '../../types';

export const DATES_NAMESPACE = 'dates';

export const DATES_COLLECTION = 'dates';
export const DATE_SUMMARIES_COLLECTION = 'dateSummaries';
/** Owned by the roster feature; read-only here. */
export const PLAYERS_COLLECTION = 'players';

export const OUTCOMES = ['great', 'good', 'meh', 'bad'] as const;

export type Outcome = (typeof OUTCOMES)[number];

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export interface DateRecord extends BaseDocument {
  playerId: string;
  /** Local calendar day, yyyy-mm-dd (sorts as a string). */
  date: string;
  activity: string;
  venue: string;
  rating: number | null;
  outcome: Outcome;
  highlights: string;
  nextStep: string;
}

export type DateInput = Omit<DateRecord, keyof BaseDocument>;

/** dateSummaries/{playerId}: recomputed after every date write; the Timeline reads only these. */
export interface DateSummary extends BaseDocument {
  playerId: string;
  lastDateAt: string | null;
  count: number;
  /** Days (yyyy-mm-dd) of dates within the last TIMELINE_DAYS days, newest first. */
  recentDates: string[];
}

export type DateSummaryInput = Omit<DateSummary, keyof BaseDocument>;

/** The few player fields this feature needs. Its own type: features never import each other. */
export interface PlayerRef extends BaseDocument {
  nickname: string;
  status: 'prospect' | 'active' | 'bench' | 'injuredReserve' | 'retired';
  avatarColor: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
}

/** Statuses shown on the Timeline. */
export const TIMELINE_STATUSES: PlayerRef['status'][] = ['active', 'bench'];

export const TIMELINE_DAYS = 90;
export const FRESH_DAYS = 7;
export const COOLING_DAYS = 21;
export const PAGE_SIZE = 20;

export type Freshness = 'fresh' | 'cooling' | 'cold';

const pad = (value: number) => String(value).padStart(2, '0');

/** Today's local date as yyyy-mm-dd. */
export const todayIso = (now = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const toUtcDay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

/** Whole calendar days from `iso` to `today` (0 = today; negative = in the future). */
export const daysSince = (iso: string, today = todayIso()): number =>
  Math.round((toUtcDay(today) - toUtcDay(iso)) / 86_400_000);

export const freshnessOf = (days: number): Freshness =>
  days < FRESH_DAYS ? 'fresh' : days < COOLING_DAYS ? 'cooling' : 'cold';

/** Builds a player's summary from all their dates (any order). */
export const summarize = (
  playerId: string,
  dates: Pick<DateRecord, 'date'>[],
  today = todayIso(),
): DateSummaryInput => {
  const days = dates.map((record) => record.date).sort((a, b) => b.localeCompare(a));
  return {
    playerId,
    lastDateAt: days[0] ?? null,
    count: days.length,
    recentDates: days.filter((day) => {
      const age = daysSince(day, today);
      return age >= 0 && age < TIMELINE_DAYS;
    }),
  };
};

export const initialsOf = (nickname: string): string =>
  nickname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
