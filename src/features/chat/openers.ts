import { Schema } from '../../firebase/ai';
import {
  OPENER_TONES,
  PROFILE_OPTIONS,
  RULE_KEYS,
  type BriefContext,
  type ChatProfileInput,
  type ChatSettingsInput,
  type ChatState,
} from './types';

/** Structured output: 2–3 openers, each with a tone. */
export const OPENERS_SCHEMA = Schema.object({
  properties: {
    openers: Schema.array({
      items: Schema.object({
        properties: {
          text: Schema.string(),
          tone: Schema.enumString({ enum: [...OPENER_TONES] }),
        },
      }),
    }),
  },
});

interface OpenersPromptInput {
  context: BriefContext;
  profile: ChatProfileInput;
  settings: ChatSettingsInput;
  state: ChatState | null;
  /** English name of the UI language, e.g. "Romanian". */
  languageName: string;
  /** The user's default style text (translated), used when no base instructions are set. */
  defaultStyle: string;
  now: Date;
}

const hoursSince = (millis: number | null, now: Date) =>
  millis === null ? null : Math.round((now.getTime() - millis) / 3_600_000);

/**
 * The prompt sent to Gemini for openers. Kept short: pinned key notes and the latest 10 intel
 * entries only. The instructions are in English; the openers are written in `languageName`.
 */
export const buildOpenersPrompt = ({
  context,
  profile,
  settings,
  state,
  languageName,
  defaultStyle,
  now,
}: OpenersPromptInput): string => {
  const lines: string[] = [
    'You help me restart a chat with someone I am dating.',
    `Write 2 or 3 short opening messages in ${languageName} that I could send now.`,
    'Sound like a real person texting: natural, specific, no pickup lines, no pressure, no emojis unless the profile says they like them.',
    `Give each opener a tone: one of ${OPENER_TONES.join(', ')}.`,
    '',
    'Rules I follow:',
    ...RULE_KEYS.filter((rule) => settings.rules[rule]).map((rule) => `- ${rule}`),
    '',
    `About them (nickname: ${context.nickname || 'unknown'}):`,
  ];
  (Object.keys(PROFILE_OPTIONS) as (keyof typeof PROFILE_OPTIONS)[]).forEach((field) => {
    if (profile[field]) lines.push(`- ${field}: ${profile[field]}`);
  });
  if (profile.topicsThatLand.length)
    lines.push(`- topics that land: ${profile.topicsThatLand.join(', ')}`);
  if (profile.topicsToAvoid.length)
    lines.push(`- topics to avoid: ${profile.topicsToAvoid.join(', ')}`);
  context.pinnedNotes.forEach((note) => lines.push(`- key fact (${note.category}): ${note.text}`));
  context.intel.forEach((entry) => lines.push(`- intel (${entry.category}): ${entry.text}`));
  lines.push('');

  if (state) {
    const last = state.lastSender === 'me' ? state.lastOutboundAt : state.lastInboundAt;
    const hours = hoursSince(last, now);
    lines.push(
      `Chat state: the last message was sent by ${state.lastSender === 'me' ? 'me' : 'them'}` +
        (hours !== null ? `, about ${hours} hours ago.` : '.'),
    );
  } else {
    lines.push('Chat state: unknown.');
  }
  lines.push('', 'My style:', settings.aiInstructions.trim() || defaultStyle);
  if (profile.aiNotes.trim()) lines.push(profile.aiNotes.trim());
  return lines.join('\n');
};
