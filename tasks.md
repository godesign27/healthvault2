# Health Vault — Tasks

Outstanding work for both clients:
- **Mobile app** — `apps/mobile/` (Expo + React Native)
- **Desktop / web app** — root `src/` (Vite + React)

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

# ChatGPT App MVP

- [x] OAuth installation and authenticated, user-scoped `get_health_summary` tool.
- [x] Interactive dashboard widget with live summary, three-item detail previews with View More controls, profile photo, privacy-gated Medical ID, next appointment, and onboarding checklist.
- [x] Read-only detail tools for conditions, medications, allergies, and recent records.
- [x] Two-step conversational appointment creation with preview, explicit confirmation, authenticated RLS insert, and future-date validation.
- [x] `health-vault-mcp` version 8 deployed; authenticated dashboard and appointment preview/create flow verified in ChatGPT.
- [x] Appointment creation returns a refreshed dashboard widget automatically after confirmation.
- [x] GPT-originated new-user signup preserves the pending OAuth request, runs full onboarding, and returns to consent.
- [x] Added a resumable five-stage ChatGPT onboarding/status tool and compact card. Secure identity, insurance, and preference steps hand off to the existing web onboarding flow; health context remains confirmation-gated in chat.
- [x] Added task-specific ChatGPT widgets for appointment-prep briefs, slider-based Life Signal check-ins, and a single batch diet confirmation that becomes a seven-day Wellness summary after saving.
- [x] Added authenticated Medical Profile editing for address, blood type, current height, and current weight; sensitive address data remains off the Medical ID summary card.
- [x] Reduced dashboard cognitive load with a Vault setup accordion: incomplete setup is expanded by default, while complete setup is collapsed with a visible `100%` summary.
- [x] Patient Registration ChatGPT interview now persists each accepted answer in one authoritative session, updates a single interview widget, groups related questions, and shows Confirm & Save plus a secure-share offer without auto-saving. Deploy `health-vault-mcp` to verify in ChatGPT.
- [~] Apply `20260822160000_add_height_weight_to_patient_profiles.sql`, publish the web build, and verify Medical ID editing against the hosted profile.
- [~] Validate the task-specific widgets after deploying `health-vault-mcp`: confirm one diet card for multi-meal input, one batch save, a rendered appointment brief, and a five-slider Life Signal save.
- [~] Authenticated dashboard deep link and marketing profile navigation are implemented locally; publish the web build through Bolt and test signed-in/signed-out routes.
- [ ] Add confirmed conversational writes for conditions, medications, and allergies.
- [ ] Add secure health-record file upload; metadata-only record creation is not sufficient for the MVP.
- [ ] Add a GPT provider-sharing flow: choose specific categories/records, preview exactly what will be disclosed, require explicit confirmation, create a time-limited secure link, and support audit history plus revocation. Never expose raw share tokens in chat.
- [ ] Add a clinician-facing presentation mode for in-person visits with a user-controlled Medical ID reveal, clear privacy warning, large readable layout, and an automatic re-hide timeout.
- [ ] Test RLS isolation with a second Health Vault account before broader distribution.
- [~] Add first-run empty states and guided deep links for users who have not completed Health Vault onboarding. The five-stage status card and step-specific web handoffs are implemented locally; deployment and a first-account test remain.
- [ ] Audit Edge Functions for asymmetric JWT verification, rotate the Supabase signing key, then re-enable OIDC in the ChatGPT app.

---

# Mobile App

## 0. Current state (read first)

The Expo app is currently **stripped down to a static logo screen** to isolate a native
startup crash. The real screens and data hooks exist and are wired, but they are **not
mounted** in the running app right now:

- `app/index.tsx` renders only the Health Vault logo.
- Navigation + auth routes are **disabled**: folders are named `app/_tabs_disabled/` and
  `app/_auth_disabled/` so Expo Router ignores them.
- All real screens live in `src/screens/`; data hooks live in `src/hooks/`.

---

## 1. Unblock & get the app running again (highest priority)

- [ ] **Rebuild the iOS dev client** after the AsyncStorage migration.
      From `apps/mobile`: `npx expo run:ios`.
      (Pods are installed — `RNCAsyncStorage 1.23.1` is linked — but the binary predates the
      dependency, so it currently fails with `NativeModule: AsyncStorage is null` /
      "main has not been registered".)
- [ ] **Deploy the `providers` Edge Function** (fix is in repo, not deployed):
      `npx supabase login` → `npx supabase link --project-ref sgwekxjlvadvdosyudgj` →
      `npx supabase functions deploy providers`.
- [ ] **Re-enable the app shell**: rename `app/_tabs_disabled/` → `app/(tabs)/` and
      `app/_auth_disabled/` → `app/auth/`, and restore `app/_layout.tsx` / `app/index.tsx`
      to mount the auth gate + tab navigator so the wired screens actually render.
