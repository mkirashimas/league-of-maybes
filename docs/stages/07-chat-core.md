# Stage 7: Chat core

**Status:** ⬜ planned

## 1. Goal

Everything on the Chat tab except AI and push:

- profile and quirks log
- chat state with quick log buttons
- rule reminders
- a copyable AI brief
- WhatsApp links
- Chat settings

## 2. Scope

**In**

- `features/chat`:
  - Sections: `ChatTab`, `ChatStateCard`, `Reminders`, `ChatProfileForm` with a completeness hint, `QuirksLog`, `AiBriefCard`
  - `ChatSettingsPage`
- Rule catalog: `noDoubleText`, `noInstantReply`, `matchLength`, `matchPace`, `quietHours`, `resumeAfter`
- `isInQuietHours` handles windows that cross midnight (R12).
- `DEFAULT_CHAT_SETTINGS` is merged over the stored doc (R4). `timeZone` is refreshed whenever the browser zone changes (R13).
- `getBriefContext`: read-only on `keyNotes` (pinned) and `intel` (latest 10)
- Phone validation: `^[1-9]\d{6,14}$`. WhatsApp links work with and without a phone.

**Out**

- AI openers, push and devices (stage 8)
- The `sendNudges` function (stage 9)

## 3. Files created and changed

`src/features/chat/**`, `src/hoc/Routing.tsx`, `src/hoc/Layout.tsx` (sidebar item), `firestore.indexes.json`

## 4. Data and endpoints touched

- `chatProfiles`, `chatNotes`, `chatStates`, `settings/chat`
- `getChatProfile`, `setChatProfile`, `getChatNotes`, `addChatNote`, `deleteChatNote`, `getChatState*`, `logInbound`, `logOutbound`, `getChatSettings`, `setChatSettings`, `getBriefContext`

## 5. i18n keys added

`chat` namespace: `profile.*`, `state.*`, `rules.*`, `reminders.*`, `brief.*`, `send.*`, `settings.*`, `category.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] "I replied" shows the no-double-text reminder with the resume date.
- [ ] "They replied" shows "Reply after {time}" until `minReplyDelayMin` has passed.
- [ ] Quiet hours of 22:00–09:00 are detected at 23:30 and at 08:00.
- [ ] Copy AI brief puts the profile, pinned notes, intel, rules, state and style on the clipboard.
- [ ] The WhatsApp link opens with the text prefilled, with and without a phone.

## 9. Open issues / follow-ups

_None yet._
