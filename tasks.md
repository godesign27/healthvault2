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
- [~] Authenticated dashboard deep link and marketing profile navigation are implemented locally; publish the web build through Bolt and test signed-in/signed-out routes.
- [ ] Add confirmed conversational writes for conditions, medications, and allergies.
- [ ] Add secure health-record file upload; metadata-only record creation is not sufficient for the MVP.
- [ ] Add a GPT provider-sharing flow: choose specific categories/records, preview exactly what will be disclosed, require explicit confirmation, create a time-limited secure link, and support audit history plus revocation. Never expose raw share tokens in chat.
- [ ] Add a clinician-facing presentation mode for in-person visits with a user-controlled Medical ID reveal, clear privacy warning, large readable layout, and an automatic re-hide timeout.
- [ ] Test RLS isolation with a second Health Vault account before broader distribution.
- [~] Add first-run empty states and guided deep links for users who have not completed Health Vault onboarding. The GPT onboarding deep link is implemented; empty health-data presentation still needs a first-account test.
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
- [~] **Dead `handleFormFillingRequest`** — UUID fixed; logic is wired but needs end-to-end testing.
- [x] **Mock medication-refill and appointment flows** — Replaced 2026-06-05 with honest "not yet supported" messages.

### 5b. Known assistant capability gaps (build tools / knowledge)

Users will ask for these but the assistant currently cannot do them reliably:
- [ ] Share a completed form with a provider (`shareForm` is Edge-only; also payload mismatch).
- [ ] Update profile via chat (e.g. "change my phone") — `updateMedicalProfile` is Edge-only.
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

## 7. EHR integration — Keragon

- [ ] **Integrate Keragon** (third-party healthcare automation tool) to power the **EHR flow**.
      This was in progress. Document the intended flow, what Keragon provides vs. what we build,
      auth/keys, and which Edge Functions it touches (likely `records-import`, `inbound-records`,
      `sync-status`, `providers`). Decide build vs. buy for the connection/import path.
- [ ] Add Keragon API/docs reference link here.

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
- [ ] "Request Manually" provider picker uses `MOCK_PROVIDERS` + fabricated
      `records@{clinic}.com` emails (`RequestRecordDrawer.tsx:71-80,182`). **(Tied to §8.7
      network directory mock — Phase 3.)**
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
- [ ] AI `shareForm` payload shape still mismatches the `share` contract (Edge-side; pending).
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

- [ ] In-network provider **directory** is static Springfield mock (`network-directory.ts`);
      replace with real payer/NPI/`provider_organizations` search. Manual add search is also
      mock (`clinical-connectors.ts`).
- [x] `fetchNearbyPharmacies` query bug — Fixed 2026-06-06: `.eq('id', userId)` → `.eq('user_id', effectiveUserId)` on both `user_profiles` and `pharmacies` queries.
- [ ] Nearby-pharmacy search is still mock data; map pinned to Springfield (deferred — needs real geocoding/payer-directory integration).
- [ ] No first-class **EHR connections** UI: web never calls `providers` (list/connect/
      disconnect) or `sync-status`; connect only happens via the AI flow. Add a connections +
      sync-status panel (Network or Health Records).
- [ ] `fetchInsuranceContext()` + add flows pass demo IDs (see §8.0).

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

_Last updated: 2026-06-07_
