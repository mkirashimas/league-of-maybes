# Stage 1: Shell

**Status:** ⏸ in review (2026-10-12), branch `stage/01-shell`

## 1. Goal

A running app shell: sign in with Google, get through the auth guard, and see the app layout in light and dark mode in all 5 languages. All infrastructure helpers are in place.

## 2. Scope

**In**

- `types/`: `PATHS` with every route from the architecture, `Path`, `Language`, `LANGUAGES`, `THEME_MODES`, `ThemeMode`, `BaseDocument`
- `theme/`: `createAppTheme(mode, locale)`, `getPalette(mode)` (monochrome primary, neutral surfaces, `surface.sidebar`), typography, component overrides (`MuiPaper` `backgroundImage: 'none'`), augmentation
- `store/`: `configureStore`, typed hooks, base `api` (`fakeBaseQuery`), `authSlice`, `themeSlice` (localStorage, then `prefers-color-scheme`)
- `i18n/`: init with the detector (localStorage, then browser), `common` in 5 languages, including `app.name` and `app.motto`
- `firebase/`:
  - `config.ts` with `REPLACE_WITH_…` placeholders
  - `auth.ts`
  - `firestore.ts` (R5 recursive serialization, R6 `merge`, `runBatch`, R7 `runTransactionFn`)
- `hoc/`: `App` (providers, theme rebuilt on mode or language change, auth listener), `Routing` (auth guard; other routes stubbed), `Layout` (top bar, sidebar Drawer that is permanent from `md` up and temporary below it, user menu)
- `features/auth`: `LoginPage` with the name, motto and Google button
- `firestore.rules`: owner-only rule for `users/{uid}/{document=**}`

**Out**

- The consent gate (stage 2)
- Any feature pages

## 3. Files created and changed

`src/types/*`, `src/theme/*`, `src/store/*`, `src/i18n/**`, `src/firebase/{config,auth,firestore}.ts`, `src/hoc/{App,Routing,Layout}.tsx`, `src/features/auth/**`, `firestore.rules`

## 4. Data and endpoints touched

None. Only the helpers.

## 5. i18n keys added

`common`:

- `app.name`, `app.motto`
- `nav.*`
- `theme.switchToDark`, `theme.switchToLight`
- `language.label`, `language.{en,es,fr,it,ro}`
- `user.signOut`, `user.account`

`auth`: `signInWithGoogle`, `signInError`, `privateNote`

`common` also has `actions.*`, `comingSoon.*`, `loadError`, `saveError`. The keys are flat (`appName`, `motto`, `signOut`, `account`, `language`, `languages.*`), following `prothext-facts`.

## 6. Implementation notes (as built)

- **Copied from `prothext-facts`, unchanged:** `theme/*`, `store/{index,api,authSlice,themeSlice}.ts`, `i18n/index.ts` (with `registerNamespace` and `toLanguage`), and the auth feature's `index.ts` and `types.ts`.
- **`store/realtime.ts`:**
  - copied: `runQuery` and `syncWhileCached`
  - new: `requireUid(getState)`, which features use to build `users/{uid}/…` paths inside `queryFn` and `onCacheEntryAdded`
- **`firebase/firestore.ts`:**
  - `userPath(uid, ...segments)`
  - recursive Timestamp → millis conversion (R5)
  - `setDocument(…, { merge: true })`, an upsert that keeps `createdAt` (R6)
  - `runBatch` (set, update and delete, with timestamps)
  - `runTransactionFn` with a typed `TransactionContext` (R7)
- **Features import from `firebase/firestore` only for query constraints** (`where`, `orderBy`, `limit`), as `prothext-facts` does. CRUD always goes through the helpers.
- **`firebase/auth.ts`:** Google popup only. There's no `ensureUserProfile`, because the `users/{uid}` doc belongs to `legal` (consent, stage 2).
- **`hoc/App.tsx`:** on sign-out it dispatches `api.util.resetApiState()`, so no cached data from the previous user is left behind.
- **`hoc/Routing.tsx`:**
  - `/` redirects to `/roster`
  - the sidebar sections and `ACCOUNT` render a `ComingSoon` placeholder until their stage lands
  - unknown paths go to `/`
- **`hoc/Layout.tsx`:**
  - sidebar: League Table, Timeline, Upcoming, Traits, Chat settings, with the motto in muted italics at the bottom
  - user menu: name and email, Account, Sign out
- **`firestore.rules`:** owner-only read and write on `users/{uid}` and everything under it. The rules are **not deployed yet** (see section 9).
- **Login page:** the app name, the motto in italics, the Google button, and a "private by design" note.

## 7. Deviations from plan

- The sidebar footer already shows the motto. The Terms and Privacy links come in stage 2 as planned.
- The `common` keys are flat (`appName`, `motto`) instead of `app.name` and `app.motto`, to match `prothext-facts`.

## 8. Verification checklist

- [x] `yarn build` passes. Vite warns that one chunk is over 500 kB; see section 9.
- [x] `yarn lint`: clean.
- [x] Prettier: clean.
- [x] i18n parity script: 0 missing keys (`common` 29 keys, `auth` 3 keys).
- [ ] `yarn dev`: `/roster` redirects to `/login` when signed out.
- [ ] Google sign-in works and lands on the layout. Sign out returns to Login. Needs prerequisite 2.
- [ ] Theme toggle works and survives a reload. The language switcher lists en, es, fr, it, ro, and the choice persists.
- [ ] At 375px, the drawer is temporary and there's no horizontal scroll.

## 9. Open issues / follow-ups

- Deploy the rules: `firebase deploy --only firestore:rules`. This needs `firebase login` and Firestore created in `eur3` (prerequisite 3). It must be done before stage 3 writes any data.
- Bundle size is about 1.1 MB (356 kB gzipped) in one chunk. Split it by route with `React.lazy` once the feature pages exist (stage 3 or later).
- The `chore/repo-setup` PR (#1) isn't merged yet. This branch is based on it. After PR #1 is squash-merged, rebase with `git rebase --onto origin/development chore/repo-setup stage/01-shell`.
