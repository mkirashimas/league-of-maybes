# Stage 1: Shell

**Status:** ⬜ planned

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

`auth`: `signIn`, `signInError`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] `yarn build` and `yarn lint` are clean.
- [ ] `yarn dev`: `/roster` redirects to `/login` when signed out.
- [ ] With the real config: Google sign-in works and lands on the layout. Sign out returns to Login.
- [ ] Theme toggle works and survives a reload. The language switcher lists en, es, fr, it, ro, and the choice persists.
- [ ] At 375px, the drawer is temporary and there's no horizontal scroll.

## 9. Open issues / follow-ups

_None yet._
