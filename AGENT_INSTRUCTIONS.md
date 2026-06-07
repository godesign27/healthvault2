# Agent Instructions — Health Vault

Orientation for AI agents working in this repo. Read this first, then `TECH_STACK.md` for
details, `tasks.md` for outstanding work, and `WORK_LOG.md` for recent history.

---

## What this project is

Health Vault is an **AI-powered personal health records** platform: a patient stores medical
records, medications, providers, insurance, and a medical profile, and an AI assistant helps
them. There are two clients sharing one Supabase backend:

- **Web app** — root `src/` (Vite + React 18 + Tailwind). The authenticated product + a
  large design-system gallery + a marketing site.
- **Mobile app** — `apps/mobile/` (Expo SDK 51 + React Native + NativeWind). iOS-first;
  mirrors the desktop screens.

It is an **npm-workspaces monorepo**. Shared code lives in `packages/*`. Backend logic lives
in `supabase/functions/` (Deno Edge Functions).

## Golden rules

1. **Do not edit the marketing site** when asked to change "the app" — the user has
   explicitly separated these. The authenticated app is the target.
2. **Respect the design-token strategy.** Never hardcode colors/spacing. Use the `--hv-*`
   surface tokens so theme switching (Default / Bold / **Steel** = default) keeps working.
   If only some components change when a token changes, the components aren't token-driven —
   fix them rather than hardcoding.
3. **Keep web and mobile in sync.** When building a mobile screen, reference the desktop
   equivalent in `src/pages/*` and `src/components/*` and include all of its features/flows.
4. **Only commit when explicitly asked.** Lots of mobile work is currently uncommitted.
5. **Update the docs as you work:** add a `WORK_LOG.md` entry and tick/append `tasks.md`.

## Repo map (where things live)

- Web pages: `src/pages/*Page.tsx` · web components: `src/components/`
- Mobile screens: `apps/mobile/src/screens/*.js`
- Mobile routes/nav: `apps/mobile/app/` (Expo Router; file-based)
- Mobile data hooks: `apps/mobile/src/hooks/use*.js`
- Mobile data layer: `apps/mobile/src/lib/api.js` (Edge Functions),
  `apps/mobile/src/lib/supabase.js` (client + AsyncStorage session)
- Backend: `supabase/functions/<name>/index.ts`
- Shared: `packages/{types,api-client,auth,config}`
- Feature docs: `docs/ai-assistant/`, plus various `*_GUIDE.md` at root

## Running things

- **Web:** from repo root → `npm run dev` → `http://localhost:5173`
  (use `localhost`, not `127.0.0.1` — Vite binds IPv6 loopback only).
- **Mobile (Metro):** from `apps/mobile` → `npm start`
  (or `npm run mobile` from repo root). **Not** `npx expo start --ios`.
- **Mobile (native build):** from `apps/mobile` → `npx expo run:ios`.
  Required after adding/removing any native dependency, or you'll hit
  `NativeModule ... is null` / "main has not been registered".
- The user runs commands from varied folders and is newer to RN tooling — give exact,
  copy-pasteable commands and state which directory to run them in.

## Mobile gotchas (learned the hard way)

- **Expo Go won't work** — custom native modules need a **dev client** on SDK 51+.
- **Pin versions for SDK 51:** `react-native@0.74.x`, `react-native-safe-area-context@4.10.1`.
  Mismatches cause cryptic Metro/`as`-syntax or `RNCSafeAreaProvider` errors.
