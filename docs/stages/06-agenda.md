# Stage 6: Agenda

**Status:** ✅ done (2026-10-12), PR #7, tag `stage-06`

## 1. Goal

Track what is happening now with each player and what is planned. See everything coming up in one place.

## 2. Scope

**In**

- `features/agenda`:
  - the Now & Next tab on the player page
  - the Upcoming page (sidebar)
  - its own read-only `PlayerRef` view of `players`
- Two composite indexes.

**Out**

- Reminders and notifications for events. Push is for chat nudges only (stages 8 and 9).

## 3. Files created and changed

| File                                 | What                                                                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/agenda/types.ts`       | `AgendaItem`, `AgendaKind` (now, event, plan), `PlayerRef`, helpers `todayIso`, `dayOf`, `timeOf`, `toWhen`, `isPast`, `formatWhen`, `initialsOf` |
| `src/features/agenda/api.ts`         | 7 endpoints (section 4)                                                                                                                           |
| `components/AgendaTab.tsx`           | Sections: Right now, Coming up, Someday, and Past and done (hidden behind a toggle). Add, edit, delete, done checkbox, "Load more".               |
| `components/AgendaItemDialog.tsx`    | Kind (with help text), title, day and optional time (hidden for "now"), notes. Full-screen below `sm`.                                            |
| `components/AgendaItemRow.tsx`       | Shared row: done checkbox, title (struck through when done), kind chip, when, notes. On Upcoming it also shows the player link.                   |
| `components/UpcomingPage.tsx`        | "Right now" group, then one group per day: "today", "tomorrow", then weekday and date. Done checkbox on each item.                                |
| `components/ConfirmDialog.tsx`       | A copy, as in the other features                                                                                                                  |
| `src/features/agenda/locales/*.json` | `agenda` namespace, 37 keys × 5 languages                                                                                                         |
| `src/hoc/Routing.tsx`                | Lazy `AgendaTab` (`PLAYER_AGENDA`) and `UpcomingPage` (`AGENDA`)                                                                                  |
| `firestore.indexes.json`             | `agendaItems (playerId ↑, createdAt ↓)` and `agendaItems (done ↑, when ↑)`                                                                        |

## 4. Data and endpoints touched

- `users/{uid}/agendaItems/{id}`:
  - `playerId`, `kind`, `title`, `notes`, `done`
  - `when`: `yyyy-mm-dd`, `yyyy-mm-ddTHH:mm`, or `null`. Always written.
- `users/{uid}/players`: read only, through `agendaGetPlayerRefs`
- **Endpoints:**
  - realtime: `agendaGetAgendaItems({ playerId, limit })`, `agendaGetUpcomingItems(today)` (two listeners, one cache entry), `agendaGetPlayerRefs`
  - writes: `agendaCreateAgendaItem`, `agendaUpdateAgendaItem`, `agendaToggleAgendaItemDone`, `agendaDeleteAgendaItem`

## 5. i18n keys added

`agenda`: `tab.*`, `section.*`, `kind.*`, `kindHelp.*`, `form.*`, `row.*`, `delete.*`, `upcoming.*`

## 6. Implementation notes (as built)

- **`when` is always written** (`null` when undated). Firestore leaves out documents that are missing a field used in a range or `orderBy`.
  - `yyyy-mm-dd` and `yyyy-mm-ddTHH:mm` sort correctly as strings, so `when >= today` catches all of today, timed or not.
  - "now" items are never dated: the form hides the day and time for them.
- **Upcoming runs two realtime listeners, merged into one cache entry:**
  - `done == false, kind == 'now'`: equality only, served by Firestore's automatic single-field indexes.
  - `done == false, when >= today, orderBy when`: uses the `(done, when)` composite index.
  - Items of retired or deleted players are left out.
- **Grouping on the tab:**
  - Open "now" items go to Right now.
  - Open dated items from today on go to Coming up, soonest first.
  - Open undated events and plans go to Someday.
  - Done or dated before today go to Past and done, newest first.
- **The tab query** is `playerId ==` with `createdAt desc` and a `limit`. Sorting into sections happens on the client.
- **Day headers** use `Intl.RelativeTimeFormat` for today and tomorrow, and `Intl.DateTimeFormat` after that, so they're localized without extra keys.
- **Checked:** a scratch script against `types.ts` (8 cases) covers `toWhen`, the day and time split, `isPast` (undated, earlier today, yesterday) and the string-order assumption behind the range query. All pass.

## 7. Deviations from plan

- **No `(done, kind)` index.** That query is equality-only. Firestore serves it from single-field indexes and rejects a composite index for it as unnecessary on deploy (D-011).
- **Tab index is `(playerId, createdAt desc)`, not `(playerId, when asc)`.** Ordering by `when` would put undated items first and cut off later events at the page limit. Newest-created first keeps the recent and upcoming items in the first page (D-011).

## 8. Verification checklist

- [x] `yarn build`, `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys (`agenda` 37).
- [x] Helper checks: 8/8 pass.
- [ ] Deploy the indexes: `firebase deploy --only firestore`. Until they're built, the tab and Upcoming show "could not be loaded". It takes about 1–5 minutes.
- [ ] Add a "now" item with no day. It shows on the tab under Right now, and on Upcoming with the nickname.
- [ ] Add an event for next week at 19:30. It shows under its day on Upcoming. Tick it done and it disappears from Upcoming but stays on the tab under Past and done.
- [ ] Add an event for yesterday. It's not on Upcoming. On the tab it's under Past and done.
- [ ] Add a plan with no day: it's under Someday.
- [ ] Retire the player. Their items leave Upcoming.
- [ ] At 375px: the dialog is full-screen and the rows wrap, no horizontal scroll.

## 9. Open issues / follow-ups

- Overdue open events (dated in the past and not done) only show on the player tab. A "Missed" group on Upcoming could come later.
