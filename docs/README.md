# League of Maybes: docs

> Just date them both (all) and see who's serious.

League of Maybes is a private, single-user "league manager" for dating. You keep a roster of players and, for each one:

- rate traits
- scout them before dating
- track the chat
- log dates and the time since the last one
- plan what's next
- pin the facts worth remembering

## Docs in this folder

| File                                 | What's in it                                                                       |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| [architecture.md](architecture.md)   | Features, data ownership, data model, routes, endpoints                            |
| [decisions.md](decisions.md)         | Every product and technical decision, with date and reason                         |
| [prerequisites.md](prerequisites.md) | Firebase console steps you do by hand, and where each key goes                     |
| [stages/](stages/)                   | One file per stage: the plan before the stage starts, as-built notes after it ends |

## Stages

Status: ⬜ planned · 🟡 in progress · ⏸ in review · ✅ done

| #   | Stage                                                 | Status |
| --- | ----------------------------------------------------- | ------ |
| 0   | [Setup](stages/00-setup.md)                           | ⏸      |
| 1   | [Shell](stages/01-shell.md)                           | ⬜     |
| 2   | [Legal](stages/02-legal.md)                           | ⬜     |
| 3   | [Roster](stages/03-roster.md)                         | ⬜     |
| 4   | [Dates and Timeline](stages/04-dates-timeline.md)     | ⬜     |
| 5   | [Intel and Key Notes](stages/05-intel-keynotes.md)    | ⬜     |
| 6   | [Agenda](stages/06-agenda.md)                         | ⬜     |
| 7   | [Chat core](stages/07-chat-core.md)                   | ⬜     |
| 8   | [AI and push](stages/08-ai-push.md)                   | ⬜     |
| 9   | [Cloud Functions](stages/09-functions.md)             | ⬜     |
| 10  | [Hardening and launch](stages/10-hardening-launch.md) | ⬜     |

After each stage, `yarn build` and `yarn lint` must pass. The work then stops for review.

## How to run

```sh
cd league-of-maybes
yarn install
yarn dev        # http://localhost:5173
yarn build      # tsc -b && vite build
yarn lint
```

The Firebase project must be set up first (see [prerequisites.md](prerequisites.md)). Until then, the app builds but can't sign in.

## Conventions

The app follows the workspace [CLAUDE.md](../../CLAUDE.md): Vite, TypeScript strict, MUI, Redux Toolkit + RTK Query, i18next in 5 languages, React Router, and Firebase with Google sign-in only.

The plan adds Cloud Functions, FCM, Firebase AI Logic, App Check and a PWA manifest (see [decisions.md](decisions.md)).
