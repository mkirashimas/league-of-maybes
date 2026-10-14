// Security rule tests, run against the Firestore emulator: `yarn test:rules`.
// The project id starts with "demo-", so the emulator never talks to the real project.
import { after, before, beforeEach, describe, test } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-league-of-maybes';
const ALICE = 'alice';
const BOB = 'bob';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await env?.cleanup();
});

// Seed Alice's data with rules switched off, so each test starts from the same state.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `users/${ALICE}`), { consent: { termsVersion: 'x', acceptedAt: 1 } });
    await setDoc(doc(db, `users/${ALICE}/players/p1`), { nickname: 'Sunny', status: 'active' });
    await setDoc(doc(db, `users/${ALICE}/settings/chat`), { nudgesEnabled: true });
    await setDoc(doc(db, `users/${ALICE}/cycleProfiles/p1`), { periodStarts: ['2026-10-01'] });
    await setDoc(doc(db, `users/${ALICE}/cycleNotes/n1`), { playerId: 'p1', date: '2026-10-02' });
    await setDoc(doc(db, `deletionCodes/${ALICE}`), { salt: 's', hash: 'h' });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anonymous = () => env.unauthenticatedContext().firestore();

describe('the owner', () => {
  test('reads and writes their user doc', async () => {
    const db = as(ALICE);
    await assertSucceeds(getDoc(doc(db, `users/${ALICE}`)));
    await assertSucceeds(setDoc(doc(db, `users/${ALICE}`), { consent: null }, { merge: true }));
  });

  test('reads, writes and deletes everything under users/{uid}', async () => {
    const db = as(ALICE);
    await assertSucceeds(getDocs(collection(db, `users/${ALICE}/players`)));
    await assertSucceeds(setDoc(doc(db, `users/${ALICE}/players/p2`), { nickname: 'Nova' }));
    await assertSucceeds(getDoc(doc(db, `users/${ALICE}/settings/chat`)));
    await assertSucceeds(getDoc(doc(db, `users/${ALICE}/cycleProfiles/p1`)));
    await assertSucceeds(getDocs(collection(db, `users/${ALICE}/cycleNotes`)));
    await assertSucceeds(deleteDoc(doc(db, `users/${ALICE}/players/p1`)));
  });

  test('cannot read or write their deletion code (server only)', async () => {
    const db = as(ALICE);
    await assertFails(getDoc(doc(db, `deletionCodes/${ALICE}`)));
    await assertFails(setDoc(doc(db, `deletionCodes/${ALICE}`), { salt: 'x', hash: 'y' }));
    await assertFails(deleteDoc(doc(db, `deletionCodes/${ALICE}`)));
  });
});

describe('another signed-in user', () => {
  test('cannot read or write the user doc', async () => {
    const db = as(BOB);
    await assertFails(getDoc(doc(db, `users/${ALICE}`)));
    await assertFails(setDoc(doc(db, `users/${ALICE}`), { consent: null }));
  });

  test('cannot read, list, write or delete anything under it', async () => {
    const db = as(BOB);
    await assertFails(getDoc(doc(db, `users/${ALICE}/players/p1`)));
    await assertFails(getDocs(collection(db, `users/${ALICE}/players`)));
    await assertFails(setDoc(doc(db, `users/${ALICE}/players/p2`), { nickname: 'Nova' }));
    await assertFails(deleteDoc(doc(db, `users/${ALICE}/players/p1`)));
    await assertFails(getDoc(doc(db, `users/${ALICE}/settings/chat`)));
  });

  test('cannot read or list cycle (health) data', async () => {
    const db = as(BOB);
    await assertFails(getDoc(doc(db, `users/${ALICE}/cycleProfiles/p1`)));
    await assertFails(getDocs(collection(db, `users/${ALICE}/cycleNotes`)));
    await assertFails(setDoc(doc(db, `users/${ALICE}/cycleNotes/n2`), { playerId: 'p1' }));
  });

  test('cannot read the deletion code', async () => {
    await assertFails(getDoc(doc(as(BOB), `deletionCodes/${ALICE}`)));
  });
});

describe('a signed-out visitor', () => {
  test('cannot read or write any user data', async () => {
    const db = anonymous();
    await assertFails(getDoc(doc(db, `users/${ALICE}`)));
    await assertFails(getDoc(doc(db, `users/${ALICE}/players/p1`)));
    await assertFails(setDoc(doc(db, `users/${ALICE}/players/p2`), { nickname: 'Nova' }));
    await assertFails(getDoc(doc(db, `deletionCodes/${ALICE}`)));
  });
});

describe('anything outside users/{uid}', () => {
  test('is denied by default', async () => {
    await assertFails(getDoc(doc(as(ALICE), 'other/x')));
    await assertFails(setDoc(doc(as(ALICE), 'other/x'), { a: 1 }));
    await assertFails(setDoc(doc(as(ALICE), 'users/x'), { a: 1 }));
  });
});
