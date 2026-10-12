# League of Maybes

> Just date them both (all) and see who's serious.

League of Maybes is a private, single-user "league manager" for dating. You keep a roster of players and, for each one:

- rate traits
- scout them before dating
- track the chat
- log dates and the time since the last one
- plan what's next
- pin the facts worth remembering

## How to run

```sh
yarn install
yarn dev        # http://localhost:5173
yarn build      # tsc -b && vite build
yarn lint
```

Cloud Functions are a separate package in `functions/`:

```sh
cd functions
yarn install
yarn build      # tsc, output in functions/lib
yarn lint
firebase deploy --only functions,firestore:indexes
```

Sign-in needs the Firebase console steps in [docs/prerequisites.md](docs/prerequisites.md).

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

Each stage is built on its own branch and merged into `development` by pull request (see [docs/workflow.md](docs/workflow.md)). `yarn build` and `yarn lint` must pass before a merge.

## Stack

- Vite, TypeScript (strict), Yarn
- React, MUI
- Redux Toolkit + RTK Query
- i18next in 5 languages (en, es, fr, it, ro)
- React Router
- Firebase: Auth (Google only), Firestore, Hosting, Cloud Functions, Cloud Messaging, AI Logic, App Check

The app follows the PHD workspace conventions (`CLAUDE.md`, outside this repo). The additions to those conventions are listed in [docs/decisions.md](docs/decisions.md).
