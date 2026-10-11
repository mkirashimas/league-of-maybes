# Stage 4: Dates and Timeline

**Status:** ⬜ planned

## 1. Goal

Log dates for each player. See at a glance how long it has been since the last date with everyone.

## 2. Scope

**In**

- `features/dates`:
  - `DatesTab`: list plus a form dialog
  - `TimelinePage`
  - its own `PlayerRef` type and `getPlayerRefs*` endpoint
  - `dateSummaries/{playerId}` recomputed in a transaction after each create, update or delete (R7)
- Timeline:
  - Shows active and bench players: days since the last date, or "Never dated".
  - Colors come from `success`, `warning` and `error`, with thresholds of 7 and 21 days.
  - A row of dots for the last 90 days. Sorted stalest first.

## 3. Files created and changed

`src/features/dates/**`, `src/hoc/Routing.tsx`, `firestore.indexes.json`

## 4. Data and endpoints touched

- `dates`, `dateSummaries`; reads `players` (read-only)
- `getDates`, `getDateSummaries*`, `getPlayerRefs*`, `createDate`, `updateDate`, `deleteDate`

## 5. i18n keys added

`dates` namespace: `outcome.*`, `form.*`, `timeline.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] Logging a date today makes the Timeline show 0 days for that player.
- [ ] Deleting the only date brings back "Never dated".
- [ ] The dots match the dates from the last 90 days.
- [ ] Retired and prospect players don't appear on the Timeline.

## 9. Open issues / follow-ups

_None yet._
