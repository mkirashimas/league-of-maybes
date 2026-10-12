# League of Maybes

> Just date them both (all) and see who's serious.

League of Maybes is a private, single-user "league manager" for dating. You keep a roster of players and, for each one, rate them, scout them, track the chat, log dates, plan what's next and pin the facts worth remembering. Only you can see your data.

## Features

| Area                     | What it does                                                                                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **League Table**         | Sortable table with a status filter: Name, Status, Overall, plus the traits you pick (default: Hot, Sex, Crazy eyes). Cards on phones.                                                                                                                               |
| **Players**              | Nickname-only profiles with status (prospect, active, bench, injured reserve, retired). Edit or delete from the Edit dialog; deleting removes all of the player's records.                                                                                           |
| **Traits**               | Built-ins: Height and Weight (ranges), Hot, Sex, Funny, Communication, Chemistry, Consistency, Ambition, Crazy eyes, Attachment style, and the Big Five. Add your own (1–10 scale, number or choice). Reorder, hide, and choose which ones show in the League Table. |
| **Overall score**        | Weighted average of the 1–10 traits and the choice traits. Every weight is 1–10, and each choice has its own 1–10 score ("Score the choices"). Empty values are skipped.                                                                                             |
| **Intel and Key Notes**  | Scouting notes by category, and pinned facts (birthday, family, allergies, gift ideas…), with "Load more".                                                                                                                                                           |
| **Dates and Timeline**   | Date log with rating and outcome. The Timeline shows days since the last date, colored by freshness, and a 90-day dot row.                                                                                                                                           |
| **Now & Next, Upcoming** | Per-player plans and "now" items. Upcoming lists open items and future plans by day.                                                                                                                                                                                 |
| **Chat**                 | Chat profile, quirks log, "I replied" / "They replied" state, rule reminders (no double text, quiet hours…), a copyable AI brief, and a WhatsApp send link.                                                                                                          |
| **AI openers**           | 2–3 opener suggestions with a tone, from Gemini through Firebase AI Logic, in the UI language.                                                                                                                                                                       |
| **Nudges**               | Web push when it's time to write again. Sent hourly by a Cloud Function; respects quiet hours and time zones; generic text that never names the player.                                                                                                              |
| **Account**              | Export everything as JSON. Delete the account only with a deletion code set beforehand; deletion is final and nothing can be recovered.                                                                                                                              |
| **App**                  | Google sign-in, terms consent, 5 languages (en, es, fr, it, ro), light and dark themes, installable as a PWA, works at phone width.                                                                                                                                  |

## How to run

```sh
yarn install
yarn dev        # http://localhost:5173
yarn build      # tsc -b && vite build
yarn lint
```

In dev, App Check prints a debug token in the browser console. Register it once in the Firebase console (App Check → Apps → Manage debug tokens).

Cloud Functions are a separate package in `functions/`:

```sh
cd functions
yarn install
yarn build      # tsc, output in functions/lib
yarn lint
```

Deploy (from the app root):

```sh
firebase deploy --only functions,firestore:rules,firestore:indexes
```

The Firebase console steps are listed in [docs/prerequisites.md](docs/prerequisites.md).

## Cloud Functions

All in `europe-west1`, `maxInstances: 2`. Callables enforce App Check and act on the caller's own uid only.

| Function          | Trigger                    | What it does                                                                                                  |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `sendNudges`      | every 60 min               | Sends due nudges to the user's devices; skips nudges off, quiet hours and retired players; drops dead tokens. |
| `onPlayerDeleted` | Firestore delete of player | Deletes the player's intel, chat, dates, plans and key notes.                                                 |
| `exportAccount`   | callable                   | Returns everything under `users/{uid}` as JSON.                                                               |
| `setDeletionCode` | callable                   | Sets or changes the deletion code (scrypt hash, server-only storage). Changing needs the current code.        |
| `deleteAccount`   | callable                   | With the correct code: deletes all data, the code and the sign-in. 5 wrong codes lock it for an hour.         |

## Project layout

```
src/
  hoc/        App shell: providers, routing, layout
  features/   auth, legal, roster, intel, keyNotes, dates, agenda, chat (each self-contained)
  firebase/   config, auth, firestore helpers, functions, messaging, ai
  store/      Redux store, base RTK Query api, auth and theme slices
  i18n/       i18next setup and common strings
  theme/      MUI theme (light and dark)
  types/      PATHS and app-wide types
functions/    Cloud Functions (own package)
public/       PWA manifest, icons, messaging service worker
docs/         architecture, decisions, prerequisites, workflow, stage notes
```

## Docs

| File                                           | What's in it                                                                       |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md)   | Features, data ownership, data model, routes, endpoints                            |
| [docs/decisions.md](docs/decisions.md)         | Every product and technical decision, with date and reason                         |
| [docs/prerequisites.md](docs/prerequisites.md) | Firebase console steps you do by hand, and where each key goes                     |
| [docs/workflow.md](docs/workflow.md)           | Branches, pull requests, CI, releases                                              |
| [docs/stages/](docs/stages/)                   | One file per stage: the plan before the stage starts, as-built notes after it ends |

## Stages

Status: ⬜ planned · 🟡 in progress · ⏸ in review · ✅ done

| #   | Stage                                                      | Status |
| --- | ---------------------------------------------------------- | ------ |
| 0   | [Setup](docs/stages/00-setup.md)                           | ✅     |
| 1   | [Shell](docs/stages/01-shell.md)                           | ✅     |
| 2   | [Legal](docs/stages/02-legal.md)                           | ✅     |
| 3   | [Roster](docs/stages/03-roster.md)                         | ✅     |
| 4   | [Dates and Timeline](docs/stages/04-dates-timeline.md)     | ✅     |
| 5   | [Intel and Key Notes](docs/stages/05-intel-keynotes.md)    | ✅     |
| 6   | [Agenda](docs/stages/06-agenda.md)                         | ✅     |
| 7   | [Chat core](docs/stages/07-chat-core.md)                   | ✅     |
| 8   | [AI and push](docs/stages/08-ai-push.md)                   | ✅     |
| 9   | [Cloud Functions](docs/stages/09-functions.md)             | ✅     |
| 10  | [Hardening and launch](docs/stages/10-hardening-launch.md) | ⬜     |

Changes after stage 9, from testing feedback (see [docs/decisions.md](docs/decisions.md)):

- **D-015:** player delete with cascade, account delete behind a deletion code, League Table columns per trait, the Sex trait, height and weight ranges, 1–10 weights, the Big Five.
- **D-016:** choice traits count in Overall, with a 1–10 score per choice.

Each stage is built on its own branch and merged into `development` by pull request (see [docs/workflow.md](docs/workflow.md)). CI runs `yarn lint` and `yarn build`, at the root and in `functions/`.

## Stack

- Vite, TypeScript (strict), Yarn
- React, MUI
- Redux Toolkit + RTK Query (realtime Firestore listeners in cache lifecycles)
- i18next in 5 languages (en, es, fr, it, ro)
- React Router
- Firebase: Auth (Google only), Firestore (`eur3`), Cloud Functions (2nd gen, Node 22), Cloud Messaging, AI Logic (Gemini), App Check (reCAPTCHA Enterprise), Hosting

The app follows the PHD workspace conventions (`CLAUDE.md`, outside this repo). The additions to those conventions are listed in [docs/decisions.md](docs/decisions.md).
