/**
 * Push texts, one per app language. They are generic on purpose: a notification can show on a
 * locked screen, so it never names the player.
 */
export const NUDGE_TEXTS = {
  en: { title: 'Time to check in', body: 'Someone on your roster is waiting for a message.' },
  es: { title: 'Es hora de escribir', body: 'Alguien de tu plantilla espera un mensaje.' },
  fr: { title: 'C’est le moment d’écrire', body: 'Quelqu’un de votre effectif attend un message.' },
  it: { title: 'È ora di farti sentire', body: 'Qualcuno della tua rosa aspetta un messaggio.' },
  ro: { title: 'E momentul să scrii', body: 'Cineva din lotul tău așteaptă un mesaj.' },
} as const;

export type NudgeLanguage = keyof typeof NUDGE_TEXTS;

/** Device languages may carry a region (en-GB); anything unknown falls back to English. */
export const nudgeLanguageOf = (language: string | undefined): NudgeLanguage => {
  const base = (language ?? '').split('-')[0];
  return base in NUDGE_TEXTS ? (base as NudgeLanguage) : 'en';
};
