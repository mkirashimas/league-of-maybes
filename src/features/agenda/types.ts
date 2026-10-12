import type { BaseDocument } from '../../types';

export const AGENDA_NAMESPACE = 'agenda';

export const AGENDA_COLLECTION = 'agendaItems';
/** Owned by the roster feature; read-only here. */
export const PLAYERS_COLLECTION = 'players';

/** now = what is going on these days; event = something on a day; plan = an intention. */
export const AGENDA_KINDS = ['now', 'event', 'plan'] as const;

export type AgendaKind = (typeof AGENDA_KINDS)[number];

export interface AgendaItem extends BaseDocument {
  playerId: string;
  kind: AgendaKind;
  title: string;
  notes: string;
  /**
   * Local day `yyyy-mm-dd`, optionally with a time `yyyy-mm-ddTHH:mm`; both sort as strings.
   * Always written: null when undated, because Firestore leaves out documents missing a
   * field used in a range or orderBy.
   */
  when: string | null;
  done: boolean;
}

export type AgendaInput = Omit<AgendaItem, keyof BaseDocument>;

export type AgendaValues = Omit<AgendaInput, 'playerId' | 'done'>;

/** The few player fields this feature needs. Its own type: features never import each other. */
export interface PlayerRef extends BaseDocument {
  nickname: string;
  status: 'prospect' | 'active' | 'bench' | 'injuredReserve' | 'retired';
  avatarColor: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
}

export const PAGE_SIZE = 20;

const pad = (value: number) => String(value).padStart(2, '0');

/** Today's local date as yyyy-mm-dd. */
export const todayIso = (now = new Date()): string =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const dayOf = (when: string): string => when.slice(0, 10);

export const timeOf = (when: string): string => (when.length > 10 ? when.slice(11, 16) : '');

/** Joins a day and an optional time into the stored `when` value. */
export const toWhen = (day: string, time: string): string | null =>
  day ? (time ? `${day}T${time}` : day) : null;

/** Dated and before today. */
export const isPast = (item: Pick<AgendaItem, 'when'>, today = todayIso()): boolean =>
  item.when !== null && dayOf(item.when) < today;

export const initialsOf = (nickname: string): string =>
  nickname
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

/** Formats a `when` value in the given language: day, plus the time when there is one. */
export const formatWhen = (when: string, language: string | undefined): string => {
  const date = new Date(when.length > 10 ? when : `${when}T00:00:00`);
  return new Intl.DateTimeFormat(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(when.length > 10 ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
};
