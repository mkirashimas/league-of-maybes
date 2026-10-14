# Stage 11: Cycle tracking

**Status:** ✅ done (2026-10-14), PR #19, released in PR #21, tag `stage-11`

## 1. Goal

Track the hormonal cycle of women players, and of the user, so each player's current phase is visible at a glance. Log how a player tends to be in each phase.

## 2. Scope

**In**

- `features/cycle` (new):
  - **`PhaseBadge`:** today's phase as an icon on the avatar. The tooltip shows the phase, the cycle day, the next period, a description and that phase's note summary.
  - **Cycle tab** (`PLAYER_CYCLE`, women only):
    - the current phase with a day strip
    - cycle data: period starts, cycle length and period length
    - phase notes: dated text with optional 1–5 ratings for mood, energy, libido and sociability, grouped by phase with averages
  - **Personal details page** (`PERSONAL_DETAILS`, sidebar): gender and health notes. Choosing Woman also shows the same cycle panel for the user (`subjectId = 'self'`).
- **Roster:**
  - `gender` and `healthNotes` on players: set in the form, shown on the profile
  - the badge on the avatars in the League Table (desktop and mobile) and in the player header
  - choice traits can be League Table columns (label shown, sorted by option score)
- **Legal:** Terms and Privacy allow optional health data. `TERMS_VERSION` is `2026-10-14`, so users consent again.
- **Functions:** the player delete cascade covers `cycleNotes` (by `playerId`) and `cycleProfiles` (by document id).

**Out**

- Using cycle data in the AI brief or openers.
- Cycle notifications.

## 3. Files created and changed

| File                                                                 | What                                                                                                                                                                                |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/cycle/types.ts`, `phase.ts`, `api.ts`, `phaseIcons.ts` | Types and limits; phase engine (pure); endpoints in section 4; icon and palette colour per phase                                                                                    |
| `src/features/cycle/icons/*.svg`                                     | The 5 phase icons (multi-colour artwork, not recoloured)                                                                                                                            |
| `src/features/cycle/components/*`                                    | `PhaseBadge`, `PhaseIcon`, `CyclePanel`, `CurrentPhaseCard`, `CycleStrip`, `CycleSetupCard`, `PhaseNotesLog`, `CycleNoteDialog`, `CycleTab`, `PersonalDetailsPage`, `ConfirmDialog` |
| `src/features/cycle/locales/*.json`                                  | `cycle` namespace × 5 languages                                                                                                                                                     |
| `src/features/roster/*`                                              | `gender`/`healthNotes`, `PlayerAvatar` `badge` prop, Cycle tab, choice columns, trait settings checkbox                                                                             |
| `src/types/paths.ts`, `src/hoc/Routing.tsx`, `src/hoc/Layout.tsx`    | `PLAYER_CYCLE`, `PERSONAL_DETAILS`, lazy `cycle` chunk, sidebar entry                                                                                                               |
| `firestore.indexes.json`, `firestore.rules` (comment), rule tests    | `cycleNotes (playerId ↑, date ↓)`; another user can't read cycle data                                                                                                               |
| `functions/src/players/onPlayerDeleted.ts`                           | Cascade covers the cycle collections                                                                                                                                                |
| `src/features/legal/*`                                               | Terms, Privacy ("Health data" section), `TERMS_VERSION`                                                                                                                             |

## 4. Data and endpoints

- `cycleProfiles/{subjectId}`, `cycleNotes/{id}`, `settings/personal` (see [architecture.md](../architecture.md) §4).
- **Endpoints:**
  - `cycleGetProfiles`: all profiles, realtime; one listener for every badge
  - `cycleGetProfile`
  - `cycleSaveProfile`: re-tags the notes and rewrites `phaseSummaries`
  - `cycleGetNotes`
  - `cycleCreateNote`, `cycleUpdateNote`, `cycleDeleteNote`: each write refreshes `phaseSummaries`
  - `cycleGetPersonalSettings`, `cycleSavePersonalSettings`

## 5. Checklist

The unticked items are manual UI checks still to verify in production.

- [x] `yarn lint`, `yarn build` and `yarn test:rules` pass
- [ ] A woman player with 3 logged periods uses the averaged length and shows the badge in the table (desktop and phone) and in the header
- [ ] The tooltip works on hover, keyboard focus and tap, and tapping it doesn't open the player
- [ ] Notes are tagged by date. Groups, averages and the tooltip summary update.
- [ ] Switching the player to Man hides the badge and the tab
- [ ] Personal details: gender, health notes and own cycle
- [ ] Attachment style as a League Table column shows labels and sorts by score
- [ ] Every theme and all 5 languages checked
- [ ] Deleting a player removes their cycle data (emulator)
