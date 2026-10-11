# Stage 6: Agenda

**Status:** ⬜ planned

## 1. Goal

Track what is happening now with each player and what is planned. See everything coming up in one place.

## 2. Scope

**In**

- `features/agenda`:
  - `AgendaTab` (Now & Next)
  - `UpcomingPage`
  - its own `PlayerRef` and `getPlayerRefs*` (R1)
- `when` is always written, as `null` when there's no date (R2).
- Upcoming runs two queries: open "now" items, then future items grouped by day.

## 3. Files created and changed

`src/features/agenda/**`, `src/hoc/Routing.tsx`, `firestore.indexes.json`

## 4. Data and endpoints touched

- `agendaItems`; reads `players` (read-only)
- `getAgendaItems`, `getUpcomingItems`, `getPlayerRefs*`, `createAgendaItem`, `updateAgendaItem`, `toggleAgendaItemDone`, `deleteAgendaItem`

## 5. i18n keys added

`agenda` namespace: `kind.*`, `form.*`, `upcoming.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] A "now" item without a date shows on Upcoming with the player's nickname.
- [ ] A plan for next week shows under its day. Marking it done removes it.
- [ ] Past undone events don't show on Upcoming. They still appear on the player tab.

## 9. Open issues / follow-ups

_None yet._
