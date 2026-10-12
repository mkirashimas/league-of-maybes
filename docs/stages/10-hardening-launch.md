# Stage 10: Hardening and launch

**Status:** ⏸ in review (2026-10-12), branch `stage/10-hardening-launch`

## 1. Goal

Final security rules, indexes and tests. Polish for mobile and accessibility, then deploy.

## 2. Scope

**In**

- Final `firestore.rules` and `firestore.indexes.json`, including the collection-group override on `chatStates.nextNudgeAt` (R17, already shipped in stage 9)
- Emulator rule tests with `@firebase/rules-unit-testing` in `tests/rules/`:
  - The owner can read and write.
  - Another user and anonymous users are denied.
- Mobile pass at 375px on every page. Accessibility pass on labels, focus, contrast in both themes, and tap target size.
- `firebase deploy` (hosting, firestore, functions)

## 3. Files created and changed

- `tests/rules/firestore.rules.test.mjs`, `package.json` (`test:rules`, `@firebase/rules-unit-testing`)
- `firebase.json` (emulator config, Hosting headers), `.github/workflows/ci.yml` (`rules` job)
- `src/theme/palette.ts` (light `text.secondary`), README

## 4. Data and endpoints touched

None new.

## 5. i18n keys added

None. Parity: 0 missing keys.

## 6. Implementation notes (as built)

- **Rules:** unchanged. Everything stays owner-only under `users/{uid}`, and everything else is denied. That includes `deletionCodes/{uid}`, which only Cloud Functions use.
- **Rule tests** (`yarn test:rules`) cover 8 cases:
  - The owner can read, write and delete the user doc and everything under it, but can't touch their deletion code.
  - Another user and a signed-out visitor can't read, list, write or delete any of it.
  - Paths outside `users/{uid}` are denied.

  Two more details:
  - They run with Node's built-in test runner, inside `firebase emulators:exec` with the `demo-league-of-maybes` project, so nothing reaches the real project.
  - **Mutation check:** with the rules opened to everyone, 6 of the 8 tests fail, so the tests catch a leak.

- **CI:** a second job, `rules`, installs Java 21 and the Firebase CLI (`yarn global add`) and runs the tests.
- **Indexes:** every query in the app was checked against `firestore.indexes.json`. All of them are covered: composite indexes for the `playerId` + `orderBy` lists, `done` + `when` for Upcoming, and the `nextNudgeAt` collection-group override. The two-equality "now" query needs no composite index.
- **`@firebase/rules-unit-testing` 5.0.2,** not 6: version 6 needs Node 24, and the project and CI run Node 22.
- **Hosting headers:**
  - `/assets/**` (hashed files): cached for a year, `immutable`.
  - `index.html`, the messaging service worker, the manifest and every route without a file extension: `no-cache`, so a deploy is picked up at once and old pages never point to deleted assets.
  - Everywhere: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: DENY`, `Permissions-Policy`.
  - No CSP yet: Firebase Auth, App Check (reCAPTCHA) and the compat SDK in the service worker load from several Google origins, so a CSP needs testing on the live site first.
- **Contrast** (WCAG AA, 4.5:1 for text): computed for both palettes. Only light `text.secondary` on the light sidebar was below (4.39). It's now `#585e64`: 4.81 on the sidebar, 5.34 on the background, 6.11 on paper. Dark mode: 6.1 or more everywhere.
- **Labels:** every `IconButton` has an `aria-label` or a `Tooltip` title, every Avatar with a photo has `alt`, and no fixed widths are left without a phone override.
- **375px:** the public pages (Login, Terms, Privacy) were measured in headless Chrome with a 375px phone viewport: content width = viewport width, light and dark. The signed-in pages need a Google sign-in, so they're on the manual checklist.

## 7. Deviations from plan

- The rule tests use Node's test runner and plain `.mjs` instead of a test framework, so there's no new test tooling.
- The rule tests also run in CI (not planned).
- The local Hosting emulator ignores custom headers, so they're checked on the live site after deploy.

## 8. Verification checklist

- [x] Rule tests pass in the emulator (8/8). With rules opened to everyone, 6 fail.
- [x] `yarn build` and `yarn lint` are clean, at the root and in `functions/`. Prettier is clean. i18n parity: 0 missing keys.
- [x] Public pages at 375px: no horizontal scroll, light and dark.
- [ ] Deploy: `yarn build`, then `firebase deploy` (prerequisite 10).
- [ ] The live site loads at https://league-of-maybes.web.app, and sign-in works there.
- [ ] Headers on the live site: `curl -sI https://league-of-maybes.web.app/roster` shows `cache-control: no-cache` and `x-frame-options: DENY`. An `/assets/…js` file shows `max-age=31536000, immutable`.
- [ ] Firebase console → Firestore → Indexes: every index shows "Enabled".
- [ ] Signed-in pages at 375px (Chrome DevTools → device toolbar → iPhone SE), in light and dark: no horizontal scroll on League Table, player tabs, Timeline, Upcoming, Traits, Chat settings, Account.
- [ ] Keyboard: Tab reaches every control in a visible order, with a visible focus ring. Dialogs trap focus and close with Esc.
- [ ] The full manual pass from the plan's verification section.
- [ ] Push on iPhone: install the app from Safari (Share → Add to Home Screen), open it from the icon, turn nudges on, force-run `sendNudges`.

## 9. Open issues / follow-ups

- A Content-Security-Policy, once the live site's request origins are known (report-only first).
- App Check enforcement for Firebase AI Logic (prerequisite 6).
- First release: `development` → `main` (see [workflow](../workflow.md)).
