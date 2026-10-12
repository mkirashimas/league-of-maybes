# Architecture

This is the target design. Each stage file records what was actually built and any changes from this design.

## 1. Stack

| Concern        | Choice                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Build          | Vite, Yarn, TypeScript `strict`                                                                              |
| UI             | React function components, MUI, Emotion                                                                      |
| State and data | Redux Toolkit + RTK Query (`fakeBaseQuery` + Firestore helpers)                                              |
| i18n           | i18next: `en`, `es`, `fr`, `it`, `ro` (alphabetical; `en` is the fallback)                                   |
| Routing        | React Router                                                                                                 |
| Backend        | Firebase: Auth (Google only), Firestore, Hosting, Cloud Functions (`europe-west1`), FCM, AI Logic, App Check |

## 2. Folder layout

```
league-of-maybes/
  README.md                  # overview, how to run, stage status
  .github/workflows/ci.yml   # lint + build on PRs and pushes to development/main
  docs/                      # this folder
  functions/                 # Cloud Functions (stage 9), own package.json
    src/index.ts             # thin handlers
    src/nudges/              # sendNudges logic, quiet hours, push texts
    src/account/             # export and delete
  public/
    favicon.svg
    manifest.webmanifest     # stage 8
    firebase-messaging-sw.js # stage 8
  src/
    main.tsx
    hoc/        App.tsx, Routing.tsx, Layout.tsx, PublicLayout.tsx
    types/      paths.ts, index.ts
    firebase/   config.ts, auth.ts, firestore.ts, functions.ts, messaging.ts, ai.ts
    store/      index.ts, api.ts, authSlice.ts, themeSlice.ts
    i18n/       index.ts, locales/{en,es,fr,it,ro}/common.json
    theme/      index.ts, theme.ts, palette.ts, typography.ts, components.ts, augmentation.d.ts
    features/   auth, legal, roster, intel, chat, dates, agenda, keyNotes
  firestore.rules
  firestore.indexes.json
  firebase.json
  .firebaserc
```

## 3. Features and data ownership

No feature imports another feature. When a feature needs another feature's data, it defines its own small type and a **read-only** endpoint. Shared logic is copied into each feature that needs it.

| Feature    | Purpose                                                                                   | Owns (`users/{uid}/…`)                                                | Read-only cross reads                   |
| ---------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- |
| `auth`     | Login page                                                                                | none                                                                  | none                                    |
| `legal`    | Terms, Privacy, consent gate, Account page                                                | the `users/{uid}` doc                                                 | none                                    |
| `roster`   | League Table, player form, traits, status, `PlayerLayout`, trait settings                 | `players`, `traitDefinitions`                                         | none                                    |
| `intel`    | Scouting before dating                                                                    | `intel`                                                               | none                                    |
| `chat`     | Chat profile, quirks log, chat state, reminders, AI brief, openers, nudges, chat settings | `chatProfiles`, `chatNotes`, `chatStates`, `settings/chat`, `devices` | `keyNotes`, `intel` → `getBriefContext` |
| `dates`    | Date log, Timeline                                                                        | `dates`, `dateSummaries`                                              | `players` → `getPlayerRefs`             |
| `agenda`   | Now & Next, Upcoming                                                                      | `agendaItems`                                                         | `players` → `getPlayerRefs`             |
| `keyNotes` | Key facts, pinned and ranked                                                              | `keyNotes`                                                            | none                                    |

## 4. Data model

Every document gets `createdAt` and `updatedAt` (server timestamps) from the helpers. The helpers convert Timestamps to epoch millis on read, recursively, so Redux only holds serializable values.

```
users/{uid}                          # legal
│   consent: { termsVersion, acceptedAt }
├── players/{playerId}               # roster
│     nickname, age | null, occupation, city, metAt, metOn (yyyy-mm-dd | '')
│     avatarColor: primary | secondary | info | success | warning | error (palette key)
│     status: prospect | active | bench | injuredReserve | retired
│     traits: { [traitKey]: number | string }
├── traitDefinitions/{traitKey}      # roster; doc id = key, so seeding is idempotent
│     key, builtIn, customLabel, kind: scale | number | enum
│     unit, options[], weight (0–3), order, active
├── intel/{intelId}                  # intel
│     playerId, category, text
├── chatProfiles/{playerId}          # chat
│     platform, textingStyle, replyTime, initiator, bestTime
│     topicsThatLand[], topicsToAvoid[], phone?, aiNotes?
├── chatNotes/{noteId}               # chat
│     playerId, category, text
├── chatStates/{playerId}            # chat
│     playerId, lastSender: me | them, lastInboundAt, lastOutboundAt (Timestamps)
│     nextNudgeAt | null, nudgedAt | null, stateUpdatedAt
├── settings/chat                    # chat; missing doc = defaults
│     aiInstructions, rules: { [ruleKey]: boolean }
│     resumeAfterHours (72), minReplyDelayMin (20)
│     quietHours: { start: '22:00', end: '09:00' }, timeZone, nudgesEnabled
├── devices/{sha256(token)}          # chat
│     token, language, userAgent
├── dates/{dateId}                   # dates
│     playerId, date (yyyy-mm-dd, local day), venue, activity, rating 1–10 | null
│     outcome: great | good | meh | bad, highlights, nextStep?
├── dateSummaries/{playerId}         # dates; re-query + overwrite after each date write (D-010)
│     playerId, lastDateAt (yyyy-mm-dd | null), count, recentDates[] (last 90 days)
├── agendaItems/{itemId}             # agenda
│     playerId, kind: now | event | plan, title, notes?, when | null, done
└── keyNotes/{noteId}                # keyNotes
      playerId, category, text, pinned, importance (1 low | 2 medium | 3 high)
```