- [ ] Smoke-test every tab end-to-end on the simulator after re-enabling.

## 2. Finish data wiring (screens still on mock data)

- [ ] **Medical Forms screen** (`src/screens/MedicalScreen.js`) — still fully mock
      (`mockStats`, `mockFormGroupsSeed`, `mockSharedEventsSeed`, `mockMedicalIDData`).
      Wire to Supabase + real share flow.
- [ ] **Insurance screen** (`src/screens/InsuranceScreen.js`) — still static/mock; wire to
      Supabase insurance data.
- [ ] **Records screen** (`src/screens/RecordsScreen.js`) — records list is wired via
      `useRecords`, but the provider filter still uses `MOCK_PROVIDERS`; wire to real providers.
- [ ] **Network screen** — verify `useProviders` directory results once the `providers`
      function is deployed (depends on Task 1).

### Already wired (verify, don't rebuild)
- [x] Dashboard stats + Records list (`useVaultStats`, `useRecords`)
- [x] Medical ID card + Pending requests (`useProfile`, `usePendingRequests`)
- [x] Care screen (`useMedications`, `useCareStats`, `useProviders`)
- [x] Medical Profile screen (direct Supabase reads)
- [x] Supabase Auth (login, session, sign out)

## 3. Feature work

- [ ] **AI Assistant** — `src/components/assistant/AssistantSheet.tsx` exists but is not
      wired to OpenAI / voice like the desktop assistant.
- [ ] **Biometric / PIN lock** — `app/_auth_disabled/pin.tsx` exists (uses
      `expo-local-authentication`); enable it as an app lock.
- [ ] **Profile settings actions** — confirm save/update flows write back to Supabase.

## 4. Polish & release prep

- [ ] Replace placeholder `assets/icon.png` and `assets/splash.png` with production artwork.
- [ ] Consistent loading / empty / error states across all screens.
- [ ] Test on a physical iOS device (not just simulator).
- [ ] Android pass (`npm run android`) — currently iOS-first.
- [ ] **Commit the mobile work to Git** — `apps/mobile/`, the `providers` Edge Function,
      and root config changes are still untracked/uncommitted.

---

# Desktop / Web App

## 5. AI Assistant — knowledge & task coverage (high priority)

The OpenAI assistant (`ai-health-assistant` Edge Function + `src/lib/openai/`) currently
**doesn't have enough knowledge to answer user questions well or reliably complete tasks.**
We need to systematically define what users will ask/do and make sure the assistant can
handle all of it.

- [ ] **Build an extensive catalog of user questions & tasks** — enumerate the real questions
      users will ask and the actions they'll want performed, per product feature (dashboard,
      health records, medical forms, insurance, medical profile, care, network, vitals,
      onboarding, sharing). This becomes the assistant's coverage spec / test set.
- [ ] **Map each catalog item to assistant capability** — for every question/task, confirm
      there is either (a) enough context in the system prompt / page context, or (b) a tool
      in `tools.ts` that performs it. Flag everything with no path as a gap.
- [ ] **Close the knowledge gaps** — expand the system prompt / page context
      (`system-prompt.ts`, `src/lib/openai/context.ts`) and add/extend tools in `tools.ts`
      so the assistant can answer and act on the full catalog.
- [ ] **Create an eval / regression set** from the catalog to verify answers and tool calls
      (and to catch regressions as we change prompts/tools).
- [ ] Tune model/config if needed (currently `gpt-4o-mini`, `tool_choice: auto`, 5 rounds).

### 5a. Assistant architecture problems found in the audit (fix first)

- [x] **Two parallel assistant backends consolidated** — Fixed 2026-06-05: browser-side OpenAI path removed (`dangerouslyAllowBrowser` gone, `src/api/assistant/run.ts` + `src/lib/openai/tools.ts` deprecated). `AIAssistantPanel` now uses `sendChatMessage` → Edge Function exclusively. Conversation history tracked via `conversationHistory` state.
- [x] **Tool registries reconciled** — Fixed 2026-06-05: Edge Function is sole source of truth. `tools-registry.md` updated with architecture note + capability gap table.
- [x] **Demo UUID in assistant mutations** — Fixed 2026-06-05 (see §8.0).
- [x] **Tool ↔ DB schema mismatches** — Fixed 2026-06-05: `getMedicalHistory` corrected (`diagnosed_on`, `vaccine`, `administered_on`). See also §8.0 address fix.
- [ ] **Add explicit confirmation UX** for destructive LLM tool calls.
- [x] **`handleFormFillingRequest`** — Wired 2026-06-07: Fill Form quick action + typed intent pre-fill incomplete forms via `autopopulate` + `saveFormResponse` (incomplete).
- [x] **Mock medication-refill and appointment flows** — Replaced 2026-06-05 with honest "not yet supported" messages.

### 5b. Known assistant capability gaps (build tools / knowledge)

