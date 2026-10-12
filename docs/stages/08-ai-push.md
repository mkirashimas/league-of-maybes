# Stage 8: AI and push

**Status:** ✅ done (2026-10-12), PR #9, tag `stage-08`

## 1. Goal

- Suggest 2–3 openers with Gemini.
- The app can be installed and can receive push notifications for nudges.

## 2. Scope

**In**

- **App Check:** reCAPTCHA Enterprise, which Google now calls "Fraud Defense". A debug token in dev.
- **`firebase/ai.ts`:** `generateJson` with structured output, model `gemini-3.8-flash`.
- **`firebase/messaging.ts`:** support check, token request (only from a click), token delete, foreground listener.
- **`public/firebase-messaging-sw.js`:** compat SDK 12.19.0 from the CDN.
- **PWA:** `manifest.webmanifest`, icons, Apple touch icon, theme color.
- **chat:**
  - "Suggest openers" in the Send card
  - the `?nudge=1` banner, which runs openers after the user confirms
  - the nudges switch in Chat settings, with device registration
  - a snackbar for foreground nudges

**Out**

- Sending nudges (the `sendNudges` function, stage 9).
- Enforcing App Check (after this stage is tested; see section 9).

## 3. Files created and changed

| File                                                                                                           | What                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/firebase/config.ts`                                                                                       | `initializeAppCheck` with `ReCaptchaEnterpriseProvider(site key)` and auto-refresh. `FIREBASE_APPCHECK_DEBUG_TOKEN = true` only when `import.meta.env.DEV`. `firebaseConfig` is exported. |
| `src/firebase/ai.ts`                                                                                           | `GEMINI_MODEL = 'gemini-3.8-flash'`, `generateJson<T>(prompt, schema)`. Re-exports `Schema`.                                                                                              |
| `src/firebase/messaging.ts`                                                                                    | `getPushSupport`, `requestPushToken` (permission, then service worker, then `getToken` with the VAPID key), `deletePushToken`, `onForegroundMessage`                                      |
| `public/firebase-messaging-sw.js`                                                                              | Compat SDK 12.19.0 and `firebase.messaging()`. Background notifications and clicks are handled by the SDK through `fcmOptions.link`.                                                      |
| `public/manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | "League of Maybes", short name "Maybes", standalone, slate theme. Icons rendered by a script: a white "M" on `#2f3a44`.                                                                   |
| `index.html`                                                                                                   | Manifest, Apple touch icon, `theme-color`, `apple-mobile-web-app-title`                                                                                                                   |
| `src/features/chat/types.ts`                                                                                   | `Device`, `DEVICE_ID_STORAGE_KEY`, `Opener`, `OPENER_TONES`, `deviceIdOf` (SHA-256 with `crypto.subtle`)                                                                                  |
| `src/features/chat/openers.ts`                                                                                 | `OPENERS_SCHEMA` (structured output) and `buildOpenersPrompt`                                                                                                                             |
| `src/features/chat/api.ts`                                                                                     | `chatGenerateOpeners`, `chatRegisterDevice`, `chatRemoveDevice`. A shared `loadBriefContext` is used by the brief and the openers.                                                        |
| `components/SendCard.tsx`                                                                                      | "Suggest openers", with a privacy note and a tone chip and "Use" on each opener. The message box is now inside this card.                                                                 |
| `components/ChatTab.tsx`                                                                                       | `?nudge=1` banner. "Looks right, suggest openers" removes the parameter and triggers openers.                                                                                             |
| `components/NudgesCard.tsx`                                                                                    | Nudges on/off, "Also notify this device", and messages for unsupported, blocked and failed states                                                                                         |
| `components/NudgeListener.tsx`                                                                                 | Snackbar with an "Open" button for pushes that arrive while the app is open                                                                                                               |
| `src/features/chat/locales/*.json`                                                                             | `openers.*`, `nudge.*`, `nudges.*`                                                                                                                                                        |
| `src/hoc/Routing.tsx`                                                                                          | Lazy `NudgeListener` next to `Layout`                                                                                                                                                     |
| `vite.config.ts`                                                                                               | Separate `firebase-ai` and `firebase-messaging` chunks                                                                                                                                    |

## 4. Data and endpoints touched

