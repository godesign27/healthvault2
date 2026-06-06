# Health Vault — Work Log

A running log of work performed, newest first. Each entry: date, area, what changed, and
any follow-ups. Keep entries short; detailed task tracking lives in `tasks.md`.

Areas: `mobile` · `web` · `supabase` · `design-system` · `infra`

---

## 2026-06-05 (session 2 — autonomous fixes)

- **web + supabase** — Fixed all hardcoded demo UUIDs (`00000000-0000-0000-0000-000000000000`, `demo-patient-1`) across the codebase. Key files: `AIAssistantPanel.tsx` (4 handlers), `ProvidersTab.tsx`, `AddProviderDrawer.tsx`, `AddPharmacyDrawer.tsx`, `PharmaciesTab.tsx`, `MedicalFormsPage.tsx`, `ProviderRecordConnectionFlow.tsx`, `network/api.ts`, `ai-tools/types.ts`, `record-request` Edge Function. All components now use `supabase.auth.getSession()` / `supabase.auth.getUser()` to resolve the authenticated user.
- **web** — Fixed DB schema column name mismatches: `MedicalProfilePage.tsx` now maps snake_case DB rows → camelCase before rendering (conditions `diagnosed_on`/`managing_physician`, medications `prescribed_by`/`start_date`, immunizations `vaccine`/`administered_on`). `MedicalIDCard.tsx` fixed photo column (`profile_image_url` → `profile_photo_url`). `profile-data.ts` reads/writes flat address columns (`address_line1`, `city`, `state`, `postal_code`) matching onboarding schema. `ai-tools/medical-history.ts` fixed immunization fields (`vaccine`, `administered_on`).
- **web** — Consolidated dual AI assistant backends. Removed dangerous browser-side OpenAI path (`src/api/assistant/run.ts` — `dangerouslyAllowBrowser: true`, API key in client). `AIAssistantPanel` now routes all messages through the authenticated Edge Function via `sendChatMessage`. Added `conversationHistory` state for multi-turn context. Mock medication refill and appointment flows replaced with honest "not yet supported" messages. `src/api/assistant/run.ts` and `src/lib/openai/tools.ts` marked `@deprecated` + `@ts-nocheck`.
- **web** — Reconciled tool registries. Edge Function (26 tools) is now the sole source of truth. Updated `docs/ai-assistant/tools-registry.md` with architecture note, implementation table, and gap list for future capabilities (getMedicalID, getPreventiveCare, appointments, encounters, EHR connection tools).
- **web** — Fixed onboarding OTP: changed 8-digit slots → 6 (matching Supabase default). Fixed resend inconsistency. After successful verification, now writes `email_verified: true` to `user_profiles`.
- **web + supabase** — Built Add Medication, Add Allergy, Add Immunization features. Created 3 Deno Edge Functions (`add-medication`, `add-allergy`, `add-immunization`) following the add-condition pattern. Wired `MedicalProfilePage.tsx` with `assistantTaskId` state and "Add" buttons per section. Fixed `AssistantDrawer.tsx` to send user access token instead of anon key. Fixed medications render bug (snake_case `prescribed_by`/`start_date` → camelCase `prescribedBy`/`startDate`).
- **supabase** — Fixed share function: replaced placeholder PDF with real HTML document generated from `form_responses` data. Patient DOB now fetched from `user_profiles` (was hardcoded `1985-06-22`). Added ownership check to revoke endpoint (verifies `patient_id === user.id`). Added share_token validation to opened endpoint.
- **infra** — To deploy the 3 new Edge Functions: `npx supabase functions deploy add-medication && npx supabase functions deploy add-allergy && npx supabase functions deploy add-immunization`

---

## 2026-06-05 (session 1 — audit + docs)

