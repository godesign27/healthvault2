# Health Vault — Tasks

Outstanding work for both clients:
- **Mobile app** — `apps/mobile/` (Expo + React Native)
- **Desktop / web app** — root `src/` (Vite + React)

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

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
- [ ] **Anon key sent instead of user JWT** on several authenticated calls — likely silent
      failures under RLS for real users: record-request detail refresh/files/delete
      (`RecordRequestDetailDrawer.tsx:88-155`), share revoke (`MedicalFormsPage.tsx:510`),
      `AssistantDrawer` add-condition (`AssistantDrawer.tsx:75-82`), `welcome-email`
      (`OnboardingCompletePage.tsx:67`).
- [ ] **Edge Function ↔ DB schema mismatches** (`provider_connections` has no
      `provider_name`/`ehr_source`; `connection_method` enum has no `keragon`):
      `sync-status` selects nonexistent `provider_name`/`ehr_source` → 500
      (`sync-status/index.ts:46`); `providers` POST inserts `ehr_source`/`keragon` and omits
      NOT NULL `provider_organization_id`; `vault-stats` filters `connection_method='keragon'`.
      Either add a migration for these columns/enum or fix the functions. (`providers` GET was
      already fixed to join `provider_organizations(name)`.)
- [ ] **Two siloed insurance models** — onboarding writes `insurance_policies`; dashboard +
      AI read `insurance_coverages`. Onboarding insurance never appears in-app. Unify/migrate.
- [x] **`MedicalIDCard` photo column bug** — Fixed 2026-06-05: column corrected to `profile_photo_url`.
- [x] **Address schema mismatch** — Fixed 2026-06-05: `profile-data.ts` now reads flat `address_line1`/`city`/`state`/`postal_code` columns (with JSON fallback) and writes flat columns matching onboarding.

### 8.1 Dashboard

- [ ] Recent Activity feed is mock; "View All Activity" is a dead button
      (`DashboardPage.tsx:364-396`).
- [ ] Quick Actions (Download Medical Forms / View Care History / Schedule Appointment) have
      no handlers (`DashboardPage.tsx:332-349`).
- [ ] Medical Forms stat card shows hardcoded "—" (`DashboardPage.tsx:289`).
- [ ] Stats omit connected providers / pending requests / last sync (wire to `vault-stats`).

### 8.2 Health Records

- [ ] Vault stats partly fake: `connectedProviders: 3` hardcoded, `lastSynced` = today
      (`HealthRecordsPage.tsx:45-48`) — wire to `sync-status`.
- [ ] Patient record **upload** is an in-memory stub, lost on refresh (`query.ts:105-122`);
      build real upload → storage + `health_records` insert.
- [ ] "Generate AI Insights" only `console.log`s; wire to `analyze-record`
      (`DocumentViewer.tsx:245-255`).
- [ ] Single-record "Share Record" is a fake 400ms stub (`query.ts:124-138`).
- [ ] Provider import writes only medical-profile tables, **not** `health_records` documents
      (`medical-import.ts`, `ProviderRecordConnectionFlow.tsx:274-281`).
- [ ] "Request Manually" provider picker uses `MOCK_PROVIDERS` + fabricated
      `records@{clinic}.com` emails (`RequestRecordDrawer.tsx:71-80,182`).
- [ ] Copied provider-portal links omit `?token=` → portal 403s
      (`RecordRequestDetailDrawer.tsx:134,313`).
- [ ] DICOM viewer button has no handler (`DocumentViewer.tsx:219-229`).
- [ ] Delete or integrate orphaned `RecordsAssistantPanel.tsx`; align copy with
      `HEALTH_RECORDS_REQUEST_GUIDE.md`.

### 8.3 Medical Forms + Secure Share

- [ ] Forms list/open/edit is hardcoded mock; not wired to `form_templates`/`form_responses`
      (`MedicalFormsPage.tsx:77-239`, `FormDrawer.tsx:36-274`). `FormDrawer` Save only exits
      edit mode (no persist); the real save path exists only via the AI tool.
- [ ] Share flow uses demo patient + template slugs (not `form_responses` UUIDs); AI
      `shareForm` payload shape mismatches the `share` function contract.
- [x] Share function PDFs — Fixed 2026-06-05: generates real HTML document from `form_responses` data with actual field answers. Patient DOB fetched from `user_profiles` (was hardcoded `1985-06-22`).
- [x] Share revoke/opened auth — Fixed 2026-06-05: revoke checks ownership (`patient_id === user.id`, returns 403 if mismatch); opened validates `share_token`.
- [ ] Ensure every user has a `patient_profiles` row (required by `saveFormAnswers`).

### 8.4 Insurance