**Rules for the data**

- Child records are per-user collections with a `playerId` field. They are never subcollections of a player, and never arrays inside the player doc.
- `overall` is not stored. It's the weighted average of the scale traits, computed on the client.
- `agendaItems.when` is always written, as `null` when there's no date. Firestore leaves out documents that are missing the `orderBy` field.

**Categories** (i18n keys, kept in each feature)

| Collection  | Categories                                                                  |
| ----------- | --------------------------------------------------------------------------- |
| `intel`     | howWeMet, socials, interests, greenFlag, redFlag, mutualFriends, openerIdea |
| `chatNotes` | humor, pace, emoji, pattern, other                                          |
| `keyNotes`  | birthday, family, pets, allergies, insideJoke, giftIdea, noGoTopic, other   |

**Default traits** (seeded on first login; built-ins added later are seeded for existing accounts, and stored built-ins follow the kind and options below). Scale traits weigh 1–10 in `overall`; other kinds don't count. The League Table shows the active scale traits with `showInTable`; it defaults to on for hot, sex and crazyEyes.

| Trait                                                                           | Kind       | Weight |
| ------------------------------------------------------------------------------- | ---------- | ------ |
| height (ranges: under 160 … 190+ cm), weight (ranges: under 50 … 100+ kg)       | enum       | –      |
| hot, sex, funny, communication, chemistry, consistency, ambition, crazyEyes     | scale 1–10 | 1      |
| Big Five: openness, conscientiousness, extraversion, agreeableness, neuroticism | scale 1–10 | 1      |
| attachmentStyle (secure, anxious, avoidant, fearfulAvoidant)                    | enum       | –      |

## 5. Security rules and indexes

**Rules**

- Deny by default.
- Every path under `users/{uid}` allows read and write only when `request.auth != null && request.auth.uid == uid`.
- Cloud Functions use the Admin SDK, which bypasses the rules.

**Indexes**

| Collection           | Fields                                          | Scope                             |
| -------------------- | ----------------------------------------------- | --------------------------------- |
| `intel`, `chatNotes` | `playerId ==`, `createdAt desc`                 | collection                        |
| `dates`              | `playerId ==`, `date desc`                      | collection                        |
| `agendaItems`        | `playerId ==`, `createdAt desc`                 | collection                        |
| `agendaItems`        | `done ==`, `when asc`                           | collection                        |
| `keyNotes`           | `playerId ==`, `pinned desc`, `importance desc` | collection                        |
| `chatStates`         | `nextNudgeAt asc`                               | collection group (field override) |

## 6. Routes (`src/types/paths.ts`)

| Key                | Path                          | Access                                   |
| ------------------ | ----------------------------- | ---------------------------------------- |
| `HOME`             | `/`                           | redirects to `ROSTER`                    |
| `LOGIN`            | `/login`                      | public                                   |
| `TERMS`            | `/terms`                      | public                                   |
| `PRIVACY`          | `/privacy`                    | public                                   |
| `CONSENT`          | `/consent`                    | signed in                                |
| `ROSTER`           | `/roster`                     | app                                      |
| `PLAYER_NEW`       | `/roster/new`                 | app                                      |
| `PLAYER`           | `/roster/:playerId`           | app (Profile & Traits tab)               |
| `PLAYER_INTEL`     | `/roster/:playerId/intel`     | app                                      |
| `PLAYER_CHAT`      | `/roster/:playerId/chat`      | app (`?nudge=1` when opened from a push) |
| `PLAYER_DATES`     | `/roster/:playerId/dates`     | app                                      |
| `PLAYER_AGENDA`    | `/roster/:playerId/now`       | app                                      |
| `PLAYER_KEY_NOTES` | `/roster/:playerId/key-notes` | app                                      |
| `TIMELINE`         | `/timeline`                   | app                                      |
| `AGENDA`           | `/upcoming`                   | app                                      |
| `TRAIT_SETTINGS`   | `/settings/traits`            | app                                      |
| `CHAT_SETTINGS`    | `/settings/chat`              | app                                      |
| `ACCOUNT`          | `/settings/account`           | app                                      |

