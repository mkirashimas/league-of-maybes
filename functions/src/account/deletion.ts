import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError, onCall } from 'firebase-functions/https';
import { CALLABLE_OPTIONS, requireUid } from '../callable';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * deletionCodes/{uid}: the hashed code that guards account deletion. It sits outside users/{uid},
 * so the deny-by-default rules keep the client from reading or rewriting it.
 */
const codeRef = (uid: string) => getFirestore().doc(`deletionCodes/${uid}`);

/** What the client learns: users/{uid}.deletionCodeSetAt is set once a code exists. */
const userRef = (uid: string) => getFirestore().doc(`users/${uid}`);

const MIN_CODE_LENGTH = 6;
const MAX_CODE_LENGTH = 64;
const KEY_LENGTH = 32;

/** After this many wrong codes in a row, the code is locked for LOCK_MINUTES. */
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 60;

interface StoredCode {
  salt: string;
  hash: string;
  failedAttempts: number;
  lockedUntil: Timestamp | null;
}

const hashCode = async (code: string, salt: Buffer) => scryptAsync(code, salt, KEY_LENGTH);

const readCode = (value: unknown, field: string): string => {
  if (typeof value !== 'string') throw new HttpsError('invalid-argument', `${field} is missing.`);
  return value;
};

/**
 * Checks `code` against the stored one. Wrong codes are counted, and too many lock the code for
 * a while, so it can't be guessed. Throws when there is no code, it's locked or it's wrong.
 */
const verifyCode = async (uid: string, code: string): Promise<void> => {
  const snapshot = await codeRef(uid).get();
  if (!snapshot.exists) throw new HttpsError('failed-precondition', 'No deletion code is set.');
  const stored = snapshot.data() as StoredCode;

  if (stored.lockedUntil && stored.lockedUntil.toMillis() > Date.now()) {
    throw new HttpsError('resource-exhausted', 'Too many wrong codes. Try again later.');
  }

  const expected = Buffer.from(stored.hash, 'base64');
  const actual = await hashCode(code, Buffer.from(stored.salt, 'base64'));
  if (!timingSafeEqual(expected, actual)) {
    const failedAttempts = (stored.failedAttempts ?? 0) + 1;
    const locked = failedAttempts >= MAX_ATTEMPTS;
    await snapshot.ref.update({
      failedAttempts: locked ? 0 : failedAttempts,
      lockedUntil: locked ? Timestamp.fromMillis(Date.now() + LOCK_MINUTES * 60_000) : null,
    });
    throw new HttpsError('permission-denied', 'Wrong deletion code.');
  }
  if (stored.failedAttempts || stored.lockedUntil) {
    await snapshot.ref.update({ failedAttempts: 0, lockedUntil: null });
  }
};

/**
 * Sets the deletion code, or changes it. Changing it needs the current code, so someone who gets
 * hold of an open session can't replace the code and delete the account.
 */
export const setDeletionCode = onCall(CALLABLE_OPTIONS, async (request): Promise<null> => {
  const uid = requireUid(request);
  const data = (request.data ?? {}) as { code?: unknown; currentCode?: unknown };
  const code = readCode(data.code, 'code');
  if (code.length < MIN_CODE_LENGTH || code.length > MAX_CODE_LENGTH) {
    throw new HttpsError(
      'invalid-argument',
      `The code needs ${MIN_CODE_LENGTH}–${MAX_CODE_LENGTH} characters.`,
    );
  }

  if ((await codeRef(uid).get()).exists) {
    await verifyCode(uid, readCode(data.currentCode, 'currentCode'));
  }

  const salt = randomBytes(16);
  const hash = await hashCode(code, salt);
  await codeRef(uid).set({
    salt: salt.toString('base64'),
    hash: hash.toString('base64'),
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await userRef(uid).set({ deletionCodeSetAt: FieldValue.serverTimestamp() }, { merge: true });
  return null;
});

/**
 * Deletes the account for good: everything under users/{uid}, the deletion code, then the auth
 * user (R15). Only with the correct deletion code. There is no backup and no undo.
 */
export const deleteAccount = onCall(CALLABLE_OPTIONS, async (request): Promise<null> => {
  const uid = requireUid(request);
  const data = (request.data ?? {}) as { code?: unknown };
  await verifyCode(uid, readCode(data.code, 'code'));

  const db = getFirestore();
  await db.recursiveDelete(userRef(uid));
  await codeRef(uid).delete();
  await getAuth().deleteUser(uid);
  logger.info('Account deleted', { uid });
  return null;
});
