# Stage 7: Chat core

**Status:** ⏸ in review (2026-10-12), branch `stage/07-chat-core`

## 1. Goal

Everything on the Chat tab except AI openers and push:

- the chat state with quick log buttons
- live reminders
- sending through WhatsApp
- a copyable AI brief
- the chat profile
- the quirks log
- Chat settings

## 2. Scope

**In**

- `features/chat`: `ChatTab` (5 sections) and `ChatSettingsPage`.
- Rule logic: `computeReminders` and `isInQuietHours` (windows that cross midnight, in the user's time zone).
- Read-only brief context (nickname, pinned key notes, the latest 10 intel entries).
- A composite index on `chatNotes`.

**Out**

- AI openers, push, devices and the nudges toggle (stage 8).
- The `sendNudges` function (stage 9).

## 3. Files created and changed

| File                                                      | What                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/features/chat/types.ts`                              | Profile options, `ChatProfile`, `ChatNote`, `ChatState` (read: millis), `ChatStateWrite` (write: `Date`s), `ChatSettings` and `DEFAULT_CHAT_SETTINGS`, `withDefaults`, `isInQuietHours`, `computeReminders`, phone validation, `whatsappLink`, `profileCompleteness` |
| `src/features/chat/api.ts`                                | 10 endpoints (section 4)                                                                                                                                                                                                                                             |
| `src/features/chat/brief.ts`                              | `buildBrief`: the brief text, from the `tpl.*` locale template                                                                                                                                                                                                       |
| `src/features/chat/hooks/useChatSettings.ts`, `useNow.ts` | Settings with defaults; a clock that ticks every minute so reminders update by themselves                                                                                                                                                                            |
| `components/ChatTab.tsx`                                  | Two columns on desktop, one below `md`. Left: state, send, brief. Right: profile, quirks.                                                                                                                                                                            |
| `components/ChatStateCard.tsx`                            | "They replied" and "I replied", with an optional time (a later time means yesterday). Reminders as alerts. With no state yet, a checklist of the enabled rules.                                                                                                      |
| `components/SendCard.tsx`                                 | Message field, Copy, and "Open in WhatsApp" (`wa.me`, with or without a phone)                                                                                                                                                                                       |
| `components/AiBriefCard.tsx`                              | "Copy AI brief" (fetches context, builds the text, writes it to the clipboard); per-player `aiNotes`, saved on blur                                                                                                                                                  |
| `components/ChatProfileForm.tsx`                          | 5 option selects, phone (digits only, validated), topic chips, a "N of 7 filled" hint                                                                                                                                                                                |
| `components/QuirksLog.tsx`                                | Add (category + text), list newest first, delete, "Load more"                                                                                                                                                                                                        |
| `components/ChatSettingsPage.tsx`                         | AI base instructions, 6 rule switches, resume-after hours, min reply delay, quiet hours. The time zone is refreshed when it changes.                                                                                                                                 |
| `components/Section.tsx`                                  | A titled card for the tab sections                                                                                                                                                                                                                                   |
| `src/features/chat/locales/*.json`                        | `chat` namespace × 5 languages                                                                                                                                                                                                                                       |
| `src/hoc/Routing.tsx`                                     | Lazy `ChatTab` (`PLAYER_CHAT`) and `ChatSettingsPage` (`CHAT_SETTINGS`)                                                                                                                                                                                              |
| `firestore.indexes.json`                                  | `chatNotes (playerId ↑, createdAt ↓)`                                                                                                                                                                                                                                |

## 4. Data and endpoints touched

- `users/{uid}/chatProfiles/{playerId}`: `platform`, `textingStyle`, `replyTime`, `initiator`, `bestTime` (option keys or `''`), `topicsThatLand[]`, `topicsToAvoid[]`, `phone`, `aiNotes`
- `users/{uid}/chatNotes/{id}`: `playerId`, `category`, `text`
- `users/{uid}/chatStates/{playerId}`:
  - `playerId`, `lastSender`
  - `lastInboundAt`, `lastOutboundAt`, `nextNudgeAt`, `nudgedAt`, `stateUpdatedAt`, all **Firestore Timestamps** (or null)
- `users/{uid}/settings/chat`: `aiInstructions`, `rules{}`, `resumeAfterHours`, `minReplyDelayMin`, `quietHours{start,end}`, `timeZone` (and `nudgesEnabled` in stage 8)
- **Read only:** `players/{playerId}.nickname`; `keyNotes` (`playerId ==`, `pinned == true`, by importance); `intel` (latest 10)
- **Endpoints:**
  - realtime: `chatGetChatProfile`, `chatGetChatNotes`, `chatGetChatState`, `chatGetChatSettings`
  - writes: `chatSetChatProfile` (merge), `chatAddChatNote`, `chatDeleteChatNote`, `chatLogMessage`, `chatSetChatSettings` (merge)
  - on demand: `chatGetBriefContext`

## 5. i18n keys added

`chat`: `tab.*`, `state.*`, `reminders.*`, `pace.*`, `rules.*`, `profile.*`, `option.*`, `quirks.*`, `category.*`, `send.*`, `brief.*`, `tpl.*` (the brief template), `settings.*`

## 6. Implementation notes (as built)

- **Timestamps:** chat state times are written as JavaScript `Date`s, so Firestore stores real Timestamps. That's what the stage 9 function needs for `nextNudgeAt <= now`. The helpers read them back as millis.
- **Quick log:**
  - "I replied" or "They replied" sets `lastSender` and the matching time, and keeps the other time from the previous state.
  - It sets `nextNudgeAt = at + resumeAfterHours`, `nudgedAt = null`, and `stateUpdatedAt = now`.
  - The optional time is today at HH:mm, or yesterday if that time is still ahead.
- **Reminders** (`computeReminders`), only for enabled rules:
  - `noDoubleText` when I wrote last, showing the nudge date.
  - `noInstantReply` until `lastInboundAt + minReplyDelayMin`.
  - `matchLength` always.
  - `matchPace` when the reply time is set.
  - `quietHours` inside the window.
  - `resumeAfter` once `nextNudgeAt` has passed.
  - `useNow` re-renders every minute, so reminders appear and disappear on their own.
- **Quiet hours** use `Intl.DateTimeFormat` with the stored `timeZone`. They handle windows that cross midnight; `start == end` means off.
- **Settings defaults:**
  - A missing `settings/chat` doc means defaults (72 h, 20 min, 22:00–09:00, all rules on). `withDefaults` also fills in missing nested fields.
  - The doc is written on the first save only.
  - Chat settings refreshes `timeZone` whenever the device zone differs from the stored one.
- **AI brief:**
  - Built on click and never stored.
  - Sections: role, enabled rules, profile, pinned key notes, the latest 10 intel entries, chat state with relative time, then "My style" (base instructions or the translated default, plus per-player `aiNotes`), then a paste slot.
  - Everything comes from the `tpl.*` keys, so the brief follows the UI language.
- **Profile form:** remounts when the stored profile fields change, but not when `aiNotes` changes, so typing in the brief notes never resets it. It never writes `aiNotes`.
- **Phone:** non-digits are stripped while typing. It must match `^[1-9]\d{6,14}$`.
- **Checked:** a scratch script against `types.ts` (14 cases) covers quiet hours (23:30 and 08:00 inside 22:00–09:00 in Europe/Bucharest; 09:00 and 15:00 outside; a same-day window; start == end), defaults merging, the three main reminder situations, phone validation, the `wa.me` link without a phone, and completeness. All pass.

## 7. Deviations from plan

- **One `chatLogMessage({ sender })` endpoint** instead of `logInbound` and `logOutbound`. Same writes, one code path (D-012).
- **`chatGetChatProfile` is realtime.** The form copies the profile when it mounts and remounts when the stored fields change (D-012).
- **Chat state times are Firestore Timestamps** (written as `Date`s), not numbers, for the server-side nudge query (D-012).
- **The nudges switch isn't in Chat settings yet.** It comes with push in stage 8, together with the notification permission.

## 8. Verification checklist

- [x] `yarn build`, `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys.
- [x] Logic checks: 14/14 pass.
- [ ] Deploy the index: `firebase deploy --only firestore`. Until it's built, the quirks log shows "could not be loaded".
- [ ] No state yet: the reminders area lists the enabled rules and asks you to log the state.
- [ ] Tap "I replied". The no-double-text reminder appears with the resume date (now + 72 h).
- [ ] Tap "They replied". "Reply after HH:mm" (now + 20 min) shows, then disappears by itself after 20 minutes.
- [ ] Set quiet hours around the current time. The quiet-hours reminder appears.
- [ ] Copy the AI brief and paste it into a text editor. It has the rules, profile, pinned notes, intel, chat state, style and the paste slot, in the UI language.
- [ ] The WhatsApp button opens `wa.me/<phone>?text=…` with a phone, and `wa.me/?text=…` without one.
- [ ] Fill the profile and save: the hint shows "7 of 7 filled". An invalid phone (`+40…`, `07…`) is rejected.
- [ ] At 375px: one column, the quick-log buttons stack, no horizontal scroll.

## 9. Open issues / follow-ups

- Copying the brief waits for a network fetch first. Safari may refuse clipboard writes that happen after an `await`, outside the user's click. If that shows up, prefetch the context when the tab opens.
- The quirks log deletes without asking for confirmation (short notes). Add a confirmation if it ever bites.
