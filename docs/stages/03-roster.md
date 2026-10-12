# Stage 3: Roster

**Status:** ⏸ in review (2026-10-12), branch `stage/03-roster`

## 1. Goal

Manage players and their trait ratings. See everyone in a sortable League Table. Open a player page with tabs.

## 2. Scope

**In**

- `features/roster`:
  - League Table
  - new-player page and edit dialog
  - Profile & Traits tab
  - `PlayerLayout` with the 6 tabs
  - trait settings
  - default traits seeded on first use
  - weighted `overall`
- Route-level code splitting, plus vendor chunks for Firebase, MUI and React.

**Out**

- Hard delete. Players are retired instead (D-001).
- The other player tabs (Intel, Chat, Dates, Now & Next, Key Notes) show "Coming soon" until their stages.

## 3. Files created and changed

| File                                                                          | What                                                                                                                                    |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/roster/types.ts`                                                | `Player`, `PlayerStatus`, `AvatarColor`, `TraitDefinition`, `TraitKind`, `DEFAULT_TRAITS`, `computeOverall`, `initialsOf`, `toTraitKey` |
| `src/features/roster/api.ts`                                                  | 11 endpoints (section 4)                                                                                                                |
| `src/features/roster/hooks/useTraitDefinitions.ts`                            | Realtime definitions. Seeds the defaults when the list arrives empty, and reports a failed seed as an error.                            |
| `src/features/roster/hooks/useTraitLabels.ts`                                 | Labels for traits, options and units: translated for built-in traits, literal for custom ones                                           |
| `src/features/roster/hooks/useResponsibilityNotice.ts`                        | One-time notice flag in `localStorage`, wrapped in try/catch                                                                            |
| `components/LeagueTablePage.tsx`                                              | Sortable table on desktop. Cards plus a sort select below `md`. Status filter. Empty states.                                            |
| `components/PlayerForm.tsx`, `PlayerFormPage.tsx`, `EditPlayerDialog.tsx`     | Shared form. New page with the responsibility notice. Edit dialog, full-screen below `sm`.                                              |
| `components/PlayerLayout.tsx`                                                 | Header (back, avatar, nickname, status) and scrollable tabs linked to the PATHS                                                         |
| `components/PlayerProfilePage.tsx`, `TraitEditor.tsx`                         | Details with a quick status change. Trait editors: slider for `scale`, number with unit, select for `enum`.                             |
| `components/TraitSettingsPage.tsx`, `AddTraitDialog.tsx`, `ConfirmDialog.tsx` | Add, show/hide, re-weight (0–3), reorder, delete custom traits                                                                          |
| `components/PlayerAvatar.tsx`, `StatusChip.tsx`                               | Initials avatar in a palette color; status chip                                                                                         |
| `src/features/roster/locales/*.json`                                          | `roster` namespace, 93 keys × 5 languages                                                                                               |
| `src/hoc/Routing.tsx`                                                         | Lazy roster pages. Player tab routes nested under `PlayerLayout`.                                                                       |
| `src/hoc/Layout.tsx`                                                          | `<Suspense>` around the `Outlet`                                                                                                        |
| `vite.config.ts`                                                              | Vendor `codeSplitting` groups; `chunkSizeWarningLimit: 600`                                                                             |

## 4. Data and endpoints touched

- `users/{uid}/players/{id}`:
  - `nickname`, `age|null`, `occupation`, `city`, `metAt`
  - `metOn` (yyyy-mm-dd or empty)
  - `avatarColor` (palette key)
  - `status`
  - `traits: { [key]: number|string }`
- `users/{uid}/traitDefinitions/{key}`: `key`, `builtIn`, `customLabel`, `kind`, `unit`, `options[]`, `weight`, `order`, `active`
- **Endpoints:**
  - realtime: `rosterGetPlayers`, `rosterGetPlayer`, `rosterGetTraitDefinitions`
  - writes: `rosterCreatePlayer`, `rosterUpdatePlayer`, `rosterSetPlayerStatus`, `rosterUpdatePlayerTraits`, `rosterUpsertTraitDefinition`, `rosterDeleteTraitDefinition`, `rosterReorderTraitDefinitions` (batch), `rosterSeedDefaultTraits` (batch, idempotent)
- No composite indexes are needed. The queries order by one field (`nickname`, `order`).

## 5. i18n keys added

`roster` namespace: `title`, `addPlayer`, `notFound`, `backToRoster`, `filter.*`, `status.*`, `table.*`, `empty.*`, `trait.*`, `traitOption.attachmentStyle.*`, `unit.*`, `kind.*`, `color.*`, `form.*` (including `responsibility.*`), `profile.*`, `tabs.*`, `traitSettings.*`

## 6. Implementation notes (as built)

- **Seeding:** `useTraitDefinitions` seeds once per mount when the realtime list is empty. The trait key is the document id, so a second run (StrictMode, two tabs) rewrites the same 10 documents instead of adding duplicates.
- **Overall:** the weighted average of the active scale traits that have a value and a weight above 0. With nothing rated it shows "–". Crazy eyes has weight 0, so it's shown but never counts.
- **Sorting:**
  - Numeric columns keep empty values last in both directions.
  - Default sort is Overall, descending.
  - Filter "Current roster" hides retired players, and "Everyone" shows them.
- **Trait editing saves right away:**
  - The slider saves on release.
  - Number fields save on blur.
  - Selects save on change.
  - Clearing a scale value removes the key from `traits`.
- **Hidden traits** keep their stored values and come back when shown again. Deleting a custom trait removes only its definition; the player values stay, unseen.
- **Custom trait keys** are `custom_<slug>_<time>`, which avoids clashing with built-in keys or reused labels.
- **Avatar colors** are palette keys (`primary` … `error`), so they follow light and dark mode.
- **Bundle:**
  - app code 176 kB
  - roster 40 kB, loaded on demand
  - React 247 kB, MUI 387 kB, Firebase 544 kB (160 kB gzipped)
  - The warning limit is 600 kB because the Firebase SDK is a single vendor chunk.

## 7. Deviations from plan

- `traitDefinitions` uses `builtIn` + `customLabel` instead of `labelKey | customLabel`. Built-in labels come from `trait.<key>`, so no translation key is stored in the data (D-009).
- `rosterGetPlayer` is realtime, not a one-off fetch. The tab header and trait editors stay live, and the edit form copies the player only when it opens (D-009).
- Added `rosterDeleteTraitDefinition`, for custom traits only. Built-in traits can only be hidden.
- Added vendor chunk groups and the 600 kB warning limit (D-009).

## 8. Verification checklist

- [x] `yarn build`, `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys (`roster` 93).
- [ ] Rules deployed (`firebase deploy --only firestore:rules`). Without them, every save fails with "could not be saved".
- [ ] First visit seeds 10 traits exactly once. Check with a reload and with two tabs: Traits shows 10 rows, not 20.
- [ ] Add a prospect. The one-time notice appears on the first player only. You land on the player page.
- [ ] Rate traits. Overall updates. Crazy eyes doesn't change Overall.
- [ ] Change status to Active from the profile. The League Table updates live.
- [ ] Sort by Hot. Filter by status. Retired players are hidden under "Current roster".
- [ ] Add a custom scale trait with weight 2. It appears as a table column and counts double. Hide it, then delete it.
- [ ] At 375px: cards instead of the table, scrollable tabs, full-screen edit dialog, no horizontal scroll.

## 9. Open issues / follow-ups

- Custom traits can't be renamed yet. Delete and re-add instead.
- `rosterUpdatePlayerTraits` writes the whole `traits` map. Two very fast edits from two tabs could overwrite each other; that's fine for a single user.
