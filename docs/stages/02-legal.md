# Stage 2: Legal

**Status:** ⏸ in review (2026-10-12), branch `stage/02-legal`

## 1. Goal

After first sign-in the user must accept the terms. Terms and Privacy are readable without signing in.

## 2. Scope

**In**

- `features/legal`:
  - `TermsPage`, `PrivacyPage` (draft copy in 5 languages, with a `// DRAFT: needs legal review` comment)
  - `ConsentPage`, `ConsentGate`
  - `TERMS_VERSION`
  - endpoints `getConsent*` and `acceptTerms`
- `hoc/PublicLayout.tsx` with the language switcher and theme toggle (R14)
- The route tree in `Routing.tsx`: public routes, then auth guard → `CONSENT`, then auth guard → `ConsentGate` → `Layout`
- Sidebar footer: the motto and the Terms/Privacy links

**Out**

- Account export and delete (stage 9)

## 3. Files created and changed

| File                                                                | What                                                                                                              |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/features/legal/types.ts`                                       | `LEGAL_NAMESPACE`, `TERMS_VERSION = '2026-10-12'`, `UserDocument`, `Consent`, `hasAcceptedCurrentTerms`           |
| `src/features/legal/api.ts`                                         | `legalGetUserDocument` (realtime) and `legalAcceptTerms`                                                          |
| `src/features/legal/components/ConsentGate.tsx`                     | Redirects to `CONSENT` (remembering `from`) until the current version is accepted. Shows a load error with Retry. |
| `src/features/legal/components/ConsentPage.tsx`                     | Key points, links to the full texts (new tab), a checkbox, Accept, Sign out                                       |
| `src/features/legal/components/LegalDocument.tsx`, `LegalPage.tsx`  | `TermsPage` and `PrivacyPage`, rendered from `sections` arrays in the locale files                                |
| `src/features/legal/locales/*.json`                                 | Draft Terms (8 sections) and Privacy (8 sections) in 5 languages                                                  |
| `src/hoc/PublicLayout.tsx`                                          | Top bar with the name, language switcher and theme toggle, used for Login, Terms, Privacy and Consent             |
| `src/hoc/LanguageSwitcher.tsx`, `ThemeToggle.tsx`, `LegalLinks.tsx` | Pulled out of `Layout` so `Layout` and `PublicLayout` share them                                                  |
| `src/hoc/Layout.tsx`                                                | Uses the shared pieces. Sidebar footer: motto plus the Terms · Privacy links                                      |
| `src/hoc/Routing.tsx`                                               | New route tree (section 6)                                                                                        |
| `src/features/auth/components/LoginPage.tsx`                        | Fills the public layout. Terms · Privacy links                                                                    |
| `src/i18n/locales/*/common.json`                                    | `legalLinks.terms`, `legalLinks.privacy`                                                                          |

## 4. Data and endpoints touched

- `users/{uid}`: `consent: { termsVersion, acceptedAt }`, written with `setDocument(…, { merge: true })`, which keeps `createdAt` if the doc already exists.
- `legalGetUserDocument(uid)`: realtime with `subscribeToDocument`, so accepting in one tab unlocks the others.
- `legalAcceptTerms(uid)`

## 5. i18n keys added

- `legal` namespace (51 keys): `version`, `gate.*`, `consent.*` (including a `points` array), `terms.title`, `terms.sections[]`, `privacy.title`, `privacy.sections[]`
- `common`: `legalLinks.terms`, `legalLinks.privacy`

## 6. Implementation notes (as built)

- **Route tree:**
  - `PublicLayout`: `LOGIN`, `TERMS`, `PRIVACY`
  - `ProtectedRoute`:
    - `PublicLayout`: `CONSENT`
    - `ConsentGate` → `Layout`: the app routes
- **Consent page:**
  - It reads the same realtime user doc as the gate. If the terms are already accepted, it forwards to `from` (or `HOME`).
  - Accepting navigates back to where the user was going.
  - "Sign out" is the decline path.
- **Legal texts** are arrays of `{ title, body }` read with `returnObjects`. `body` supports line breaks (`white-space: pre-line`). The draft marker is a code comment in `LegalDocument.tsx`.
- **Re-consent:** raising `TERMS_VERSION` in `types.ts` sends every user back through the consent page.
- **Endpoint names** use the feature prefix (`legalGet…`, `legalAccept…`), the `prothext-facts` convention, because all features inject into one shared `api`.

## 7. Deviations from plan

- `getConsent` → `legalGetUserDocument`, and `acceptTerms` → `legalAcceptTerms`: the feature prefix avoids name clashes in the shared api (D-008).
- `consent.acceptedAt` is the device time (`Date.now()`), not a server timestamp. That keeps the typed helpers simple, and `updatedAt` already records the server time of the write (D-008).
- The language switcher and theme toggle became shared `hoc/` components, so both layouts use the same code.

## 8. Verification checklist

- [x] `yarn build`, `yarn lint`, Prettier: clean.
- [x] i18n parity: 0 missing keys (`common` 31, `auth` 3, `legal` 51).
- [x] Docs link check: 0 broken links.
- [ ] Rules deployed (`firebase deploy --only firestore:rules`). Without them the gate shows "Your account could not be loaded".
- [ ] A new user is sent to `/consent`. Accept stays disabled until the box is ticked. After accepting, they land in the app.
- [ ] A second tab unlocks by itself after accepting in the first.
- [ ] Raising `TERMS_VERSION` asks for consent again.
- [ ] `/terms` and `/privacy` open while signed out, in all 5 languages, with the language switcher and theme toggle.
- [ ] Sign out from the consent page returns to Login.
- [ ] At 375px the consent buttons stack and there's no horizontal scroll.

## 9. Open issues / follow-ups

- The legal copy is a draft and needs a legal review before any public launch.
- The Privacy "Contact" section names no address. Add a contact email when one is chosen.
