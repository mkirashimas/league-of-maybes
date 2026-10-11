# Stage 8: AI and push

**Status:** ⬜ planned. Needs prerequisites 4–7.

## 1. Goal

- Suggest 2–3 openers with Gemini.
- The app can be installed and can receive push notifications for nudges.

## 2. Scope

**In**

- `firebase/config.ts`: App Check with reCAPTCHA Enterprise. The debug token is set only when `import.meta.env.DEV` (R16).
- `firebase/ai.ts`: `generateJson<T>(prompt, schema)`, with the model name in one constant
- `firebase/messaging.ts`: `requestPushToken()`, `onForegroundMessage()`
- `public/firebase-messaging-sw.js`: compat CDN at the same SDK version (R10); a notification click opens `PLAYER_CHAT?nudge=1`
- `public/manifest.webmanifest` and icons
- `chat`:
  - `generateOpeners`, which runs automatically on `?nudge=1` after the user confirms the state
  - `registerDevice` and `removeDevice` (device id = SHA-256 of the token, R11)
  - Nudge toggle in settings; notification permission is asked only from that click

## 3. Files created and changed

`src/firebase/{config,ai,messaging}.ts`, `public/*`, `index.html` (manifest link), `src/features/chat/**`

## 4. Data and endpoints touched

- `devices`
- `generateOpeners`, `registerDevice`, `removeDevice`

## 5. i18n keys added

`chat` namespace: `openers.*`, `nudges.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] Openers come back as 2–3 items in the UI language.
- [ ] Turning nudges on asks for permission and saves exactly one device doc per browser.
- [ ] A test push from the console arrives, and clicking it opens the chat tab with `?nudge=1`.
- [ ] The app installs as a PWA, and its name shows as "Maybes".

## 9. Open issues / follow-ups

_None yet._
