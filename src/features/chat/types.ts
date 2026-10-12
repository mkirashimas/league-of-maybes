import type { BaseDocument } from '../../types';

export const CHAT_NAMESPACE = 'chat';

export const CHAT_PROFILES_COLLECTION = 'chatProfiles';
export const CHAT_NOTES_COLLECTION = 'chatNotes';
export const CHAT_STATES_COLLECTION = 'chatStates';
export const SETTINGS_COLLECTION = 'settings';
export const CHAT_SETTINGS_ID = 'chat';
/** Owned by other features; read-only here, for the AI brief. */
export const PLAYERS_COLLECTION = 'players';
export const KEY_NOTES_COLLECTION = 'keyNotes';
export const INTEL_COLLECTION = 'intel';

// ---------- Chat profile ----------

export const PROFILE_OPTIONS = {
  platform: ['whatsapp', 'instagram', 'telegram', 'sms', 'other'],
  textingStyle: ['dry', 'chatty', 'emoji', 'voiceNotes', 'memes'],
  replyTime: ['minutes', 'hours', 'sameDay', 'days'],
  initiator: ['me', 'them', 'both'],
  bestTime: ['morning', 'afternoon', 'evening', 'lateNight'],
} as const;

export type ProfileOptionField = keyof typeof PROFILE_OPTIONS;

export interface ChatProfile extends BaseDocument {
  platform: string;
  textingStyle: string;
  replyTime: string;
  initiator: string;
  bestTime: string;
  topicsThatLand: string[];
  topicsToAvoid: string[];
  /** Digits only, international format, no "+" (wa.me format). Optional. */
  phone: string;
  /** Per-player additions to the AI brief. */
  aiNotes: string;
}

export type ChatProfileInput = Omit<ChatProfile, keyof BaseDocument>;

export const EMPTY_PROFILE: ChatProfileInput = {
  platform: '',
  textingStyle: '',
  replyTime: '',
  initiator: '',
  bestTime: '',
  topicsThatLand: [],
  topicsToAvoid: [],
  phone: '',
  aiNotes: '',
};

/** The fields counted by the "4 of 7 filled" hint. */
export const PROFILE_COMPLETENESS_FIELDS = [
  'platform',
  'textingStyle',
  'replyTime',
  'initiator',
  'bestTime',
  'topicsThatLand',
  'topicsToAvoid',
] as const;

export const profileCompleteness = (profile: ChatProfileInput) =>
  PROFILE_COMPLETENESS_FIELDS.filter((field) => {
    const value = profile[field];
    return Array.isArray(value) ? value.length > 0 : value !== '';
  }).length;

/** wa.me format: digits only, country code first, no leading zero, 7–15 digits. */
export const PHONE_PATTERN = /^[1-9]\d{6,14}$/;

export const isValidPhone = (phone: string) => phone === '' || PHONE_PATTERN.test(phone);

/** WhatsApp link with the text prefilled; without a phone WhatsApp shows a contact picker. */
export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

// ---------- Quirks log ----------

export const CHAT_NOTE_CATEGORIES = ['humor', 'pace', 'emoji', 'pattern', 'other'] as const;

export type ChatNoteCategory = (typeof CHAT_NOTE_CATEGORIES)[number];

export interface ChatNote extends BaseDocument {
  playerId: string;
  category: ChatNoteCategory;
  text: string;
}

export type ChatNoteInput = Omit<ChatNote, keyof BaseDocument>;

export const PAGE_SIZE = 20;

// ---------- Chat state ----------

export type Sender = 'me' | 'them';

/** chatStates/{playerId} as read: timestamps are epoch millis. */
export interface ChatState extends BaseDocument {
  playerId: string;
  lastSender: Sender;
  lastInboundAt: number | null;
  lastOutboundAt: number | null;
  /** When a nudge is due; null when none. Queried by the sendNudges function. */
  nextNudgeAt: number | null;
  nudgedAt: number | null;
  stateUpdatedAt: number | null;
}

/** chatStates/{playerId} as written: real Dates, stored as Firestore Timestamps. */
export interface ChatStateWrite extends BaseDocument {
  playerId: string;
  lastSender: Sender;
  lastInboundAt: Date | null;
  lastOutboundAt: Date | null;
  nextNudgeAt: Date | null;
  nudgedAt: Date | null;
  stateUpdatedAt: Date;
}

// ---------- Settings ----------

export const RULE_KEYS = [
  'noDoubleText',
  'noInstantReply',
  'matchLength',
  'matchPace',
  'quietHours',
  'resumeAfter',
] as const;

export type RuleKey = (typeof RULE_KEYS)[number];

