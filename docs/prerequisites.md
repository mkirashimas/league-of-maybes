# Prerequisites (manual steps)

Claude Code can't do these steps. Until each value is provided, the code uses a named placeholder (`REPLACE_WITH_…`). Search the code for `REPLACE_WITH_` to see what's still missing.

| #   | Step                                                                                                                                                                                      | Needed from stage | Done                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| 1   | Create a Firebase project and register a **web app**                                                                                                                                      | 1                 | ✅                                              |
| 2   | Enable **Google** sign-in (Authentication → Sign-in method)                                                                                                                               | 1                 | ✅                                              |
| 3   | Create **Cloud Firestore** in production mode, location **`eur3`** (Europe multi-region)                                                                                                  | 1                 | ✅                                              |
| 4   | Upgrade to the **Blaze** plan                                                                                                                                                             | 8                 | ✅                                              |
| 5   | Enable **Firebase AI Logic** (Gemini Developer API)                                                                                                                                       | 8                 | ✅                                              |
| 6   | Set up **App Check** with reCAPTCHA Enterprise. Register a debug token for local dev. Turn on enforcement for AI Logic (callables enforce it in code)                                     | 8                 | 🟡 key registered, AI Logic enforcement pending |
| 7   | Generate a **web push VAPID key** (Project settings → Cloud Messaging → Web Push certificates)                                                                                            | 8                 | ✅                                              |
| 8   | Set a **budget alert** on the billing account                                                                                                                                             | 8                 | ✅                                              |
| 9   | Deploy the functions and the indexes: `firebase deploy --only functions,firestore:indexes`. The first deploy turns on Cloud Functions, Cloud Build, Artifact Registry and Cloud Scheduler | 9                 | ✅                                              |
| 10  | Deploy the whole app: `yarn build`, then `firebase deploy` (Hosting, rules, indexes, functions). Check that the indexes show "Enabled"                                                    | 10                | ⬜                                              |

## Where each value goes

All of these values are public. They are committed to the repo, not kept in env files (see [decisions.md](decisions.md)).

| Value                                                                                           | File                              | Placeholder                  |
| ----------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------- |
| Project id                                                                                      | `.firebaserc`                     | set: `league-of-maybes`      |
| Web config (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) | `src/firebase/config.ts`          | provided; written in stage 1 |
| Same web config, again                                                                          | `public/firebase-messaging-sw.js` | set                          |
| App Check site key                                                                              | `src/firebase/config.ts`          | set (`6Ld7sest…`)            |
| VAPID key                                                                                       | `src/firebase/messaging.ts`       | set (`BH2bnb7…`)             |

**Never commit:** service-account keys, App Check debug tokens, or any server credential.
