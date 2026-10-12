import { HttpsError, type CallableRequest } from 'firebase-functions/https';
import { FUNCTION_OPTIONS } from './options';

/** Callables accept requests only from the app (App Check) and act on the caller's own uid (R16). */
export const CALLABLE_OPTIONS = { ...FUNCTION_OPTIONS, enforceAppCheck: true };

export const requireUid = (request: CallableRequest): string => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return request.auth.uid;
};
