# Stage 4: Dates and Timeline

**Status:** ⏸ in review (2026-10-12), branch `stage/04-dates-timeline`

## 1. Goal

Log dates for each player. See at a glance how long it has been since the last date with everyone.

## 2. Scope

**In**

- `features/dates`:
  - the Dates tab on the player page (log, add, edit, delete, "Load more")
  - the Timeline page
  - per-player date summaries
  - its own read-only `PlayerRef` view of `players`
- A composite index on `dates (playerId ↑, date ↓)`.

**Out**

- Linking a date to an agenda plan. That's for later, if ever.

## 3. Files created and changed

| File                                              | What                                                                                                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/dates/types.ts`                     | `DateRecord`, `DateSummary`, `PlayerRef`, `OUTCOMES`, thresholds (7 / 21 days, 90-day window), `todayIso`, `daysSince`, `freshnessOf`, `summarize`, `initialsOf` |
| `src/features/dates/api.ts`                       | 6 endpoints, plus `refreshSummary` (section 6)                                                                                                                   |
| `components/DatesTab.tsx`                         | Newest first, "Load more" in pages of 20, delete confirmation                                                                                                    |
| `components/DateFormDialog.tsx`                   | Day, outcome, activity, place, optional 1–10 rating, highlights, next step. Full-screen below `sm`.                                                              |
| `components/DateCard.tsx`                         | Localized day, title, outcome and rating chips, highlights, next step                                                                                            |
| `components/TimelinePage.tsx`                     | Legend, rows sorted stalest first, a dot strip for the last 90 days, a relative-time chip                                                                        |
| `components/ConfirmDialog.tsx`                    | A copy of roster's confirm dialog (features don't share code)                                                                                                    |
| `src/features/dates/locales/*.json`               | `dates` namespace, 37 keys × 5 languages                                                                                                                         |
| `src/features/roster/components/PlayerLayout.tsx` | `<Suspense>` around the tab `Outlet`, so the header stays while a lazy tab loads                                                                                 |
| `src/hoc/Routing.tsx`                             | Lazy `DatesTab` (`PLAYER_DATES`) and `TimelinePage` (`TIMELINE`)                                                                                                 |
| `firestore.indexes.json`                          | `dates`: `playerId ASC`, `date DESC`                                                                                                                             |

## 4. Data and endpoints touched

- `users/{uid}/dates/{id}`:
  - `playerId`, `date` (yyyy-mm-dd, local day)
  - `activity`, `venue`
  - `rating` (1–10 or null)
  - `outcome` (great | good | meh | bad)
  - `highlights`, `nextStep`
- `users/{uid}/dateSummaries/{playerId}`: `playerId`, `lastDateAt` (yyyy-mm-dd or null), `count`, `recentDates[]` (last 90 days, newest first)
- `users/{uid}/players`: read only, through `datesGetPlayerRefs` (nickname, status, avatarColor)
- **Endpoints:**
  - realtime: `datesGetDates({ playerId, limit })`, `datesGetDateSummaries`, `datesGetPlayerRefs`
  - writes: `datesCreateDate`, `datesUpdateDate`, `datesDeleteDate`. Each one refreshes that player's summary.

## 5. i18n keys added

`dates` namespace: `tab.*`, `form.*`, `outcome.*`, `card.*`, `delete.*`, `timeline.*` (including `legend.*`)

## 6. Implementation notes (as built)

- **Days, not timestamps:**
  - `date` is the local calendar day as `yyyy-mm-dd`. It sorts as a string and has no time-zone drift.
  - `daysSince` counts calendar days through UTC midnights, so daylight-saving changes don't shift the count.
- **Summaries:**
  - After every create, update or delete, `refreshSummary` re-reads all of that player's dates (`where playerId ==`, a single-field query) and overwrites `dateSummaries/{playerId}`.
  - The Timeline reads only summaries, plus the player refs.
- **The Timeline:**
  - Shows `active` and `bench` players.
  - Order: never dated first, then the most days since the last date.
  - The chip uses `Intl.RelativeTimeFormat` ("today", "yesterday", "12 days ago", localized), so no plural keys are needed.
  - Chip colors: success under 7 days, warning 7–20, error 21+.
  - Dots: one per date in the last 90 days, today on the right, with a tooltip showing the day. Ages are re-checked at render, so a stale summary never draws dots outside the window.
- **Dates tab:**
  - A realtime list (`playerId ==`, `date desc`, `limit`). "Load more" raises `limit` by 20.
  - The rating is optional (a switch). The default outcome is "good" and the default day is today.
- **No plural keys:** counts show as "Dates: N". Romanian, for example, needs three plural forms, and a label avoids them.
- **Checked:** a scratch script against `types.ts` (9 cases) covers same day, 7 days, across a daylight-saving change, across a year, the 7/21 thresholds, summary last date and count, the 90-day window, an empty summary and the `todayIso` format. All pass.

## 7. Deviations from plan

- **Summary refresh (D-010):** plain re-query + overwrite, not `runTransactionFn`. Firestore web transactions can only read documents, not run queries, so a transaction can't hold a player's date list. The re-query is idempotent and converges on the current dates. `runTransactionFn` stays in `firestore.ts` for later document-level read-modify-writes.
- **`datesGetDates` is realtime** (the plan didn't mark it). That follows the design rule that player-tab lists are realtime with "Load more" (D-010).

## 8. Verification checklist

- [x] `yarn build`, `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys (`dates` 37).
- [x] Helper checks: 9/9 pass.
- [ ] Deploy rules and the new index: `firebase deploy --only firestore`. Until the index is built, the Dates tab shows "could not be loaded". It takes about 1–5 minutes after deploy.
- [ ] Log a date today on an active player. The Timeline shows "today" in green with a dot at the right edge.
- [ ] Log one 10 days ago on another player: warning color, "10 days ago". A third with no dates sits at the top as "Never dated".
- [ ] Edit a date's day. The Timeline updates. Delete the only date of a player: back to "Never dated".
- [ ] Prospect and retired players don't appear on the Timeline. Changing a player to Active makes them appear.
- [ ] Add 21+ dates to one player: "Load more" appears and shows the rest.
- [ ] At 375px: the Timeline rows stack (name and chip, then the dots), the date dialog is full-screen, no horizontal scroll.

## 9. Open issues / follow-ups

- Summaries are refreshed by the client. If the app closes between the date write and the summary write, the summary is stale until the next date write for that player. A Cloud Function trigger could take this over in stage 9 if it ever matters.
- `recentDates` ages out without a write. The Timeline filters by age at render, so the display is right; the stored array is just longer than needed.
