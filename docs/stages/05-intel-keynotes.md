# Stage 5: Intel and Key Notes

**Status:** ⏸ in review (2026-10-12), branch `stage/05-intel-keynotes`

## 1. Goal

Scout a player before dating, and pin the facts worth remembering.

## 2. Scope

**In**

- `features/intel`: the Intel tab
  - Add form: category and note. The placeholder changes with the category.
  - Entries grouped by category in a fixed order.
  - Inline edit, delete with confirmation, "Load more".
- `features/keyNotes`: the Key Notes tab
  - Add form: category, importance, note, pin.
  - Pinned notes first, then by importance.
  - Pin toggle on each note. Inline edit, delete with confirmation, "Load more".
- Two composite indexes.

**Out**

- Reading intel or key notes from the chat brief. That's stage 7 (`chat`, read-only).

## 3. Files created and changed

| File                                                                                       | What                                                                                                            |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `src/features/intel/types.ts`, `api.ts`                                                    | `IntelEntry`, `INTEL_CATEGORIES` (7), page size 20. Endpoints in section 4.                                     |
| `src/features/intel/components/IntelTab.tsx`, `IntelForm.tsx`, `ConfirmDialog.tsx`         | Tab, shared add/edit form, confirm dialog. Red flags are shown in error color and green flags in success color. |
| `src/features/intel/locales/*.json`                                                        | `intel` namespace, 23 keys × 5 languages                                                                        |
| `src/features/keyNotes/types.ts`, `api.ts`                                                 | `KeyNote`, `KEY_NOTE_CATEGORIES` (8), `IMPORTANCE_LEVELS` (3 high, 2 medium, 1 low)                             |
| `src/features/keyNotes/components/KeyNotesTab.tsx`, `KeyNoteForm.tsx`, `ConfirmDialog.tsx` | Tab, shared add/edit form, confirm dialog. Pinned notes get a primary-colored border.                           |
| `src/features/keyNotes/locales/*.json`                                                     | `keyNotes` namespace, 32 keys × 5 languages                                                                     |
| `src/hoc/Routing.tsx`                                                                      | Lazy `IntelTab` (`PLAYER_INTEL`) and `KeyNotesTab` (`PLAYER_KEY_NOTES`)                                         |
| `firestore.indexes.json`                                                                   | `intel (playerId ↑, createdAt ↓)` and `keyNotes (playerId ↑, pinned ↓, importance ↓)`                           |

## 4. Data and endpoints touched

- `users/{uid}/intel/{id}`: `playerId`, `category`, `text` (up to 1000 characters)
- `users/{uid}/keyNotes/{id}`: `playerId`, `category`, `text` (up to 500 characters), `pinned`, `importance` (1–3)
- **intel endpoints:** `intelGetIntel({ playerId, limit })` (realtime), `intelAddIntel`, `intelUpdateIntel`, `intelDeleteIntel`
- **keyNotes endpoints:** `keyNotesGetKeyNotes({ playerId, limit })` (realtime), `keyNotesCreateKeyNote`, `keyNotesUpdateKeyNote`, `keyNotesToggleKeyNotePin`, `keyNotesDeleteKeyNote`

## 5. i18n keys added

- `intel`: `tab.*`, `form.*`, `category.*`, `placeholder.*`, `delete.*`
- `keyNotes`: `tab.*`, `form.*`, `category.*`, `placeholder.*`, `importance.*`, `card.*`, `delete.*`

## 6. Implementation notes (as built)

- **Pagination:**
  - Both lists are realtime queries with `limit`. "Load more" appears when the list fills the limit, and adds 20.
  - Intel loads newest first, then groups what's loaded by category. Older entries in a category show up after "Load more".
- **Editing** happens inline: the row turns into the same form as the add form, with a cancel button. The add form clears itself after a successful save.
- **Importance is a number (1–3)** so it sorts in Firestore. Labels come from `importance.high|medium|low`.
- **Pinning** is a one-field update (`keyNotesToggleKeyNotePin`). The realtime query then puts the note in its new place.
- **No shared code:** each feature has its own `ConfirmDialog`. Features never import each other, per the workspace rules.

## 7. Deviations from plan

None.

## 8. Verification checklist

- [x] `yarn build`, `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys (`intel` 23, `keyNotes` 32).
- [ ] Deploy the new indexes: `firebase deploy --only firestore`. Until they're built, both tabs show "could not be loaded". It takes about 1–5 minutes.
- [ ] Intel: add a note in each category, and see them grouped in order. Edit one and change its category; it moves group. Delete one.
- [ ] Intel: with more than 20 entries, "Load more" shows the rest.
- [ ] Key Notes: add notes of each importance. Pinning one moves it to the top with a highlighted border. Unpinning moves it back by importance.
- [ ] At 375px: the add forms stack vertically, no horizontal scroll.

## 9. Open issues / follow-ups

- Intel can't be filtered by category yet. Groups only show what's loaded. Fine at personal scale.