- **Session storage:** use **AsyncStorage**, not SecureStore (Supabase session JSON exceeds
  the iOS Keychain's ~2048-byte practical limit).
- **NativeWind/worklets:** `scripts/patch-react-native-css-interop.cjs` runs on install and
  pre-start to keep bundling working on Reanimated 3 / Expo 51. Don't remove it.
- **Icons:** only valid Ionicons names work with `@expo/vector-icons` (e.g. no `needle-outline`).
- **Run from `apps/mobile`**, not `apps/mobile/app` (the `app/` folder has no `package.json`).

## AI Assistant (OpenAI) — web/desktop

The authenticated web app has an **OpenAI-powered assistant** that helps users with forms,
records, insurance, and their care network, and can read/write health data via validated
tools. Treat `docs/ai-assistant/` as the source of truth before changing anything here.

- **Where it lives:** Edge Function `supabase/functions/ai-health-assistant/`
  (`index.ts`, `tools.ts`, `system-prompt.ts`, `types.ts`, `logger.ts`); frontend client
  `src/lib/openai/`; UI `AIAssistantPanel`.
- **How it works:** OpenAI Chat Completions (`gpt-4o-mini`) with function calling; the
  function loops tool calls (max 5 rounds) against Supabase, scoped to the authed `userId`.
  Page context for the current screen is passed in so answers stay relevant.
- **Rules to honor:** never put the OpenAI key in the client (server-side env only); never
  let the assistant fabricate data or tool results; mutations (save/share) require explicit
  user confirmation; no diagnoses or clinical advice. New data capabilities should be added
  as **tools** in `tools.ts`, not by hardcoding.
- **Mobile:** `apps/mobile/src/components/assistant/AssistantSheet.tsx` exists but is **not**
  wired to this backend yet — a future task is to point it at `ai-health-assistant`.

## Backend / Supabase

- Project ref: **`sgwekxjlvadvdosyudgj`**. Auth is required; functions expect
  `Authorization: Bearer <token>` + `apikey` headers.
- Mobile reads data two ways: Edge Functions (`src/lib/api.js`) and direct PostgREST
  (`src/lib/supabase.js`). Match the existing pattern for the screen you're touching.
- **Schema truth:** check the actual columns before querying. Example bugs we've fixed:
  - `providers` function selected nonexistent `provider_name` on `provider_connections`
    (use join to `provider_organizations.name`).
  - `form_responses` uses `answers_json` and `signed_at` (not `answers` / `completed_at`).
  - `health_records.kind` is constrained to `lab|imaging|pathology|specialist_report|other`.
  - `medications.prescribed_by` (not `prescriber` in DB).
- **`form_templates` must be seeded** before users can save responses (FK on `template_id`).
  Catalog metadata also lives in `src/lib/forms/catalog.ts`.
- Deploy functions with `npx supabase functions deploy <name>` (needs `login` + `link`).
  Deploying does **not** require pushing to GitHub first.

## User experience — intended behaviors

These are product decisions agents should preserve unless the user explicitly changes them.
When implementing a feature, match these behaviors — don't regress to mocks, stubs, or
hardcoded demo data.

### Medical Forms

- **Autopopulate from real data.** When a user opens any form, pre-fill fields from profile
  and clinical data we already have (`user_profiles`, `patient_profiles`, `medications`,
  `allergies`, `conditions`, `immunizations`, `insurance_coverages`, `providers`,
  `pharmacies`). Implementation: `src/lib/forms/autopopulate.ts`.
- **Saved answers always win.** If the user has saved a `form_responses` row, those values
  override autofill for that field. Never wipe saved data with autofill on Save.
- **Incomplete until Save.** Autofill is a convenience for viewing/editing — a form is
  **Complete** only after the user saves (upsert to `form_responses`). Do not mark forms
  complete just because fields look filled.
- **No hardcoded demo patient data.** Do not embed fake names, addresses, or clinical values
  in form components. Structure lives in `src/lib/forms/catalog.ts`; values live in Supabase.
- **Share uses real response UUIDs.** The share flow must pass `form_responses.id` (UUID), not
  template slugs. The `share` Edge Function fetches `answers_json` by those IDs to build PDFs.
- **Form schema gotcha:** `form_responses.patient_id` references `patient_profiles(id)`, not
  `auth.uid()`. RLS must validate ownership via `patient_profiles.user_id`. See migration
  `20260607000001_seed_form_templates_and_fix_form_responses.sql`.

### Insurance

- **Single source of truth:** `insurance_coverages` (+ `insurance_providers` FK). Onboarding
  and the Insurance page read/write here. `insurance_policies` is legacy/backward-compat for
  card images only.
- **Member ID display:** `member_id_hash` stores the display value (not a hash in practice).
- **Verification status:** `'verified'` and `'connected'` are both valid; AI tool may set
  `'verified'`.

### Onboarding

- **Skip writes defaults.** Preferences skip must upsert a `user_preferences` row (four
  `help_with_*` columns only — no `email_notifications`/`push_notifications`; those columns
  don't exist).
- **Onboarding assistant:** Real mini-chat via `sendChatMessage` → `ai-health-assistant`, with
  `suggestedQuestions` chips — not `alert()` FAQ stubs.
- **Insurance step:** Writes to `insurance_coverages` with find-or-create provider.

### Health Records & imports

- **Provider import visibility:** After importing medical profile data, also insert a summary
  `health_records` row so the import appears on the Records page.
- **Vault stats:** Dashboard and Health Records use the `vault-stats` Edge Function for
  connected providers and last sync — no hardcoded counts.
- **AI insights:** Document viewer calls `analyze-record` with the user's JWT.
- **Record-request portal links:** Must include `?token=` (`secure_token`).

### Secure share

- **Revoke requires ownership:** Only the patient who created the share can revoke (JWT +
  `patient_id === user.id`).
- **Recipient view validates token** on GET and `opened` endpoints.
- **Partial upload failures:** `record-request` submit returns `filesFailed` / `fileErrors[]`
  — never silently succeed on partial failure.

### Dashboard & activity

- **Real data only** for stat cards, recent activity, and quick actions. Activity feed pulls
  from `health_records`, `health_record_requests`, and `medications`.
- **Quick actions navigate** to real routes or open the AI assistant — no dead-end buttons.

### AI Assistant

- **Edge Function is sole backend** for chat (`sendChatMessage` → `ai-health-assistant`). No
  browser-side OpenAI with `dangerouslyAllowBrowser`.
- **Authenticated calls use user JWT**, not the anon key, for mutations and user-scoped reads.
- **Mutations require confirmation UX** (still pending for destructive tool calls).
- **Don't fabricate** clinical data or tool results. Say honestly when a capability isn't
  built yet.

### Auth & profile

- Every user should have exactly one `patient_profiles` row (backfill + sync trigger on
  `user_profiles`). Needed for forms, dashboard counts, etc.
- Login page is "Sign In"; signup routes through onboarding, not inline `signUp`.

### What NOT to do (common regressions)

- Reintroduce mock form lists, fake completion counts, or demo UUIDs in write paths.
- Remove autofill — users expect forms to pre-populate from data they've already entered.
- Write onboarding insurance only to `insurance_policies`.
- Send anon key instead of session token on authenticated Edge Function / RLS calls.
- Assume `form_responses.patient_id = auth.uid()` — it doesn't; use `patient_profiles.id`.

---

## Working style the user expects

- Always check for bugs and test changes; don't introduce regressions.
- Take big changes **incrementally** so breakages are easy to localize.
- Be explicit and beginner-friendly with terminal/simulator steps.
- Prefer surface-token/design-system solutions over one-off fixes.

---

_Last updated: 2026-06-07_
