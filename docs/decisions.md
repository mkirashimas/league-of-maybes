# Decisions

Each entry has an id, a date and a reason. New decisions go at the bottom. A decision that replaces an older one says so in its entry.

## D-001: Product decisions (2026-10-12)

| Decision            | Detail                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Private data        | Everything lives under `users/{uid}/…` and only the owner can read it. Nothing is shared.   |
| No linking          | Players are never linked to real app users.                                                 |
| No real names       | Players have a `nickname` only. The form tells the user not to use real names.              |
| User responsibility | The user is responsible for the data they enter, and accepts the terms after first sign-in. |
| Live chat AI        | The user uses their own AI tool. The app gives them a copyable "AI brief".                  |
| App AI              | Used only to suggest 2–3 openers when a nudge is opened.                                    |
| Chat rules          | Reminders only. The app never reads WhatsApp.                                               |
| Backend             | Cloud Functions only. No separate Node service.                                             |
| Deleting players    | Players are retired, never hard-deleted. Deleting the account removes everything.           |

## D-002: Additions to the workspace stack (2026-10-12)

These go beyond the workspace CLAUDE.md. Where they conflict, this plan wins.

| Addition                                   | Use                                         | Location                                                       |
| ------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------- |
| Cloud Functions (2nd gen, TS strict, Yarn) | Scheduled nudges, account export and delete | `functions/`                                                   |
| Firebase Cloud Messaging                   | Web push for nudges                         | `src/firebase/messaging.ts`, `public/firebase-messaging-sw.js` |
| Firebase AI Logic (Gemini Flash)           | Suggest openers, called from the client     | `src/firebase/ai.ts`                                           |
| App Check (reCAPTCHA Enterprise)           | Protects AI Logic and Functions             | `src/firebase/config.ts`                                       |
| PWA manifest                               | Push on iPhone needs the app installed      | `public/manifest.webmanifest`                                  |

Functions run in region `europe-west1` with `maxInstances: 2`.

## D-003: Public Firebase values are committed (2026-10-12)

The web config, the App Check site key and the VAPID key are public. They are written directly in the source, with no env files. Data is protected by the security rules, Auth and App Check, not by hiding these values.

## D-004: App name (2026-10-12)

The app is called **League of Maybes**, which sums up the motto: everyone's a maybe until they prove they're serious.

- Folder and package name: `league-of-maybes`.
- PWA `short_name`: "Maybes".
- The name isn't translated.
- Rejected:
  - "Sex Tryouts", because the name would show on the Google sign-in screen, the URL and the home screen.
  - Names with "The League" on its own, because that's an existing dating app.

## D-005: Tooling copied from `prothext-facts` (2026-10-12)

ESLint flat config, Prettier, the tsconfig files and the dependency versions are copied from `../prothext-facts`. This keeps the workspace apps consistent. The apps still share no code at runtime.

## D-006: Keep Firebase Hosting (2026-10-12)

Any static HTTPS host would work. Firebase Hosting is kept because:

- It's free, and it lives in the same project and CLI.
- Google sign-in works on `*.web.app` and `*.firebaseapp.com` with no extra setup.
- The SPA rewrite is already in `firebase.json`.
- Preview channels give each pull request its own URL.

Push (an HTTPS service worker) and installing the app as a PWA both need HTTPS, which Hosting provides.

## D-007: Repo, branches and CI (2026-10-12)

- **Repo:** `league-of-maybes/` is its own git repo, `https://github.com/mkirashimas/league-of-maybes`.
- **Branches:**
  - `main` is production.
  - `development` is the integration branch and the default target for pull requests.
  - Work happens on `stage/NN-<slug>`, `chore/…`, `fix/…` and `docs/…` branches, which are squash-merged into `development`.
  - Releases are pull requests from `development` into `main`, using a merge commit.
- **CI:** `.github/workflows/ci.yml` runs `yarn install --frozen-lockfile`, `yarn lint` and `yarn build` on Node 22.
- **README:** it lives at the app root, which is where GitHub shows it. The rest of the docs stay in `docs/`.

The full flow is in [workflow.md](workflow.md).

## Review fixes R1–R17 (2026-10-12)

These came out of reviewing the plan. Each is applied in the stage listed.

| #   | Fix                                                                                                                                                   | Stage |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| R1  | `agenda` gets its own `PlayerRef` type and a read-only `getPlayerRefs` endpoint, so Upcoming can show nicknames.                                      | 6     |
| R2  | `agendaItems.when` is always written (`null` when there's no date). Firestore drops documents missing the `orderBy` field. Upcoming runs two queries. | 6     |
| R3  | Trait definitions use the trait `key` as the document id, so the seed is idempotent.                                                                  | 3     |
| R4  | `getChatSettings` merges defaults over the stored doc, so a missing doc means defaults.                                                               | 7     |
| R5  | `toSerializable` converts Timestamps recursively, including nested objects and arrays.                                                                | 1     |
| R6  | `setDocument(…, { merge })` doesn't reset `createdAt` on upserts.                                                                                     | 1     |
| R7  | `dateSummaries` are recomputed inside a Firestore transaction (`runTransactionFn`).                                                                   | 1, 4  |
| R8  | Realtime lists paginate with "Load more", which raises `limit`. Page size is 20.                                                                      | 5     |
| R9  | The client calls functions with region `europe-west1`. Firestore location is `eur3`.                                                                  | 9     |
| R10 | The messaging service worker uses `importScripts` with the compat CDN at the same SDK version.                                                        | 8     |
| R11 | The device doc id is the SHA-256 of the push token, so registering a device is an upsert.                                                             | 8     |
| R12 | The quiet-hours check handles windows that cross midnight. It's written twice: in `chat` (client) and in `functions` (server).                        | 7, 9  |
| R13 | `settings/chat.timeZone` is refreshed whenever the browser time zone changes.                                                                         | 7     |
| R14 | `CONSENT` sits inside the auth guard but outside `ConsentGate`. Terms and Privacy are public.                                                         | 2     |
| R15 | After account delete: sign out, `api.util.resetApiState()`, go to `LOGIN`. The server does a recursive delete, then deletes the auth user.            | 9     |
| R16 | Callables use `enforceAppCheck: true`. The debug token is set only in dev.                                                                            | 8, 9  |
| R17 | `chatStates.nextNudgeAt` gets a collection-group single-field index.                                                                                  | 10    |
