# Stage 10: Hardening and launch

**Status:** ⬜ planned

## 1. Goal

Final security rules, indexes and tests. Polish for mobile and accessibility, then deploy.

## 2. Scope

**In**

- Final `firestore.rules` and `firestore.indexes.json`, including the collection-group override on `chatStates.nextNudgeAt` (R17, already shipped in stage 9)
- Emulator rule tests with `@firebase/rules-unit-testing` in `tests/rules/`:
  - The owner can read and write.
  - Another user and anonymous users are denied.
- Mobile pass at 375px on every page. Accessibility pass on labels, focus, contrast in both themes, and tap target size.
- `firebase deploy` (hosting, firestore, functions)

## 3. Files created and changed

`firestore.rules`, `firestore.indexes.json`, `tests/rules/**`, `package.json` (test script)

## 4. Data and endpoints touched

None new.

## 5. i18n keys added

Only fixes for missing keys.

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] Rule tests pass in the emulator.
- [ ] Every item in the full manual pass from the plan's verification section passes.
- [ ] The deployed site loads, sign-in works, and the indexes report as built.

## 9. Open issues / follow-ups

_None yet._
