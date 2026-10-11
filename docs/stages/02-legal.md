# Stage 2: Legal

**Status:** ⬜ planned

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

`src/features/legal/**`, `src/hoc/{Routing,Layout,PublicLayout}.tsx`

## 4. Data and endpoints touched

- `users/{uid}`: `consent: { termsVersion, acceptedAt }`, written with `setDocument(…, { merge: true })`

## 5. i18n keys added

`legal` namespace: `terms.*`, `privacy.*`, `consent.*`

## 6. Implementation notes (as built)

_Filled in when the stage is done._

## 7. Deviations from plan

_None yet._

## 8. Verification checklist

- [ ] A new user is sent to `/consent`. After accepting, they reach the app.
- [ ] Raising `TERMS_VERSION` asks for consent again.
- [ ] `/terms` and `/privacy` open while signed out, in all 5 languages.
- [ ] The terms cover responsibility for data, no real names, the optional phone, Gemini for openers, and the AI brief being copied by the user.

## 9. Open issues / follow-ups

_None yet._
