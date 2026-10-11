# Stage 3: Roster

**Status:** ⬜ planned

## 1. Goal

Manage players and their trait ratings. See everyone in a sortable League Table. Open a player page with tabs.

## 2. Scope

**In**

- `features/roster`:
  - `LeagueTablePage`: sortable `Table` with a status filter, and a card list below `md`
  - `PlayerFormPage`: create and edit. Nickname helper text says no real names. One-time responsibility notice.
  - `PlayerProfilePage`: profile, status, trait editors (slider for `scale`, number field for `number`, select for `enum`)
  - `PlayerLayout`: header with initials avatar, nickname and status chip; scrollable `Tabs`; `<Outlet/>`
  - `TraitSettingsPage`: add, hide, reorder, re-weight
  - Default traits, seeded idempotently with doc id = key (R3) by `useTraitDefinitionsBootstrap`
  - `overall` = weighted average of the scale traits
- Tab routes for the later features render a placeholder until their stage lands.

**Out**

- Hard delete. Players are retired instead.

## 3. Files created and changed

`src/features/roster/**`, `src/hoc/Routing.tsx`

## 4. Data and endpoints touched

- `players`, `traitDefinitions`
- `getPlayers*`, `getPlayer`, `createPlayer`, `updatePlayer`, `setPlayerStatus`, `updatePlayerTraits`, `getTraitDefinitions*`, `upsertTraitDefinition`, `reorderTraitDefinitions`, `seedDefaultTraits`

## 5. i18n keys added

`roster` namespace: `status.*`, `trait.*`, `attachment.*`, `table.*`, `form.*`, `tabs.*`, `traitSettings.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] First login seeds 11 traits exactly once, even with two tabs open or after a StrictMode double run.
- [ ] Create a prospect, edit traits, change status to active. The League Table updates live.
- [ ] Sorting by "hot" works. A weight-0 trait doesn't change `overall`.
- [ ] Below `md` the table becomes cards. The tabs scroll at 375px.

## 9. Open issues / follow-ups

_None yet._