"Signed in" means past the auth guard. "App" means past the auth guard and `ConsentGate`. Links with params use `generatePath(PATHS.X, { playerId })`.

## 7. Route tree and layout

```
PublicLayout (language switcher + theme toggle)
  LOGIN, TERMS, PRIVACY
AuthGuard → redirects to LOGIN if signed out
  CONSENT
  ConsentGate (legal) → redirects to CONSENT until TERMS_VERSION is accepted
    Layout (top bar + sidebar)
      HOME → ROSTER, ROSTER, PLAYER_NEW, TIMELINE, AGENDA, TRAIT_SETTINGS, CHAT_SETTINGS, ACCOUNT
      PlayerLayout (roster): header + tabs
        PLAYER (roster), PLAYER_INTEL (intel), PLAYER_CHAT (chat),
        PLAYER_DATES (dates), PLAYER_AGENDA (agenda), PLAYER_KEY_NOTES (keyNotes)
```

- **Top bar:** app name, language `Select`, light/dark toggle, user menu (Account, Sign out).
- **Sidebar:**
  - Items: League Table, Timeline, Upcoming, Traits, Chat settings.
  - Footer: the motto in muted text, plus Terms and Privacy links.

## 8. RTK Query endpoints

`*` marks a realtime endpoint (`onCacheEntryAdded` with a `subscribe*` helper). Lists on player tabs take a `limit`, and "Load more" raises it by 20.

| Feature    | Endpoints                                                                                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legal`    | `getConsent*`, `acceptTerms`, `exportAccount`                                                                                                                                                                                                   |
| `roster`   | `getPlayers*`, `getPlayer`, `createPlayer`, `updatePlayer`, `setPlayerStatus`, `updatePlayerTraits`, `deletePlayer`, `getTraitDefinitions*`, `upsertTraitDefinition`, `reorderTraitDefinitions`, `syncTraitDefinitions`                         |
| `intel`    | `getIntel*`, `addIntel`, `updateIntel`, `deleteIntel`                                                                                                                                                                                           |
| `chat`     | `getChatProfile`, `setChatProfile`, `getChatNotes`, `addChatNote`, `deleteChatNote`, `getChatState*`, `logInbound`, `logOutbound`, `getChatSettings`, `setChatSettings`, `registerDevice`, `removeDevice`, `getBriefContext`, `generateOpeners` |
| `dates`    | `getDates`, `getDateSummaries*`, `getPlayerRefs*`, `createDate`, `updateDate`, `deleteDate`                                                                                                                                                     |
| `agenda`   | `getAgendaItems`, `getUpcomingItems`, `getPlayerRefs*`, `createAgendaItem`, `updateAgendaItem`, `toggleAgendaItemDone`, `deleteAgendaItem`                                                                                                      |
| `keyNotes` | `getKeyNotes*`, `createKeyNote`, `updateKeyNote`, `toggleKeyNotePin`, `deleteKeyNote`                                                                                                                                                           |

## 9. Shared infrastructure helpers (`src/firebase/`)

| File           | Exports                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `config.ts`    | `app`, `auth`, `db`, App Check init. The public config is hardcoded.                                                                                                                             |
| `auth.ts`      | `signInWithGoogle`, `signOut`, `onAuthChanged`                                                                                                                                                   |
| `firestore.ts` | `getDocument`, `getDocuments`, `createDocument`, `setDocument(…, { merge })`, `updateDocument`, `deleteDocument`, `subscribeToDocument`, `subscribeToCollection`, `runBatch`, `runTransactionFn` |
| `functions.ts` | `callFunction<Req, Res>(name, data)`, region `europe-west1`                                                                                                                                      |
| `messaging.ts` | `requestPushToken()`, `onForegroundMessage()`                                                                                                                                                    |
| `ai.ts`        | `generateJson<T>(prompt, schema)`; the Gemini model name is one constant                                                                                                                         |

## 10. Chat and nudges, end to end

1. The user taps **"I replied"** or **"They replied"**. The app writes `chatStates/{playerId}` with `nextNudgeAt = now + resumeAfterHours`.
2. **`sendNudges`** runs every 60 minutes. It runs a collection-group query on `chatStates` for `nextNudgeAt <= now`, then for each result:
   - skips it if nudges are off or it's quiet hours in the user's `timeZone`
   - clears it if the player is retired
   - otherwise pushes to every device. The text is generic, with no nickname, in the device language.
   - then sets `nextNudgeAt = null` and `nudgedAt = now`.
3. Clicking the push opens `PLAYER_CHAT?nudge=1`.
4. The user confirms the chat state.
5. The tab shows reminders and generates 2–3 openers through AI Logic.
6. The user copies the AI brief, or opens `https://wa.me/<phone>?text=…`.
