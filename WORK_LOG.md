# Health Vault — Work Log

A running log of work performed, newest first. Each entry: date, area, what changed, and
any follow-ups. Keep entries short; detailed task tracking lives in `tasks.md`.

Areas: `mobile` · `web` · `supabase` · `design-system` · `infra`

---

## 2026-08-22 (compact completed Vault setup)

- **web** — Converted the dashboard's Vault setup checklist into an accessible accordion. Incomplete setup stays expanded with per-step status; completed setup defaults closed and shows `100%` in its summary, while remaining available for review.
- **infra** — MCP package typecheck, production build, and whitespace validation pass. Deployment and live ChatGPT verification remain pending.

## 2026-08-22 (editable Medical ID details)

- **web** — Added an authenticated Medical Profile editor for mailing address, blood type, current height, and current weight. Address remains private account data; blood type and measurements appear only in the expanded Medical ID card.
- **supabase** — Added nullable, range-checked `height_cm` and `weight_kg` columns to `patient_profiles`, using metric values as the canonical storage format while presenting feet/inches and pounds in the current US-facing UI.
- **infra** — Vite production build, root TypeScript check, and whitespace validation pass. The new database migration and Bolt publish remain pending.

## 2026-08-22 (task-specific ChatGPT widgets)

- **supabase + web** — Replaced diet writes that returned a full health dashboard per entry with a batch preview/save contract. A single confirmation card now saves all foods and drinks from one message once, then transforms into a seven-day Wellness summary.
- **web** — Added an appointment-prep brief card that renders visit details, user priorities, suggested questions, confirmed Health Vault context counts, and a direct authenticated-app handoff.
- **web + supabase** — Added an accessible Life Signal check-in card with five 1–5 sliders, an optional note, and one explicit Log action. Life Signal and legacy single-entry diet saves now return compact results rather than refreshing the health dashboard.
- **infra** — Vite production build, MCP package typecheck, embedded widget-script parsing, and whitespace validation pass. Deployment and live ChatGPT reconnection remain pending.

## 2026-08-22 (ChatGPT onboarding increment)

- **supabase + web** — Added a read-only `get_onboarding_status` MCP tool and compact five-stage onboarding card covering connection, secure profile, first health context, assistant preferences, and first snapshot. The card resumes from live Supabase state rather than inventing a parallel onboarding record.
- **web** — Added step-aware `?app=onboarding&step=...&source=chatgpt` handoffs for identity, insurance, and preferences. Sensitive identity and coverage entry stays in the authenticated web experience; unauthenticated deep links safely fall back to onboarding start.
- **infra** — Full Vite production build passes. MCP typecheck passes with `allowImportingTsExtensions`; the package's default typecheck remains blocked by a pre-existing `.ts` import in `appointment-prep.ts`.

## 2026-08-21 (ChatGPT app MVP)

- **supabase** — Added a two-step conversational appointment flow to `health-vault-mcp`: `preview_appointment` validates and displays future appointment details without writing, while `create_appointment` requires the confirmed payload and inserts through the authenticated user's RLS-scoped client. No service-role key is used. Deployed as function version 7; unauthenticated access remains blocked with 401.
- **supabase + web** — Dashboard readiness now treats a completed onboarding record as evidence that the required email and identity stages were completed, preventing legacy flag drift from showing false incomplete states.
- **supabase + web** — Extended the authenticated `health-vault-mcp` server with an Apps SDK dashboard resource. `get_health_summary` now returns an interactive Health Vault card with live counts, next appointment, and a PRD-aligned onboarding checklist; the card links to the full web app for edits.
- **supabase** — Added four read-only, RLS-scoped MCP tools: `list_conditions`, `list_medications`, `list_allergies`, and `list_health_records`. No mutation or service-role access was added.
- **infra** — Local MCP typecheck/build and full Vite production build pass. Deployed only `health-vault-mcp` as version 6 with its existing self-validated OAuth configuration (`verify_jwt: false`); public metadata responds and unauthenticated MCP requests correctly return 401. Authenticated ChatGPT widget verification remains pending.

---

## 2026-06-06 (session 4 — autonomous fixes)