Users will ask for these but the assistant currently cannot do them reliably:
- [x] Share a completed form with a provider — Fixed 2026-06-07: `shareForm` tool payload aligned with `share` Edge Function (`forms[]` + `recipient.method`, not `formResponseIds`).
- [x] Update profile via chat (e.g. "change my phone") — Fixed 2026-06-07: `updateMedicalProfile` Edge tool expanded (address + emergency contact); UI refreshes after successful tool via `toolEvents`.
- [ ] Submit a medication refill to a pharmacy (no refill-submit tool).
- [ ] Book / cancel an appointment (`getAppointments` is read-only; no create/cancel tool).
- [ ] Upload a new health record via chat (no upload tool).
- [ ] View/edit onboarding preferences and onboarding `insurance_policies` (tools query
      `insurance_coverages` only).
- [ ] Real in-network provider search against a payer directory (current tool searches the
      user's *saved* providers only).
- [ ] Add a pharmacy by name (`setPreferredPharmacy` requires an existing `pharmacyId`).
- [ ] Vitals questions (Vitals is a "Coming Soon" stub).

## 6. Realtime voice assistant

- [ ] Wire the **OpenAI Realtime API** for voice (per `docs/ai-assistant/realtime-readiness.md`):
      WebSocket connection, audio in/out pipeline, streaming tool execution reusing the
      existing tool handlers, and session management for persistent voice conversations.
      (Related functions already exist: `transcribe-audio`, `elevenlabs-tts`.)

## 7. EHR integration — DIY first (Keragon optional fallback)

**Decision (2026-06-07):** Build EHR connect ourselves using the existing DIY architecture. Keragon remains an optional fallback if DIY blockers emerge (see §8.7 reference).

- [ ] **Phase A — Foundation** (§8.7): connections UI, fix `fetchInsuranceContext` user ID, unify on `direct_provider_connection` / `epic_connection` (not Keragon-only paths in `vault-stats`).
- [ ] **Phase B — Pilot FHIR:** SMART on FHIR OAuth + sync for one sandbox or partner org via `provider_organizations.fhir_endpoint_url`.
  - [x] Edge functions: `fhir-oauth-start`, `fhir-oauth-callback`, `fhir-sync` (PKCE + live FHIR fetch)
  - [x] Pilot org seeded: **SMART Health IT Sandbox (Pilot)** in migration `20260608000001`
  - [x] Client: OAuth redirect in connect flow, `/connect/fhir/complete` page, live preview via `fetchProviderRecordPreview` → `fhir-sync`
  - [ ] **Deploy + secrets:** set `FHIR_CLIENT_ID` (+ optional `FHIR_CLIENT_SECRET`, `APP_URL`, `FHIR_REDIRECT_URI`) and run migration
- [ ] **Phase C — Scale:** add orgs to `provider_organizations` as partnerships land; keep manual record request as permanent fallback.
- [ ] Keragon fallback (only if needed): wire `KERAGON_WEBHOOK_URL` in `providers` Edge Function; document in README.

## 8. Product audit — findings & gaps

Audit completed 2026-06-05 across all features (web app `src/` + Edge Functions). Findings
below are concrete gaps to fix. Many flows render but read mock data or write to the wrong
user. Citations are `file:line` at time of audit.

### 8.0 Cross-cutting (highest priority — affects many features)

- [x] **Hardcoded demo user IDs in real write paths.** Fixed 2026-06-05: all write paths now use `session.user.id`. `AIAssistantPanel` uses `currentUserId` state from auth. Network components pass no userId (store resolves from session). `network/api.ts` resolves via `resolveUserId()` which throws if unauthenticated. `MedicalFormsPage` uses `currentPatient` state from auth. `record-request` Edge Function returns 401 if no userId.
- [x] **Anon key sent instead of user JWT** — Fixed 2026-06-06: `RecordRequestDetailDrawer`
      refresh/files/delete now use the authenticated `supabase` client; share revoke
      (`MedicalFormsPage`) and `welcome-email` (`OnboardingCompletePage`) now send
      `session.access_token`. `AssistantDrawer` already sent the user token.
- [x] **Edge Function ↔ DB schema mismatches** — Resolved 2026-06-06. Live schema is healthier
      than the audit implied: `connection_method` is a plain `text` column (so `"keragon"` is
      valid), `ehr_source` **exists**, and `provider_organization_id` is **nullable** — so
      `providers` POST and `vault-stats` are schema-safe (re-deployed `providers` v3). The only
      real bug was `sync-status` selecting nonexistent `provider_name` → fixed to join
      `provider_organizations(name)` and re-deployed (v3).
- [x] **Two siloed insurance models** — Fixed 2026-06-06: migration `20260606000001` backfills existing `insurance_policies` → `insurance_coverages`; `OnboardingInsurancePage` now writes directly to `insurance_coverages`. Run `npx supabase db push` to apply migration.
- [x] **`MedicalIDCard` photo column bug** — Fixed 2026-06-05: column corrected to `profile_photo_url`.
- [x] **Address schema mismatch** — Fixed 2026-06-05: `profile-data.ts` now reads flat `address_line1`/`city`/`state`/`postal_code` columns (with JSON fallback) and writes flat columns matching onboarding.

### 8.1 Dashboard

- [x] Recent Activity feed — Fixed 2026-06-06: built from real data (recent `health_records`,
      received `health_record_requests`, recent `medications`), sorted by time with relative
      timestamps + empty state. "View All Activity" now navigates to Health Records.
- [x] Quick Actions — Fixed 2026-06-06: "View Medical Forms" → forms page, "View Care History"
      → care page, third action → opens the AI Assistant (scheduling not yet supported, so the
      misleading "Schedule Appointment" dead-end was removed).
- [x] Medical Forms stat card — Fixed 2026-06-06: shows real completed `form_responses` count
      (resolved via `patient_profiles.id`).
- [x] Connected providers / last sync — Fixed 2026-06-06: Health Records stat subtitle now wires
      to `vault-stats` (connected count + last-synced).

### 8.2 Health Records

- [x] Vault stats partly fake — Fixed 2026-06-06: `HealthRecordsPage` now fetches `vault-stats`
      for connected providers + last synced (no more hardcoded `connectedProviders: 3` / today).
- [ ] Patient record **upload** is an in-memory stub, lost on refresh (`query.ts:105-122`);
      build real upload → storage + `health_records` insert. **(Deferred — needs a file-bearing
      upload UI + storage; current `uploadRecord` only receives metadata. Feature build.)**
- [x] "Generate AI Insights" — Fixed 2026-06-06: `DocumentViewer` insights tab calls
      `analyze-record` with the user JWT and renders the returned summary (with loading/error
      states + "not medical advice" note).
- [ ] Single-record "Share Record" is a fake 400ms stub (`query.ts:124-138`). **(Deferred —
      no single-record share endpoint exists; the `share` function is form-oriented. Feature
      build: needs a new endpoint.)**
- [x] Provider import writes only medical-profile tables — Fixed 2026-06-06: `importMedicalRecords` now also inserts a `health_records` summary row (kind `specialist_report`, source `connected`) after a successful import.
- [x] "Request Manually" provider picker — Fixed 2026-06-07: searches `provider_organizations`; user enters real records email on details step (no fabricated `records@{clinic}.com`).
- [x] Copied provider-portal links omit `?token=` — Fixed 2026-06-06: `RecordRequestRow` now
      carries `secure_token`; Copy Link + View Portal append `?token=` so the portal no longer
      403s.
- [x] DICOM viewer button — Fixed 2026-06-06: replaced dead button with message listing compatible viewers + download link.
- [x] Orphaned `RecordsAssistantPanel.tsx` — Stubbed out 2026-06-06 (file permission prevents deletion; replaced with deprecation notice).

### 8.3 Medical Forms + Secure Share

- [x] Forms list/open/edit wired to real data — Fixed 2026-06-07. Catalog extracted to
      `src/lib/forms/catalog.ts` (structure) + `src/lib/forms/responses.ts` (load/save).
      `MedicalFormsPage` derives status/stats from the user's `form_responses`; `FormDrawer`
      loads saved answers and **persists** on Save (upsert). Migration `20260607000001` seeds
      the 18 `form_templates` (required FK), adds a unique `(patient_id, template_id)` index,
      and **fixes a fatal RLS/FK contradiction** that had made the table unwritable. Forms **autopopulate** from
      profile/clinical data (`src/lib/forms/autopopulate.ts`); saved answers take precedence on Save.
- [x] Share flow now uses real `form_responses` UUIDs — Fixed 2026-06-07: selected completed
      forms map to their response UUID, so `share` builds real PDFs and the recipient view
      resolves titles via `template_id` (redeployed). Patient lookup fixed (`user_id` + name).
- [x] AI `shareForm` payload shape aligned with `share` contract — Fixed 2026-06-07 in `ai-health-assistant/tools.ts` + `src/lib/ai-tools/forms.ts` (`src/lib/forms/share-api.ts` helper).
- [x] Share function PDFs — Fixed 2026-06-05: generates real HTML document from `form_responses` data with actual field answers. Patient DOB fetched from `user_profiles` (was hardcoded `1985-06-22`).
- [x] Share revoke/opened auth — Fixed 2026-06-05: revoke checks ownership (`patient_id === user.id`, returns 403 if mismatch); opened validates `share_token`.
- [x] Ensure every user has a `patient_profiles` row — Fixed 2026-06-06 via migration
      `ensure_patient_profiles_row`: unique index on `user_id`, backfill of missing rows from
      `user_profiles`, and an `AFTER INSERT/UPDATE` trigger that keeps `patient_profiles` in
      sync (name/dob/email/phone). `EXECUTE` revoked from public/anon/authenticated.

### 8.4 Insurance

- [x] Member ID forced to `''` — Fixed 2026-06-06: uses `member_id_hash` for display.
- [x] "Add coverage" dead no-op + missing `onEdit` — Fixed 2026-06-06: header button + hint banner added; Edit button wired on CoverageCard; both direct to AI assistant.
- [x] AI insurance add/stop demo UUID — Fixed 2026-06-05 (see §8.0).
- [x] Coverage status enum mismatch — Fixed 2026-06-06: `'verified'` added to schema + StatusBadge; page now sets `'verified'` consistent with AI tool.
- [ ] Unused `ProviderPickerDrawer` — wire or remove (deferred).

### 8.5 Medical Profile

- [x] Condition cards read camelCase — Fixed 2026-06-05: `fetchAllData` now maps DB rows to camelCase before setting state.
- [x] Add Medication / Add Allergy / Add Immunization — Built 2026-06-05: 3 new Edge Functions created, `MedicalProfilePage` wired with `assistantTaskId` state + "Add" buttons per section. `AssistantDrawer` fixed to send user access token.
- [x] Active-medication count / immunization status — Fixed 2026-06-06: meds card shows real
      active count (no `end_date` or future `end_date`); immunization subtitle is data-driven
      (`N due` / `Up to date` / `None recorded`). Also fixed a latent bug where immunization
      detail fields rendered snake_case against camelCase-mapped state.
- [x] Preventive Care section — Fixed 2026-06-06: loads from `preventive_care` (status/overdue
      badges, next-due/frequency/provider/notes) with loading + empty states.

### 8.6 Care

- [x] Care History "Share Link" — Fixed 2026-06-06: copies current URL to clipboard.
- [x] Hardcoded AI care insights — Fixed 2026-06-06: replaced with neutral real message.
- [x] `openAddProvider` dead wiring + search clears on blur — Fixed 2026-06-06: actionsRef wired as noop; search only collapses when empty.
- [ ] No inline med add/edit; no drill-down from timeline (deferred — feature build).

### 8.7 Network / Providers

**Architecture reference (DIY EHR — 2026-06-07):**

Two provider concepts in the app:
- **Care network** (`providers` / `pharmacies` tables) — user's saved doctors/pharmacies. Mostly real data today.
- **EHR connections** (`provider_connections` + `provider_organizations`) — digital record import. Backend scaffolded; UI missing.

**DIY connection strategies (already in code):**
| Strategy | Code | Status |
|----------|------|--------|
| `direct_provider_connection` | `fhir-oauth-start` + `fhir-sync` | SMART on FHIR — **implemented** (needs `FHIR_CLIENT_ID` secret) |
| `epic_connection` | same OAuth path | Epic/MyChart — uses org OAuth endpoints when configured |
| `manual_fallback` | `record-request` Edge Function | **Works today** |
| Inbound push | `inbound-records` Edge Function | API-key FHIR ingest — works for partners |

**Keragon:** thin bolt-on in `supabase/functions/providers/index.ts` only (`connection_method: "keragon"` + webhook). AI connect flow uses DIY tools above, not Keragon. `vault-stats` still filters `connection_method = 'keragon'` — fix in Phase A.

**Recommended implementation order:**
1. Fix `fetchInsuranceContext` / `fetchCareNetwork` — call `resolveUserId()` (NetworkPage passes no user id today).
2. **EHR connections panel** — wire `GET/POST/DELETE /functions/v1/providers` + `GET /functions/v1/sync-status` on Network or Health Records (reuse `ProviderRecordConnectionFlow` org search via `searchProviderOrganizations`).
3. ~~**Directory unification**~~ — Done 2026-06-07: `provider-organizations.ts` + `organization-directory.ts`; wired ProvidersTab, AddProviderDrawer, RequestRecordDrawer.
4. ~~Wire `RequestRecordDrawer` MOCK_PROVIDERS → org search.~~ Done 2026-06-07 (includes required records email field on details step).
5. (Deferred) Pharmacy geocoding / payer directory API.
6. ~~(Phase B) SMART on FHIR OAuth callback + live `fetchProviderRecordPreview`~~ — Done 2026-06-07: edge functions + pilot sandbox org; deploy secrets to activate.

- [x] In-network provider **directory** — Fixed 2026-06-07: `network-directory.ts`, `clinical-connectors.ts`, and `RequestRecordDrawer` now search `provider_organizations` via shared `organization-directory.ts` helpers (same query as AI `searchProviderOrganizations`).
- [x] `fetchNearbyPharmacies` query bug — Fixed 2026-06-06: `.eq('id', userId)` → `.eq('user_id', effectiveUserId)` on both `user_profiles` and `pharmacies` queries.
- [ ] Nearby-pharmacy search is still mock data; map pinned to Springfield (deferred — needs real geocoding/payer-directory integration).
- [x] `fetchInsuranceContext()` missing `resolveUserId()` — Fixed 2026-06-07: `fetchInsuranceContext`, `fetchCareNetwork`, and `searchNetworkProviders` now resolve the session user id.
- [x] **EHR connections UI (Phase A)** — Fixed 2026-06-07: `EhrConnectionsPanel` on Health Records calls `providers` + `sync-status`; disconnect wired; Connect opens existing flow. `vault-stats` counts all active connections (not Keragon-only).

### 8.8 Onboarding

- [x] Skip steps write no defaults — Fixed 2026-06-06: preferences skip now writes a default `user_preferences` row before navigating.
- [x] Email OTP — Fixed 2026-06-05: UI now uses 6 digits consistently everywhere. `email_verified: true` written to `user_profiles` on successful verification.
- [ ] `identity_verified: true` self-set with no real verification
      (`OnboardingIdentityPage.tsx:81`).
- [x] Optimistic dashboard navigation — Fixed 2026-06-06: `OnboardingCompletePage` now shows error + Retry on DB write failure; "Go to Dashboard" blocked until confirmed success.
- [x] Onboarding assistant wired to real AI — Fixed 2026-06-06: `OnboardingAssistantPanel` upgraded to a mini chat interface with `sendChatMessage` integration. All 5 onboarding pages converted from `alert()` FAQ stubs to `suggestedQuestions` chips.
- [x] `user_preferences` never read — Partially fixed: Profile Settings now reads + saves preferences (session 3). Onboarding skip writes defaults (session 4). Full app-wide application (language/theme) deferred.

### 8.9 Auth & Profile Settings

- [x] Login page title — Fixed 2026-06-06: "Admin Login" → "Sign In".
- [x] Login-page signup bypass — Fixed 2026-06-06: inline signup now routes to `onCreateAccount` (onboarding) instead of calling `signUp` directly.
- [x] Notification toggles + regional settings — Fixed 2026-06-06: load from `user_preferences`, saved on form submit.
- [x] Change Password — Fixed 2026-06-06: wired to `supabase.auth.updateUser()` with inline form.
- [ ] Download My Data / Delete Account — no handlers (deferred — needs backend support).
- [x] "Verified Account" badge — Fixed 2026-06-06: gated on `email_verified` from `user_profiles`.

### 8.10 Provider/Admin

- [ ] `ProviderAdminPage` stats (`appointments_today`, `pending_forms`, `active_staff`) are
      hardcoded; Quick Actions / Add Patient / View buttons have no handlers
      (`ProviderAdminPage.tsx:76-315`).
- [x] Record submission partial failures — Fixed 2026-06-06: `fileErrors[]` collected per file; response now includes `filesFailed`, `fileErrors[]`, and `success: false` when any upload fails.

### 8.11 AI Assistant flows

→ See **§5a / §5b** for the assistant architecture problems and capability gaps surfaced by
this audit (demo UUIDs, dual backends, tool/schema mismatches, missing tools).

---

_Last updated: 2026-08-29_
## 9. Admin Intelligence Platform

- [x] Scaffold dedicated `apps/admin` workspace and protected application shell.
- [x] Establish stable `gpt_app` / `saas_cloud` product keys and shared typed contracts.
- [x] Add fail-closed, product-scoped admin role schema; no default role grants.
- [x] Reserve Provider Operations as a domain separate from product analytics.
- [ ] Add the server-side admin API and immutable admin audit event stream.
- [x] Add versioned GPT App event storage, deterministic fixtures, and the first meaningful-task metric snapshot dashboard.
- [ ] Instrument live GPT App events and replace the synthetic snapshot with reproducible live aggregation.
- [x] Build synthetic narrative dashboards for all six GPT App admin tabs.
- [ ] Build the canonical provider-account migration and separate provider integration portal.
- [x] Additive M1 provider security foundation: canonical provider accounts/memberships,
      practitioner profiles and panels, provider-managed patient identities, explicit
      identity links/access grants, append-only audit envelope, and fail-closed access contracts.
- [x] Add the first server-side provider administration API: active tenant resolution,
      safe membership listing, server-owned role templates, bounded role delegation, and
      immutable success/denial/failure audit events. Direct client mutations remain revoked.
- [x] Add provider invitation records plus guarded membership activation/suspension/removal,
      last-owner protection, self-lockout prevention, and recent AAL2 checks for role and
      lifecycle mutations. Invitation email delivery remains a separate integration step.
- [x] Build a locally reviewable Provider Directory and Memberships interface with explicit
      synthetic-data labeling, roster-only fields, lifecycle summaries, search/status filters,
      and disabled mutations until the provider API, MFA, and acceptance flow are deployed.
- [x] Add atomic invitation acceptance with verified-email matching, verified TOTP enrollment,
      AAL2 enforcement, provider/invitation lifecycle checks, and immutable success auditing.
- [x] Add a provider-facing invitation route with sign-in gating, verified-email handling,
      TOTP enrollment, AAL2 challenge, role review, and explicit invitation acceptance.
- [x] Add passwordless invitation email delivery and account provisioning through Supabase Auth,
      invitation-specific redirect validation, delivery-state tracking, and rate-limited resend.
- [x] Apply the three provider migrations and deploy JWT-protected `provider-admin-api` and
      `provider-invitation-api` to the connected Health Vault Supabase project.
- [x] Seed an active synthetic Health Vault Demo Provider and link the approved existing
      `godesigngo@aol.com` Auth identity as its organization owner without changing credentials.
- [x] Define `health_vault_roster_csv_v1`, deploy protected import staging/reconciliation and
      rollback support, and load 100 validated roster-only MITRE Synthea patients into the demo
      provider with provenance, idempotency, synthetic labeling, and immutable auditing.
- [x] Add the provider-facing roster upload/preview/exception-review UI and Edge Function with
      server revalidation, idempotent protected staging, explicit commit, history, and rollback.
- [x] Add a canonical `/provider` workspace with verified-email, TOTP/AAL2, active tenant and
      permission gates, organization overview, and searchable read-only synthetic roster view.
- [ ] Set/verify `APP_URL`, allow the provider invitation redirect in Supabase Auth, and verify
      the live email-to-MFA-to-acceptance round trip.
- [x] Replace Provider Operations fixtures with a dedicated deployed platform-admin API and
      enable invite/resend controls behind `providers.manage` plus recent AAL2.
- [x] Add provider-owned practitioner panel management: automatic unverified practitioner
      profiles, membership lifecycle synchronization, verified-credential and tenant gates,
      roster assignment/revocation, grant-status visibility, and explicit separation from
      patient consent/access grants.
- [x] Add provider-facing Practitioner invitations, pending/accepted member visibility,
      resend controls, and an explicit fresh-MFA challenge for protected mutations.
- [x] Add a platform-admin professional verification workflow so an authorized reviewer can
      move practitioner credentials through pending/verified/rejected/expired states with
      evidence references and immutable auditing.
- [x] Scale practitioner credential review for operational queues: summary counts, identity and
      identifier search, credential-status filtering, 25-row pagination, page-aware persistent
      checkbox selection, and confirmed bulk decisions with shared evidence and feedback.
- [x] Complete the provider-operations UX/UI audit: dismissible pilot and verified-session notices,
      secondary utility actions, interactive summary filters, sortable review columns,
      indeterminate page selection, sticky/scannable bulk and table states, tokenized feedback
      colors, accessible focus/touch behavior, reduced-motion support, and a compact tablet shell.
- [x] Add the synthetic-pilot patient identity and consent workflow: provider-created,
      roster-email-matched invitations; explicit patient accept/decline; atomic identity-link
      and time-limited roster-demographics grant creation; and practitioner authorization that
      requires the assignment, active identity link, and matching active grant.
- [ ] Obtain Privacy/Legal approval for production patient-link consent language, evidence,
      audit retention, revocation behavior, and practitioner-visible field scope before removing
      the synthetic-only gate.
- [x] Add service-only, tenant-scoped patient invitation digest delivery jobs with recipient
      deduplication, queued/sent/failed/cancelled lifecycle state, provider retry/cancel controls,
      bounded indexes, and immutable provider audit events.
- [ ] Onboard and authenticate a transactional sender domain, configure the external email
      service secrets, and activate the queued digest processor; do not mark jobs sent before the
      provider returns a delivered or queued result.
- [x] Add the practitioner-facing assigned-patient workspace with verified-profile enforcement
      and server-side intersection of active assignment, active identity link, and matching
      unexpired access grant; expose roster demographics only and audit every view.
- [x] Expose atomic patient-controlled provider-access withdrawal with an active linked-identity
      ownership check enforced inside the database transaction. Providers cannot call this path
      or revoke patient-owned identity/access; Health Vault super-admin intervention is exposed
      separately to `platform_owner` only with fresh MFA, a required reason, and immutable audit.
- [x] Reconcile elapsed patient access grants and invitations into explicit expired lifecycle
      states without revoking patient-owned identity links; allow renewed consent to reuse only
      the same authenticated patient's established identity link.
- [x] Make the synthetic patient invitation round trip locally reviewable with deterministic
      newest-lifecycle selection, full-roster counts, pending-only Open review / Copy link actions,
      and visible clipboard confirmation without bypassing provider MFA.
- [x] Capture immutable, versioned synthetic consent receipts atomically when a patient accepts,
      including scope, purpose, grant period, verified-email evidence, request ID, and patient/
      provider identity references; expose receipts only through patient-owned and platform-owner
      read models while retaining the production Privacy/Legal gate.
- [x] Replace the Provider Directory's placeholder connection count with a fail-closed live metric
      requiring an active roster identity, active patient-owned identity link, and matching active,
      effective, unexpired grant for the same consumer; deduplicate lifecycle rows.
- [x] Add benefit-first patient invitation language aligned to the HealthVault.me narrative,
      clearly separate the ownership promise from consent, and version the materially changed
      synthetic consent statement as `health-vault-synthetic-pilot-access-v2`.
- [x] Show a server-derived invitation package summary, route successful acceptance to the
      Health Vault dashboard, and bootstrap roster demographics only when no patient-owned
      profile exists; never overwrite an established profile.
- [x] Establish a synthetic-only provider clinical package quarantine with provenance,
      idempotent source digests, normalized resource categories, revoked browser access, and
      live validated-package counts on patient invitations.
- [x] Add provider-facing clinical JSON staging and validation with strict schema checks,
      fresh-MFA protection, duplicate digest detection, package history/counts, and a synthetic
      demo fixture; validation does not release records into a patient-owned vault.
- [x] Expand clinical staging to one bulk JSON upload for up to 250 roster patients and 5,000
      resources in the interactive pilot, while preserving a separate quarantine package and
      provenance trail per patient; document private resumable storage and async processing as
      the required production path for larger exports.
- [x] Consolidate patient navigation: label the primary workspace `Patients`, remove the separate
      roster-import tab, and expose CSV roster operations through an `Import patients` CTA and
      right-side `Patient roster import` drawer.
- [x] Add identity-safe, consent-bound release of validated clinical packages into the patient
      vault; require explicit v3 clinical consent, an active matching link/grant, and exact roster
      name/date-of-birth matching so shared demo email addresses cannot authorize cross-patient
      clinical attachment.
- [x] Add a provider security-activity timeline gated by `provider_audit.read`, with bounded,
      sanitized operational evidence, search/outcome filters, and no raw metadata or clinical data.
- [x] Add centralized platform-owner MFA recovery for any Health Vault identity, including
      provider owners, practitioners, and patients, with exact-email lookup and confirmation,
      fresh admin AAL2, required reason, self-reset prevention, session invalidation, supported
      Supabase Admin factor deletion, and immutable audit evidence.
- [x] Add bulk practitioner CSV import for 1–2,000 rows with client and server validation,
      duplicate pending-invitation reconciliation, queued delivery, imported specialty and
      identifier metadata, unverified credential state, immutable audit evidence, and no
      inferred practitioner-to-patient access.
- [x] Scale the provider practitioner directory for bulk imports with pending/active/attention
      metrics, name/email/specialty/source search, lifecycle filters, 25-row pagination, CSV
      provenance labels, and bounded delivery-status visibility.
- [x] Add provider-controlled cancellation for individual pending practitioner invitations and
      immutable CSV import batches, with exact tenant/batch scoping, fresh MFA, `members.manage`,
      confirmation UX, accepted-membership protection, indexed lookup, and immutable auditing.
- [x] Expose accepted-practitioner lifecycle controls in the provider directory: suspend active
      access, reactivate suspended access, and remove only after suspension, using the existing
      fresh-MFA and tenant-authorized member-status endpoint while preserving the practitioner’s
      independent Health Vault identity and account.
- [x] Add bulk practitioner-panel CSV assignment for 1–2,000 rows with a downloadable template,
      local preview, exact practitioner-email and provider-patient-number resolution, active and
      verified same-tenant enforcement, duplicate reconciliation, fresh MFA, bounded auditing,
      and no implied patient consent, access grant, or clinical visibility.
- [x] Scale the platform Patient Access workspace with lifecycle summary filters, consent-aware
      search, sortable columns, 25-row pagination, full consent evidence review, responsive table
      containment, and an explicit acknowledgment plus confirmation before individual super-admin
      termination; preserve the patient-owned profile and prohibit bulk termination.
- [x] Add a persistent desktop collapse control to the platform admin sidebar, reducing it to an
      accessible icon rail with hover/focus labels while preserving the horizontal small-screen
      navigation and full sign-out/product semantics.
- [x] Add a persistent admin light/dark appearance control using the shared semantic token system,
      operating-system preference on first use, corrected dark feedback contrast, and full support
      in both expanded and collapsed navigation states.
- [x] Reframe MFA recovery guidance as a dedicated informational card beside a simplified Email
      lookup, including identity verification, session invalidation, authenticator re-enrollment,
      patient-profile preservation, and super-admin fresh-MFA expectations.
- [x] Audit and explicitly migrate legacy `organizations`, `organization_admins`, and
      `organization_patients`: three empty seeded organizations now map to draft provider
      accounts with immutable audit evidence; any legacy memberships are suspended without
      permissions and legacy patient assignments are quarantined roster identities, with no
      inferred practitioner role, identity link, consent, or provider access grant.