export interface QuietHours {
  /** HH:mm, local to `timeZone`. A window may cross midnight (22:00–09:00). */
  start: string;
  end: string;
}

export interface ChatSettings extends BaseDocument {
  /** Base text of "My style" in the AI brief. Empty = the translated default. */
  aiInstructions: string;
  rules: Record<RuleKey, boolean>;
  resumeAfterHours: number;
  minReplyDelayMin: number;
  quietHours: QuietHours;
  /** IANA zone of the browser; used by the nudge function for quiet hours. */
  timeZone: string;
  nudgesEnabled: boolean;
}

export type ChatSettingsInput = Omit<ChatSettings, keyof BaseDocument>;

export const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const DEFAULT_CHAT_SETTINGS: ChatSettingsInput = {
  aiInstructions: '',
  rules: {
    noDoubleText: true,
    noInstantReply: true,
    matchLength: true,
    matchPace: true,
    quietHours: true,
    resumeAfter: true,
  },
  resumeAfterHours: 72,
  minReplyDelayMin: 20,
  quietHours: { start: '22:00', end: '09:00' },
  timeZone: '',
  nudgesEnabled: false,
};

/** A missing settings doc (or missing fields) means defaults. */
export const withDefaults = (
  stored: Partial<ChatSettingsInput> | null | undefined,
): ChatSettingsInput => ({
  ...DEFAULT_CHAT_SETTINGS,
  ...stored,
  rules: { ...DEFAULT_CHAT_SETTINGS.rules, ...stored?.rules },
  quietHours: { ...DEFAULT_CHAT_SETTINGS.quietHours, ...stored?.quietHours },
  timeZone: stored?.timeZone || browserTimeZone(),
});

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
 * Duplicated in functions/src/nudges for the server.
 */
export const isInQuietHours = (now: Date, { start, end }: QuietHours, timeZone: string) => {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === to) return false;
  const current = minutesIn(now, timeZone);
  return from < to ? current >= from && current < to : current >= from || current < to;
};

// ---------- Reminders ----------

export type Reminder =
  | { rule: 'noDoubleText'; until: number | null }
  | { rule: 'noInstantReply'; after: number }
  | { rule: 'matchLength' }
  | { rule: 'matchPace'; pace: string }
  | { rule: 'quietHours' }
  | { rule: 'resumeAfter' };

/** The reminders that apply right now, in rule order. Only enabled rules count. */
export const computeReminders = (
  state: ChatState | null,
  settings: ChatSettingsInput,
  profile: Pick<ChatProfileInput, 'replyTime'>,
  now: Date,
): Reminder[] => {
  const on = settings.rules;
  const time = now.getTime();
  const reminders: Reminder[] = [];

  if (on.noDoubleText && state?.lastSender === 'me') {
    reminders.push({ rule: 'noDoubleText', until: state.nextNudgeAt });
  }
  if (on.noInstantReply && state?.lastSender === 'them' && state.lastInboundAt !== null) {
    const after = state.lastInboundAt + settings.minReplyDelayMin * 60_000;
    if (time < after) reminders.push({ rule: 'noInstantReply', after });
  }
  if (on.matchLength) reminders.push({ rule: 'matchLength' });
  if (on.matchPace && profile.replyTime)
    reminders.push({ rule: 'matchPace', pace: profile.replyTime });
  if (on.quietHours && isInQuietHours(now, settings.quietHours, settings.timeZone)) {
    reminders.push({ rule: 'quietHours' });
  }
  if (on.resumeAfter && state?.nextNudgeAt != null && time >= state.nextNudgeAt) {
    reminders.push({ rule: 'resumeAfter' });
  }
  return reminders;
};

// ---------- AI brief ----------

/** Read-only context for the brief, fetched when the user copies it. */
export interface BriefContext {
  nickname: string;
  pinnedNotes: { category: string; text: string }[];
  intel: { category: string; text: string }[];
}

// ---------- Devices and openers (push and AI) ----------

export const DEVICES_COLLECTION = 'devices';

/** devices/{sha256(token)}: one doc per browser that receives nudges. */
export interface Device extends BaseDocument {
  token: string;
  language: string;
  userAgent: string;
}

/** This browser's device doc id, kept so it can be removed when nudges are turned off. */
export const DEVICE_ID_STORAGE_KEY = 'chat.deviceId';

export const OPENER_TONES = ['playful', 'warm', 'curious', 'bold'] as const;

export type OpenerTone = (typeof OPENER_TONES)[number];

export interface Opener {
  text: string;
  tone: OpenerTone;
}

/** Hex SHA-256 of the push token: a stable doc id, so registering twice is an upsert. */
export const deviceIdOf = async (token: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};
