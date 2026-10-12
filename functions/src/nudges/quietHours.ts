/** settings/chat.quietHours: HH:mm, local to settings/chat.timeZone. */
export interface QuietHours {
  start: string;
  end: string;
}

const toMinutes = (hhmm: string) => {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Local wall-clock minutes of `now` in `timeZone`. */
const minutesIn = (now: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value('hour') * 60 + value('minute');
};

/**
 * True when `now` falls inside the quiet window in `timeZone`.
 * Handles windows that cross midnight (start > end). start == end means no quiet hours.
 * Same logic as isInQuietHours in src/features/chat/types.ts (R12).
 */
export const isInQuietHours = (now: Date, { start, end }: QuietHours, timeZone: string) => {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === to) return false;
  const current = minutesIn(now, timeZone);
  return from < to ? current >= from && current < to : current >= from || current < to;
};
