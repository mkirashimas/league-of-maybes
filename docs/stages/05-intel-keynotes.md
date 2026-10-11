# Stage 5: Intel and Key Notes

**Status:** ⬜ planned

## 1. Goal

Scout a player before dating, and pin the facts worth remembering.

## 2. Scope

**In**

- `features/intel`: `IntelTab`, entries grouped by category, add, edit and delete, "Load more" (R8)
- `features/keyNotes`: `KeyNotesTab`, pinned first, then by importance; pin toggle; "Load more"

## 3. Files created and changed

`src/features/intel/**`, `src/features/keyNotes/**`, `src/hoc/Routing.tsx`, `firestore.indexes.json`

## 4. Data and endpoints touched

- `intel`: `getIntel*`, `addIntel`, `updateIntel`, `deleteIntel`
- `keyNotes`: `getKeyNotes*`, `createKeyNote`, `updateKeyNote`, `toggleKeyNotePin`, `deleteKeyNote`

## 5. i18n keys added

- `intel` namespace: `category.*`, `form.*`
- `keyNotes` namespace: `category.*`, `form.*`, `importance.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] Add intel in each category, then edit and delete an entry.
- [ ] With more than 20 entries, "Load more" shows the rest.
- [ ] Pinning a key note moves it to the top. Unpinning moves it back.

## 9. Open issues / follow-ups

_None yet._