- [ ] Member ID forced to `''` on coverage cards (`InsurancePage.tsx:64`).
- [ ] In-page "Add coverage" is a dead no-op (`InsurancePage.tsx:36,213-221`); wire it or route
      to the AI flow. Edit-coverage flow missing (`onEdit` never passed).
- [ ] AI insurance add/stop use demo UUID (see §8.0); `useInsuranceConnection` (correct auth)
      exists but is unused.
- [ ] Coverage "verify/refresh" is a local stub; `connected` vs `verified` status enums
      disagree across page and AI tool.
- [ ] Unused `ProviderPickerDrawer` — wire or remove.

### 8.5 Medical Profile

- [x] Condition cards read camelCase — Fixed 2026-06-05: `fetchAllData` now maps DB rows to camelCase before setting state.
- [x] Add Medication / Add Allergy / Add Immunization — Built 2026-06-05: 3 new Edge Functions created, `MedicalProfilePage` wired with `assistantTaskId` state + "Add" buttons per section. `AssistantDrawer` fixed to send user access token.
- [ ] Active-medication count uses total count; immunization "Up to date" is hardcoded
      (`MedicalProfilePage.tsx:163,195`).
- [ ] Preventive Care section is a static empty placeholder; load from `preventive_care`
      (`MedicalProfilePage.tsx:485-498`).

### 8.6 Care

- [ ] Care History "Share Link" button has no handler (`CarePage.tsx:398-401`).
- [ ] Care-page AI contextual insights are hardcoded/fabricated
      (`AIAssistantPanel.tsx:148-159`).
- [ ] `openAddProvider` prop is never assigned (dead wiring, `CarePage.tsx:7-9`); `CareTeamCard`
      is unused. Search input clears on blur (UX).
- [ ] No inline med add/edit (lives in Medical Profile); no drill-down from timeline.

### 8.7 Network / Providers

- [ ] In-network provider **directory** is static Springfield mock (`network-directory.ts`);
      replace with real payer/NPI/`provider_organizations` search. Manual add search is also
      mock (`clinical-connectors.ts`).
- [ ] Nearby-pharmacy search is mock; map pinned to Springfield; `fetchNearbyPharmacies` uses
      `.eq('id', userId)` (should be `user_id`) and is imported but unused
      (`PharmaciesTab.tsx:64-67`, `network/api.ts:305`).
- [ ] No first-class **EHR connections** UI: web never calls `providers` (list/connect/
      disconnect) or `sync-status`; connect only happens via the AI flow. Add a connections +
      sync-status panel (Network or Health Records).
- [ ] `fetchInsuranceContext()` + add flows pass demo IDs (see §8.0).

### 8.8 Onboarding

- [ ] "Do This Later" / Skip steps are navigation-only no-ops (no deferral, no default rows)
      (`OnboardingStartPage.tsx:158-167`, preferences/insurance skips).
- [x] Email OTP — Fixed 2026-06-05: UI now uses 6 digits consistently everywhere. `email_verified: true` written to `user_profiles` on successful verification.
- [ ] `identity_verified: true` self-set with no real verification
      (`OnboardingIdentityPage.tsx:81`).
- [ ] Dashboard entry optimistically set even if the DB `onboarding_complete` write failed
      (`App.tsx:375-380`).
- [ ] Onboarding "assistant" is static FAQ/`alert()` stubs, not the real AI
      (`OnboardingAssistantPanel.tsx`).
- [ ] Saved `user_preferences` are never read anywhere else in the app.

### 8.9 Auth & Profile Settings

- [ ] Login page titled "Admin Login"; no forgot-password flow (`LoginPage.tsx:72-77`).
- [ ] Login-page inline signup bypasses the email-verification flow that onboarding enforces
      (`LoginPage.tsx:25-33`) — unify signup paths.
- [ ] Profile Settings: notification toggles and regional settings (language/timezone) are
      UI-only, never saved (`ProfileSettingsDrawer.tsx:495-581`).
- [ ] Change Password / Download My Data / Delete Account buttons have no handlers
      (`ProfileSettingsDrawer.tsx:610-626`).
- [ ] "Verified Account" badge always shown regardless of state (`ProfileSettingsDrawer.tsx:281`).

### 8.10 Provider/Admin

- [ ] `ProviderAdminPage` stats (`appointments_today`, `pending_forms`, `active_staff`) are
      hardcoded; Quick Actions / Add Patient / View buttons have no handlers
      (`ProviderAdminPage.tsx:76-315`).
- [ ] Provider record submission: submit succeeds even if some file uploads fail; surface
      partial failures (`record-request/index.ts:540-543`).

### 8.11 AI Assistant flows

→ See **§5a / §5b** for the assistant architecture problems and capability gaps surfaced by
this audit (demo UUIDs, dual backends, tool/schema mismatches, missing tools).

---

_Last updated: 2026-06-05_