- **supabase** — Fixed siloed insurance models. Created migration `20260606000001_backfill_insurance_policies_to_coverages.sql` that copies existing `insurance_policies` rows into `insurance_coverages` (find-or-create `insurance_providers` by name). Updated `OnboardingInsurancePage` to write directly to `insurance_coverages` going forward; still writes to `insurance_policies` (non-blocking) for backward compatibility / card image storage. Deploy migration: `npx supabase db push`.
- **web** — Fixed provider import to write `health_records`: after `importMedicalRecords` succeeds, a `health_records` entry (kind `specialist_report`, source `connected`) is created with an import summary, so the import appears on the Records page. Provider name passed through from the connection flow.
- **web** — Fixed onboarding Skip defaults: `OnboardingPreferencesPage.handleSkip` now writes a default `user_preferences` row (all prefs false, notifications true) before navigating, so downstream reads don't get null state. Skip button wired to `handleSkip`.
- **web** — Removed orphaned `RecordsAssistantPanel.tsx` (replaced with stub/deprecation notice — file permission prevented deletion). Fixed DICOM viewer button: instead of dead "Open in External Viewer" button, now shows a helpful message listing compatible viewers (OsiriX, RadiAnt, 3D Slicer) with a download link.
- **supabase** — Fixed record submission partial failures: `fileErrors[]` array now collected; response includes `filesFailed`, `fileErrors`, and `success: false` when any upload fails instead of silently succeeding.
- **web** — Wired onboarding assistant to real AI. `OnboardingAssistantPanel` upgraded from a static display to a full mini chat interface: shows suggested questions as clickable chips, maintains conversation history, calls `sendChatMessage` → Edge Function. All FAQ `alert()` stubs across 5 onboarding pages converted to `suggestedQuestions` arrays.

---

## 2026-06-06 (session 3 — autonomous fixes)

- **web** — Fixed insurance page: member ID now displays from `member_id_hash`; `verificationStatus: 'verified'` added to schema + StatusBadge (was `'connected'` — mismatched AI tool); `handleRefreshVerification` aligned to set `'verified'`; "+ Add Coverage" header button and info banner added (directs to AI assistant); `onEdit` wired to coverage cards.
- **web** — Fixed pharmacy query bug: `fetchNearbyPharmacies` was `.eq('id', userId)` on `user_profiles` — corrected to `.eq('user_id', effectiveUserId)`. Pharmacies query also uses `effectiveUserId`. Both resolve via `resolveUserId()` which throws if unauthenticated.
- **web** — Fixed Care page: hardcoded/fabricated AI contextual insights replaced with neutral real message. Search input no longer clears on blur (only collapses if empty). Share Link button now copies the current URL to clipboard. `openAddProvider` in `actionsRef` no longer throws (wired as noop with comment).
- **web** — Fixed auth and profile settings: LoginPage title changed from "Admin Login" → "Sign In"; inline signup now routes to onboarding (preventing email-verification bypass). ProfileSettingsDrawer: "Verified Account" badge gated on `email_verified` field from DB. Notification toggles + regional settings (language/timezone) now load from `user_preferences` and save on form submit. Change Password button wired to `supabase.auth.updateUser()` with inline form.
- **web** — Fixed onboarding optimistic navigation: `OnboardingCompletePage` now tracks `completionError` state. If the `onboarding_complete` DB write fails, the "Go to Dashboard" button is replaced with an error message + Retry button. Users can no longer reach the dashboard without a confirmed DB write.

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
## 2026-08-27

- **admin foundation** — Added a separately buildable `apps/admin` workspace with fail-closed Supabase authentication, product-scoped role checks, GPT App navigation, a reserved SaaS Cloud boundary, and an isolated Provider Operations area. Added shared `admin-contracts`, `analytics-contracts`, and `provider-contracts` packages plus the initial product registry/admin-role migration. No administrator is granted automatically.
- **GPT analytics slice** — Added service-only versioned analytics event storage, role-aware metric snapshot access, and a deterministic GPT App Insights fixture. Built accessible metric cards, usage trend, task outcome, intent ranking, and quality-attention visualizations with explicit synthetic-data labeling and table alternatives.
- **GPT admin narratives** — Built synthetic, evidence-oriented narratives for Users, Interactions, Capabilities, Unmet Needs, and Weekly Briefs. Added activation funnel/cohorts, failure ranking, capability health table, opportunity clusters, and fact/interpretation/recommendation separation.
