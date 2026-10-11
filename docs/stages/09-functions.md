# Stage 9: Cloud Functions and Account

**Status:** ⬜ planned. Needs prerequisite 4 (Blaze).

## 1. Goal

- Scheduled nudges.
- The user can export or delete their whole account.

## 2. Scope

**In**

- `functions/`: own `package.json` (Yarn, TS strict), region `europe-west1`, `maxInstances: 2`
  - `sendNudges` (every 60 min): collection-group query on `chatStates`; skips for nudges-off, quiet hours (R12) and retired players; `sendEachForMulticast` with generic push text in 5 languages; deletes invalid tokens
  - `exportAccount` (callable): all of `users/{uid}` as JSON
  - `deleteAccount` (callable): `recursiveDelete`, then `auth.deleteUser` (R15)
  - Both callables use `enforceAppCheck: true` and `request.auth.uid` only (R16)
- `src/firebase/functions.ts`: `callFunction`, region-aware (R9)
- `legal`: `AccountPage` with export, plus delete with confirmation, then sign out, `resetApiState` and Login
- `firebase.json`: a `functions` block

## 3. Files created and changed

`functions/**`, `firebase.json`, `src/firebase/functions.ts`, `src/features/legal/**`

## 4. Data and endpoints touched

- All of `users/{uid}` (export and delete)
- `chatStates`, `devices`, `settings/chat`, `players` (from the nudge job)

## 5. i18n keys added

`legal` namespace: `account.*`. Push texts live in `functions/src/nudges/texts.ts`.

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] `yarn build` and `yarn lint` are clean in `functions/`.
- [ ] In the emulator, with `nextNudgeAt` set in the past, the push arrives and `nextNudgeAt` becomes null.
- [ ] Quiet hours (including past midnight) leave `nextNudgeAt` as it was. A retired player clears it.
- [ ] Export downloads JSON. Delete removes all data and the auth user, and the client lands on Login with an empty cache.

## 9. Open issues / follow-ups

_None yet._
