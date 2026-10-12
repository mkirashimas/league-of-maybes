# Stage 9: Cloud Functions and Account

**Status:** ⏸ in review (2026-10-12), branch `stage/09-functions`

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

- `functions/**`: `src/index.ts`, `src/options.ts`, `src/nudges/{sendNudges,quietHours,texts}.ts`, `src/account/account.ts`, own ESLint and TS config
- `firebase.json` (functions block, predeploy build), `firestore.indexes.json` (field override)
- `src/firebase/functions.ts`, `vite.config.ts` (`firebase-functions` chunk)
- `src/features/legal/**`: `AccountPage`, `legalExportAccount`, `legalDeleteAccount`, `account.*` keys
- `src/hoc/Routing.tsx`: `ACCOUNT` shows `AccountPage`; the `ComingSoon` placeholder and its `common` keys are gone
- Root `eslint.config.js` and `.prettierignore`: `functions/` is linted by its own config

## 4. Data and endpoints touched

- All of `users/{uid}` (export and delete)
- `chatStates`, `devices`, `settings/chat`, `players` (from the nudge job)

## 5. i18n keys added

`legal` namespace: `account.*`. Push texts live in `functions/src/nudges/texts.ts`.

## 6. Implementation notes (as built)

- **Runtime:** Node 22, `firebase-functions` 7, `firebase-admin` 14, CommonJS output in `functions/lib`. `FUNCTION_OPTIONS` (region and `maxInstances`) is spread into every function, so it doesn't depend on module load order.
- **`sendNudges`** (every 60 min, UTC):
  1. Collection-group query: `chatStates` with `nextNudgeAt <= now`, grouped by owner uid.
  2. Nudges off: skipped, `nextNudgeAt` kept.
  3. Quiet hours: skipped, `nextNudgeAt` kept, so the first run after the window sends it. Quiet hours always apply to pushes, even when the quiet-hours _reminder_ is switched off.
  4. Player missing or retired: `nextNudgeAt` cleared.
  5. No devices: `nextNudgeAt` cleared, so it doesn't retry every hour.
  6. Otherwise one multicast per device language. The notification has a generic title and body, `tag: nudge-{playerId}` (a newer nudge for the same player replaces the old one), `data: { playerId, link }` and `webpush.fcmOptions.link` = `https://league-of-maybes.web.app/roster/{playerId}/chat?nudge=1`.
  7. Dead tokens (`registration-token-not-registered`, `invalid-registration-token`) delete their device doc.
  8. Delivered: `nextNudgeAt = null`, `nudgedAt = now`. Nothing delivered and some error may pass: kept for the next run.
- **No lost updates:** the job writes `chatStates` with a `lastUpdateTime` precondition. If the user logged a message during the run, the write fails and the new state stays.
- **`exportAccount`** walks `users/{uid}` with `listCollections` and `listDocuments`, so it also finds documents that only exist as parents. The result is `{ exportedAt, uid, user: { id, data, collections } }`, with Timestamps as ISO strings. The client saves it as `league-of-maybes-YYYY-MM-DD.json`.
- **`deleteAccount`:** `recursiveDelete(users/{uid})`, then `deleteUser(uid)`. The client then signs out, calls `api.util.resetApiState()` and goes to `LOGIN` (R15). The dialog needs an "I understand" checkbox first.
- **Bundle:** the Functions SDK is loaded on first use (`import()` in `legal/api.ts`), in its own 8 kB chunk. The Firebase core chunk stays at 531 kB.

## 7. Deviations from plan

- **R17 moved from stage 10 to stage 9.** The `chatStates.nextNudgeAt` collection-group index is a field override in `firestore.indexes.json`, because `sendNudges` fails without it (D-014).
- **Verification against the deployed project, not the emulator.** FCM can't be emulated, and the callables need App Check. The job is run by hand from Cloud Scheduler (D-014).

## 8. Verification checklist

- [x] `yarn build` and `yarn lint` are clean, at the root and in `functions/`. Prettier is clean.
- [x] i18n parity: 0 missing keys.
- [x] Quiet hours checked against the compiled function: 23:30 and 08:30 inside 22:00–09:00, 09:00 and 15:00 outside, an equal start and end means none.
- [ ] Deploy: `firebase deploy --only functions,firestore:indexes` (prerequisite 9).
- [ ] Nudges on (stage 8 items, including in Brave after the push setting): `users/{uid}/devices` has one doc.
- [ ] In the Firestore console, set a chat state's `nextNudgeAt` in the past. Google Cloud console → Cloud Scheduler → `firebase-schedule-sendNudges-europe-west1` → **Force run**. The push arrives, a click opens the chat tab with the nudge banner, and `nextNudgeAt` becomes null with `nudgedAt` set.
- [ ] Set quiet hours around the current time and repeat: nothing arrives and `nextNudgeAt` stays. A retired player's state is cleared without a push.
- [ ] Account → **Download export**: the JSON file holds the players and their records.
- [ ] Account → **Delete account** on a test account: all of `users/{uid}` and the auth user are gone, and the app lands on Login.

## 9. Open issues / follow-ups

- The notification link points at the Hosting URL, so a click on a nudge opens the deployed app even when testing on `localhost`.
- Stage 10: deploy Hosting, then test push on iPhone (installed app).
