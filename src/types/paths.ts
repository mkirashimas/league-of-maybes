export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  CONSENT: '/consent',
  ROSTER: '/roster',
  PLAYER_NEW: '/roster/new',
  PLAYER: '/roster/:playerId',
  PLAYER_INTEL: '/roster/:playerId/intel',
  PLAYER_CHAT: '/roster/:playerId/chat',
  PLAYER_DATES: '/roster/:playerId/dates',
  PLAYER_AGENDA: '/roster/:playerId/now',
  PLAYER_KEY_NOTES: '/roster/:playerId/key-notes',
  TIMELINE: '/timeline',
  AGENDA: '/upcoming',
  TRAIT_SETTINGS: '/settings/traits',
  CHAT_SETTINGS: '/settings/chat',
  ACCOUNT: '/settings/account',
  NOT_FOUND: '*',
} as const;

export type Path = (typeof PATHS)[keyof typeof PATHS];
