import type { GlobalOptions } from 'firebase-functions';

/** Shared by every function: close to Firestore (eur3) and capped, since one person uses the app. */
export const FUNCTION_OPTIONS = {
  region: 'europe-west1',
  maxInstances: 2,
} satisfies GlobalOptions;