- **infra** — Created project docs: `tasks.md`, `WORK_LOG.md`, `TECH_STACK.md`,
  `AGENT_INSTRUCTIONS.md`. Documented the web app's OpenAI AI assistant
  (  `ai-health-assistant` Edge Function + `src/lib/openai/`) in `TECH_STACK.md` and
  `AGENT_INSTRUCTIONS.md`. Expanded `tasks.md` with a Desktop/Web section: AI assistant
  knowledge/task-coverage catalog, realtime voice, Keragon EHR integration, and a full
  product-flow audit checklist.
- **web (audit)** — Ran a 4-part read-only audit of the web app (records/sharing, forms/
  insurance/profile, dashboard/care/network, onboarding/auth/assistant). Consolidated all
  findings into `tasks.md` §8 (per-feature gaps + cross-cutting issues) and §5a/§5b (assistant
  architecture + capability gaps). Key cross-cutting themes: hardcoded demo user IDs in real
  write paths, anon key used instead of user JWT, Edge Function ↔ DB schema mismatches
  (`provider_name`/`ehr_source`/`keragon`), siloed `insurance_policies` vs `insurance_coverages`,
  and two divergent AI assistant backends.
- **web** — Diagnosed `ERR_CONNECTION_REFUSED` on `localhost:5173`: Vite dev server wasn't
  running; started it. Also identified that Vite binds to IPv6 loopback `[::1]` only, so
  `127.0.0.1` is refused while `localhost` works (no config change made — using `localhost`).

## 2026-05-13

- **mobile/supabase** — Auth persistence moved from `expo-secure-store` → AsyncStorage to fix
  iOS "value larger than 2048 bytes" warning (Supabase session JSON too large for Keychain).
  Ran `pod install` (linked `RNCAsyncStorage 1.23.1`).
  _Follow-up:_ native dev client must be rebuilt (`npx expo run:ios`) — see `tasks.md` §1.
- **supabase** — Fixed `providers` Edge Function: it selected `provider_name`, a column that
  doesn't exist on `provider_connections`. Now joins `provider_organizations(name)` for the
  display name and uses `revoked` (not invalid `inactive`) on DELETE.
  _Follow-up:_ not yet deployed.
- **mobile** — Fixed Medical Profile icons (invalid `needle-outline` → `shield-checkmark-outline`).
- **mobile** — Fixed Network/pending render crash (restored undefined `showPendingSection`).
- **mobile** — Step 3: wired Care screen to live Supabase data via `useMedications`,
  `useCareStats`, `useProviders`.
- **mobile** — Step 2: wired Medical ID card + Pending record requests (`useProfile`,
  `usePendingRequests`).
- **mobile** — Built Medical Profile + Insurance screens from desktop equivalents.

## 2026-05-12 → 05-13

- **mobile** — Step 1: wired Dashboard stats + Records list to Supabase (`useVaultStats`,
  `useRecords`, shared `src/lib/api.js` calling Edge Functions).
- **mobile** — Wired Supabase Auth (login screen, session management, sign out); branded the
  login screen with Health Vault logo + gradient.
- **mobile** — Built Care, Network, Records, and Medical Forms screens matching desktop.
- **mobile** — Stood up the Expo + NativeWind + Expo Router shell; resolved native build
  issues (safe-area-context pinning, react-native version mismatch, expo-router root
  resolution) to get the app launching on the iOS simulator.

## 2026-05-10 → 05-11

- **web** — Imported the `healthvault2` repo and got the authenticated web app running locally
  against Supabase (project `bolt-native-database-59699130`, ref `sgwekxjlvadvdosyudgj`).
- **design-system** — Token refactor (kept `--hv-*` prefix), design system gallery pages, and
  a surface-theme switcher (Default + Bold).
- **design-system** — Built the **Steel** surface theme (frosted-glass, indigo/teal radial
  wash, glassmorphic cards, light + dark) and made it the default theme for all users.
  Refined dark mode, card opacity tokens, side-nav active states, and pill buttons — all at
  the surface-token level (no hardcoding).

---

_Older history predates this log. See git history and the chat transcript for details._
