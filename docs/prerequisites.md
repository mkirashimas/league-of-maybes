# Prerequisites (manual steps)

Claude Code can't do these steps. Until each value is provided, the code uses a named placeholder (`REPLACE_WITH_…`). Search the code for `REPLACE_WITH_` to see what's still missing.

| #   | Step                                                                                                                                                  | Needed from stage | Done |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---- |
| 1   | Create a Firebase project and register a **web app**                                                                                                  | 1                 | ⬜   |
| 2   | Enable **Google** sign-in (Authentication → Sign-in method)                                                                                           | 1                 | ⬜   |
| 3   | Create **Cloud Firestore** in production mode, location **`eur3`** (Europe multi-region)                                                              | 1                 | ⬜   |
| 4   | Upgrade to the **Blaze** plan                                                                                                                         | 8                 | ⬜   |
| 5   | Enable **Firebase AI Logic** (Gemini Developer API)                                                                                                   | 8                 | ⬜   |
| 6   | Set up **App Check** with reCAPTCHA Enterprise. Register a debug token for local dev. Turn on enforcement for AI Logic, and later for Cloud Functions | 8                 | ⬜   |
| 7   | Generate a **web push VAPID key** (Project settings → Cloud Messaging → Web Push certificates)                                                        | 8                 | ⬜   |
| 8   | Set a **budget alert** on the billing account                                                                                                         | 8                 | ⬜   |

## Where each value goes

All of these values are public. They are committed to the repo, not kept in env files (see [decisions.md](decisions.md)).

| Value                                                                                           | File                                        | Placeholder                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------- |
| Project id                                                                                      | `.firebaserc`                               | `REPLACE_WITH_FIREBASE_PROJECT_ID` |
| Web config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) | `src/firebase/config.ts`                    | `REPLACE_WITH_…` per field         |
| Same web config, again                                                                          | `public/firebase-messaging-sw.js` (stage 8) | same fields                        |
| App Check site key                                                                              | `src/firebase/config.ts` (stage 8)          | `REPLACE_WITH_APP_CHECK_SITE_KEY`  |
| VAPID key                                                                                       | `src/firebase/messaging.ts` (stage 8)       | `REPLACE_WITH_VAPID_KEY`           |

**Never commit:** service-account keys, App Check debug tokens, or any server credential.
