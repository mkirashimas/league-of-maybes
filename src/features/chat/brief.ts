import type { TFunction } from 'i18next';
import {
  PROFILE_OPTIONS,
  RULE_KEYS,
  type BriefContext,
  type ChatProfileInput,
  type ChatSettingsInput,
  type ChatState,
} from './types';

interface BriefInput {
  t: TFunction;
  language: string | undefined;
  context: BriefContext;
  profile: ChatProfileInput;
  settings: ChatSettingsInput;
  state: ChatState | null;
  now: Date;
}

const relativeAgo = (millis: number, now: Date, language: string | undefined) => {
  const minutes = Math.round((now.getTime() - millis) / 60_000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  if (minutes < 60) return format.format(-minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 48) return format.format(-hours, 'hour');
  return format.format(-Math.round(hours / 24), 'day');
};

/**
 * Assembles the AI brief at copy time. Never stored. The template lives in the chat locale
 * files (`tpl.*`) so the brief is written in the user's language.
 */
export const buildBrief = ({
  t,
  language,
  context,
  profile,
  settings,
  state,
  now,
}: BriefInput): string => {
  const lines: string[] = [];
  const bullet = (text: string) => `- ${text}`;

  lines.push(t('tpl.role'), '');

  const rules = RULE_KEYS.filter((rule) => settings.rules[rule]);
  if (rules.length > 0) {
    lines.push(t('tpl.rules'));
    rules.forEach((rule) => lines.push(bullet(t(`rules.${rule}`))));
    lines.push('');
  }

  lines.push(t('tpl.about', { nickname: context.nickname || '?' }));
  (Object.keys(PROFILE_OPTIONS) as (keyof typeof PROFILE_OPTIONS)[]).forEach((field) => {
    const value = profile[field];
    if (value) lines.push(bullet(`${t(`profile.${field}`)}: ${t(`option.${field}.${value}`)}`));
  });
  if (profile.topicsThatLand.length > 0) {
    lines.push(bullet(`${t('profile.topicsThatLand')}: ${profile.topicsThatLand.join(', ')}`));
  }
  if (profile.topicsToAvoid.length > 0) {
    lines.push(bullet(`${t('profile.topicsToAvoid')}: ${profile.topicsToAvoid.join(', ')}`));
  }
  if (context.pinnedNotes.length > 0) {
    lines.push(t('tpl.pinned'));
    context.pinnedNotes.forEach((note) => lines.push(bullet(note.text)));
  }
  if (context.intel.length > 0) {
    lines.push(t('tpl.intel'));
    context.intel.forEach((entry) => lines.push(bullet(entry.text)));
  }
  lines.push('');

  if (state) {
    const at = state.lastSender === 'me' ? state.lastOutboundAt : state.lastInboundAt;
    lines.push(
      t('tpl.state', {
        sender: t(state.lastSender === 'me' ? 'tpl.me' : 'tpl.them'),
        ago: at !== null ? relativeAgo(at, now, language) : '?',
      }),
    );
  } else {
    lines.push(t('tpl.stateNone'));
  }
  lines.push('');

  const style = [settings.aiInstructions || t('settings.defaultInstructions'), profile.aiNotes]
    .map((part) => part.trim())
    .filter(Boolean);
  lines.push(t('tpl.style'));
  style.forEach((part) => lines.push(part));
  lines.push('');

  lines.push(t('tpl.latest'), t('tpl.paste'));
  return lines.join('\n');
};
