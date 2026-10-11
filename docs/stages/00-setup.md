# Stage 0: Setup

**Status:** ⏸ in review (2026-10-12)

## 1. Goal

An empty app that builds, with the tooling, the Firebase project files and this docs folder in place. Stage 1 can start writing features right away.

## 2. Scope

**In**

- The `league-of-maybes/` folder: Vite + React + TypeScript (strict), set up with Yarn
- ESLint (flat config) and Prettier
- `firebase.json` (Firestore and Hosting with the SPA rewrite), `.firebaserc`, a deny-all `firestore.rules`, an empty `firestore.indexes.json`
- `index.html` with the app name and the motto as the meta description; `public/favicon.svg`
- `docs/`: README, architecture, decisions, prerequisites, and stage files 00–10

**Out**

- Any app code beyond a placeholder `App` (stage 1)

## 3. Files created and changed

| File                                                       | Notes                                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `package.json`                                             | Name `league-of-maybes`. Same scripts and dependency ranges as `prothext-facts` (D-005). |
| `yarn.lock`                                                | Created by `yarn install`                                                                |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Copied. `strict`, `noUnusedLocals`, `verbatimModuleSyntax`, `erasableSyntaxOnly`         |
| `vite.config.ts`                                           | Copied (React plugin)                                                                    |
| `eslint.config.js`                                         | Copied: JS and TS recommended, react-hooks, react-refresh, prettier                      |
| `.prettierrc`, `.prettierignore`                           | Copied: single quotes, trailing commas, width 100                                        |
| `.gitignore`                                               | Copied, plus Firebase logs                                                               |
| `index.html`                                               | Title "League of Maybes", meta description = motto                                       |
| `public/favicon.svg`                                       | Placeholder "M?" mark. Replaced by real icons in stage 8.                                |
| `src/main.tsx`                                             | Renders `hoc/App` in `StrictMode`                                                        |
| `src/hoc/App.tsx`                                          | Placeholder (`null`), replaced in stage 1                                                |
| `firebase.json`                                            | Firestore and Hosting (`dist`, SPA rewrite). The Functions block comes in stage 9.       |
| `.firebaserc`                                              | `REPLACE_WITH_FIREBASE_PROJECT_ID`                                                       |
| `firestore.rules`                                          | Deny all. Owner-only rules come in stage 1.                                              |
| `firestore.indexes.json`                                   | Empty                                                                                    |
| `docs/**`                                                  | This documentation                                                                       |

## 4. Data and endpoints touched

None.

## 5. i18n keys added

None. i18n starts in stage 1. The `index.html` title and description stay in English, as planned.

## 6. Implementation notes (as built)

- Installed versions:
  - react 19.3.0
  - @mui/material 9.5.0
  - firebase 12.19.0
  - vite 8.3.4
  - typescript 6.0.3
  - @reduxjs/toolkit 2.13.0
  - react-router 7.18.4
  - i18next 26.4.3
- Toolchain: Node 22.14.0, Yarn 1.22.22.
- `yarn format` also formats `docs/**/*.md`, so the docs follow Prettier too.
- `league-of-maybes/` is not a git repository yet. The PHD workspace isn't one either.

## 7. Deviations from plan

None.

## 8. Verification checklist

- [x] `yarn install`: done, with no errors.
- [x] `yarn build`: `tsc -b && vite build` builds with no errors.
- [x] `yarn lint`: no problems.
- [x] `npx prettier --check .`: "All matched files use Prettier code style!"

## 9. Open issues / follow-ups

- Prerequisites 1–3 (Firebase project, Google sign-in, Firestore in `eur3`) are needed to sign in during stage 1. Until then, stage 1 builds against placeholders.
- Decide whether to run `git init` in `league-of-maybes/`.