- `users/{uid}/devices/{sha256(token)}`: `token`, `language`, `userAgent`
- `users/{uid}/settings/chat`: `nudgesEnabled`, `timeZone`
- **Endpoints:**
  - `chatGenerateOpeners({ playerId, profile, settings, state, languageName, defaultStyle })` returns `Opener[]` (not stored)
  - `chatRegisterDevice({ token, language })` returns the device id
  - `chatRemoveDevice(deviceId)`

## 5. i18n keys added

`chat`: `openers.*` (including `tone.*`), `nudge.*`, `nudges.*`

## 6. Implementation notes (as built)

- **App Check:**
  - The site key is public and committed.
  - In dev, the SDK prints a debug token in the browser console. Register it in the Firebase console: App Check → Apps → ⋮ → Manage debug tokens. The token value itself is never committed.
- **Openers:**
  - The prompt is in English and asks for the openers in the UI language (an English name, from `Intl.DisplayNames`).
  - It contains only: enabled rules, profile options and topics, pinned key notes, the latest 10 intel entries, the chat state (hours since the last message), and the style (base instructions or the translated default, plus `aiNotes`).
  - Output is constrained by `OPENERS_SCHEMA` to `{ openers: [{ text, tone }] }`. The client keeps at most 3.
  - "Use" copies an opener into the message box, which feeds Copy and WhatsApp.
- **From a nudge:** `?nudge=1` shows a banner. The user checks the chat state first, then "Looks right, suggest openers" removes the parameter and generates once.
- **Nudges switch:**
  - **On:** asks for notification permission (only from this click), registers the service worker, gets the token and saves `devices/{sha256(token)}`. It then sets `nudgesEnabled: true` and the current `timeZone`.
  - **Off:** removes this device's doc, deletes the FCM token and sets `nudgesEnabled: false`.
  - The device id is kept in `localStorage`. If nudges are on but this browser isn't registered, "Also notify this device" appears.
- **iPhone:** web push only works when the app is added to the Home Screen and opened from there. The card says so when push is unsupported.
- **Bundle:**
  - The Firebase core chunk is now 531 kB.
  - `firebase-ai` (62 kB) and `firebase-messaging` (26 kB) load with the chat chunk, which loads soon after start because of `NudgeListener`.

## 7. Deviations from plan

- **Openers sit in the Send card.** The message box and openers share one card, so "Use" fills the message directly. The plan had separate sections (D-013).
- **Notification clicks** are handled by the FCM SDK through `webpush.fcmOptions.link`, set by the stage 9 function. There's no custom click handler in the service worker (D-013).
- **Turning nudges off is global** (`nudgesEnabled: false`) and also removes this browser's device. Another browser's device doc stays until nudges are turned on from there again, or the account is deleted (D-013).

## 8. Verification checklist

- [x] `yarn build` (no chunk warning), `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys.
- [x] Icons rendered and checked visually (512, maskable 512).
- [x] `yarn dev`: the console shows `App Check debug token: …`. Register it in the Firebase console.
- [x] Suggest openers: 2–3 openers in the UI language, each with a tone. "Use" fills the message, and Copy and WhatsApp work.
- [ ] Chat settings → Nudges on: the browser asks for permission once. `users/{uid}/devices` gets exactly one doc. Turning it on again keeps one doc.
- [ ] Firebase console → Messaging → **Send test message** to that token: it arrives while the tab is in the background. With the app open, the snackbar shows.
- [x] Open `/roster/<id>/chat?nudge=1`: the banner shows, and "Looks right, suggest openers" generates once and removes the parameter.
- [ ] Nudges off: the device doc is removed and `nudgesEnabled` is false.
- [x] Install as an app (Chrome: install icon; Android: "Add to Home screen"). The name shows as "Maybes" with the "M" icon.
- [x] Firebase console → App Check → APIs → Firebase AI Logic shows mostly "verified" requests.

## 9. Open issues / follow-ups

- **Push not yet checked in Brave.** Brave blocks its push service by default. Turn on "Use Google services for push messaging" (brave://settings/privacy), restart Brave, then turn nudges on again. The three unticked push items above are checked again in stage 9, together with `sendNudges`.

- **Enforce App Check** for Firebase AI Logic once the metrics show verified traffic, and for Functions in stage 9.
- **Test on iPhone** after the first Hosting deploy. Push needs HTTPS and installation; `localhost` only covers desktop.
- If Gemini publishes a newer Flash model, change `GEMINI_MODEL` in `src/firebase/ai.ts`.
