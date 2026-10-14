import {
  CYCLE_PHASES,
  MAX_CYCLE_LENGTH,
  MIN_CYCLE_LENGTH,
  RATING_KEYS,
  type CycleNote,
  type CyclePhase,
  type CycleProfileInput,
  type PhaseSummary,
  type Ratings,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Gaps between period starts used for the average cycle length. */
const AVERAGE_OVER = 6;
/** Late luteal (PMS) covers the last days of the cycle. */
const LATE_LUTEAL_DAYS = 5;
/** Ovulation happens about 14 days before the next period. */
const LUTEAL_LENGTH = 14;
const SUMMARY_TEXT_LENGTH = 140;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Days since the epoch of an ISO date, ignoring time zones. */
const dayNumber = (iso: string): number => {
  const [year, month, day] = iso.split('-').map(Number);
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS);
};

const isoOf = (days: number): string => new Date(days * DAY_MS).toISOString().slice(0, 10);

/** Today as an ISO date in the local time zone. */
export const todayIso = (): string => {
  const now = new Date();
  return isoOf(Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS));
};

export const isIsoDate = (value: string): boolean => ISO_DATE.test(value);

/** Valid period starts, newest first, without duplicates. */
export const sortStarts = (starts: string[]): string[] =>
  [...new Set(starts.filter(isIsoDate))].sort((a, b) => b.localeCompare(a));

/**
 * Average gap between the latest starts, when at least two plausible gaps exist; else the
 * manual length.
 */
export const effectiveCycleLength = (
  profile: Pick<CycleProfileInput, 'periodStarts' | 'cycleLength'>,
): { length: number; averaged: boolean } => {
  const starts = sortStarts(profile.periodStarts).slice(0, AVERAGE_OVER + 1);
  const gaps = starts
    .slice(1)
    .map((older, index) => dayNumber(starts[index]) - dayNumber(older))
    .filter((gap) => gap >= MIN_CYCLE_LENGTH && gap <= MAX_CYCLE_LENGTH);
  if (gaps.length >= 2) {
    return {
      length: Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length),
      averaged: true,
    };
  }
  return { length: profile.cycleLength, averaged: false };
};

/**
 * The phase of a cycle day (1-based). Ovulation is the 3 days around L − 14, late luteal the last
 * 5 days; in short cycles the earlier phases win where they overlap.
 */
export const phaseOfDay = (day: number, cycleLength: number, periodLength: number): CyclePhase => {
  const ovulation = cycleLength - LUTEAL_LENGTH;
  if (day <= periodLength) return 'menstrual';
  if (day >= ovulation - 1 && day <= ovulation + 1) return 'ovulation';
  if (day < ovulation - 1) return 'follicular';
  if (day > cycleLength - LATE_LUTEAL_DAYS) return 'lateLuteal';
  return 'earlyLuteal';
};

/** The phase of every day of a cycle, for the cycle strip. */
export const phaseDays = (cycleLength: number, periodLength: number): CyclePhase[] =>
  Array.from({ length: cycleLength }, (_, index) =>
    phaseOfDay(index + 1, cycleLength, periodLength),
  );

export interface PhaseInfo {
  phase: CyclePhase;
  /** 1-based day of the cycle. */
  cycleDay: number;
  cycleLength: number;
  periodLength: number;
  /** ISO date of the expected next period. */
  nextPeriod: string;
  /** The length is the average of the logged cycles (else the manual length). */
  averaged: boolean;
  /** The date is past the expected end of the last logged cycle, so cycles are projected. */
  projected: boolean;
  /** The last logged period is more than two cycles ago: treat the estimate with care. */
  stale: boolean;
}

/** Where a subject is in their cycle on a date, or null without a period start on or before it. */
export const getPhaseInfo = (profile: CycleProfileInput, date: string): PhaseInfo | null => {
  const target = dayNumber(date);
  const start = sortStarts(profile.periodStarts).find((iso) => dayNumber(iso) <= target);
  if (!start) return null;
  const { length, averaged } = effectiveCycleLength(profile);
  const periodLength = Math.min(profile.periodLength, length);
  const daysSince = target - dayNumber(start);
  const cycles = Math.floor(daysSince / length);
  const cycleDay = (daysSince % length) + 1;
  return {
    phase: phaseOfDay(cycleDay, length, periodLength),
    cycleDay,
    cycleLength: length,
    periodLength,
    nextPeriod: isoOf(dayNumber(start) + (cycles + 1) * length),
    averaged,
    projected: cycles > 0,
    stale: cycles >= 2,
  };
};

const average = (values: number[]): number | null =>
  values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

/** Per-phase count, average ratings and latest text of a subject's notes. */
export const summarizeNotes = (notes: CycleNote[]): Partial<Record<CyclePhase, PhaseSummary>> => {
  const summaries: Partial<Record<CyclePhase, PhaseSummary>> = {};
  CYCLE_PHASES.forEach((phase) => {
    const inPhase = notes
      .filter((note) => note.phase === phase)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (inPhase.length === 0) return;
    const avg = Object.fromEntries(
      RATING_KEYS.map((key) => [
        key,
        average(
          inPhase
            .map((note) => note.ratings?.[key])
            .filter((value): value is number => typeof value === 'number'),
        ),
      ]),
    ) as Ratings;
    summaries[phase] = {
      count: inPhase.length,
      avg,
      lastText: inPhase[0].text.slice(0, SUMMARY_TEXT_LENGTH),
    };
  });
  return summaries;
};
