## Current release queue — October 3, 2026

Use [docs/release/READINESS.md](docs/release/READINESS.md) for the consolidated current queue
and [validation evidence](docs/release/2026-10-03-validation.md) for the latest pass.
The entries below retain historical snapshots; an earlier unchecked item may be superseded
by a later verified entry. They are not a fresh release certification.

### Latest follow-up

- [x] October 6 preview device pass. Reduced motion opens the menu in one frame. Largest text stacks the dashboard title, menu label, profile name, email, and allergies, then text size was restored to large. A new recovery email redirects to https://healthvault.me; the link was not opened and the password was not changed. On the iPhone 16e, the Health Vault mark returns from Records to the dashboard, and the allergy line expands. On the Android 14 emulator, the signed-in dashboard, the mark returning from Records, and the expanded allergy list were checked. TalkBack was installed from the Play Store and read the menu as “Open menu, Button.”
- [x] Capture TalkBack speech on the Android allergy line. With the line focused, TalkBack spoke “collapsed,” the full allergy list through “Penicillin, Penicillin,” “Button,” and “Shows the full text.” The on-screen value stayed collapsed.
- [x] Open Vault Assistant with Reduce Motion on. A 30fps capture goes from the dashboard to the full “Vault Assistant” sheet in one frame, with no sliding frame between. Reduce Motion was turned back off.
- [x] VoiceOver menu focus on the QA simulator. Opening the menu moves the cursor onto Close menu. Closing it returns the cursor to the menu button.
- [x] VoiceOver focus enters Vault Assistant on the QA simulator. Opening the sheet puts the cursor on Close assistant. Closing the sheet puts the cursor back on the assistant button.
- [x] Physical-iPhone VoiceOver announcement. VoiceOver was on, the cursor was on the menu button, and the user heard the announcements and confirmed they work. The spoken words were not captured on screen.
- [x] Web recovery state. On the local site, a `type=recovery` address shows Set new password. A short password shows “Use at least 12 characters.” Mismatched passwords show “The passwords do not match.” The plain home page stays the marketing site. The live recovery email was not opened and the password was not changed. The hosted site was not deployed.
- [x] Validate the iOS JavaScript/Hermes export with preview configuration; fix Metro shared-token resolution and file-based image parsing. Export completed with 999 modules and 21 assets. Runtime and accessibility acceptance remain open.
- [~] Launch the isolated Debug candidate on the iOS 18.6 QA simulator against preview Metro. Sign-in, empty-password validation, and the default-size Sign In control (about 51 by 305 points) are visible. The preview Gmail account reached Dashboard, Records, Medical Forms, Care, Insurance, Medical Profile, and Vitals. The current screens now show dashboard appointment and medication dashes, and Medical Forms shows 2 of 18 saved for this account. At the largest text size the current sign-in screen scrolls, and Sign In is fully visible after scrolling. The password placeholder wraps below the visibility icon instead of colliding with it. Text size was restored to large. The Vault Assistant control is now the rightmost top-bar button, with the profile avatar immediately to its left; tapping it opens the assistant and the dashboard medication card is no longer covered. A cold relaunch kept the signed-in dashboard. This simulator’s Accessibility settings do not offer VoiceOver under Vision, so focus order was not tested. With Reduce Motion on, the menu appears without a fade; a 30fps capture jumps from the dashboard to the dimmed drawer in one frame. The setting was turned back off. At normal text the menu, avatar, and assistant buttons measure 48 by 48 points, and menu rows are at least 48 points. At the largest text size those buttons stay 48 by 48 and the menu rows grow and still scroll. The dashboard title and menu label “Dashboard” stay one word, the profile name stays whole, the email wraps with the full address visible, and allergies stack under their label. Text size was restored to large. Text size was restored to large. A hosted reset from the signed-out simulator reached the preview Gmail account from noreply@mail.app.supabase.io. That delivered link still redirects to https://healthvault27.com. Preview Auth project roeudwddxvniazwufdqf now uses site URL https://healthvault.me, and its redirect allow list no longer includes healthvault27.com. No new recovery message was sent and no password was changed. The signed-in iPhone 16e dashboard shows Timothy McGuire, October 12, 1967. The screen name now reads “Dashboard” in the page, and the top bar keeps the menu, avatar, and assistant. The allergy line is still cut off. VoiceOver was not checked.
- [x] Prepare isolated SDK 52 candidate, matching modules and native lockfiles; web/iOS JS export, pod install and targeted tests pass.
- [x] Resolve candidate fmt/Xcode 27 native compile failure using a guarded upstream backport; format validation and unsigned arm64 Debug simulator build pass.
- [x] Install/launch SDK 52 candidate in clean simulator; local-fixture sign-in, session reload and Records/Forms navigation/error checks pass.
- [ ] Complete successful backend flows, Release, Android and physical-device acceptance before adoption.
- [x] Remove fabricated dashboard activity/unsupported counts and wire three quick actions; actual-component regression passes.
- [x] Replace active Care samples with owner-scoped queries and truthful failures; implement native recovery flow and sign-in accessibility. Isolated regressions pass.
- [ ] Verify hosted recovery redirect/email flow, interactive Care/recovery and physical VoiceOver; resolve remaining placeholder routes.

- [x] Apply isolated, compatible security patches; web build/iOS export and targeted tests pass. Audit 87→84; critical tar remains for coordinated native-stack migration.

- [x] Scope both form-save helpers to the owner patient profile and require returned-row confirmation; six focused regression suites and web build pass.
- [x] Audit and retire unused mock import chain and unreachable assistant interview; active autofill/chat/provider modules retained.

- [x] Repair accordion caller/content contract, segmented selection semantics, wizard descriptions/types and legacy navigation type errors; component regression checks pass.

- [x] Fix timeline patient-profile lookup and query error handling; regression checks pass.
- [x] Derive provider/pharmacy create ownership from signed-in session; reject absent sessions.
- [x] Repair dynamic icon rendering and insurance/component type mismatches.
- [~] Full TypeScript gate: 12 unused-code diagnostics remain, all in protected marketing/public-site files (previously 45); web build passes.

# Health Vault — Tasks

Outstanding work for both clients:
- **Mobile app** — `apps/mobile/` (Expo + React Native)
- **Desktop / web app** — root `src/` (Vite + React)

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

---

# ChatGPT App MVP

- [x] Harden vital and clinical import widgets with shared standard/legacy host handling, stable pending/success, bounded waiting, error rejection and no uncertain retry; deployed v131 with fresh template URIs and 100 passing tests.
- [~] Concurrent SQL test requests completed but did not overlap (second RPC measured 0.012 seconds); concurrency remains unproven because the tool appears to queue requests. Both transactions rolled back and zero fixtures remain.

- [x] Reconcile all 31 MCP v129 deployed source files; restore missing health-import/clinical-import/Nourished Rebel modules, record hashes, and add a read-only source comparison script.
- [x] Prepare isolated-test CI and production-readiness/recovery/reviewer runbook; 84 tests and package typecheck pass. Remote CI, Deno validation, backup restore, operational alerts, and remaining acceptance gates are not yet complete.

- [x] Verify live revoked-share and invalid-token denial on viewer, PDF, and bundle routes; expand isolated expiry/revocation/token coverage (84 tests).
- [x] Refresh ChatGPT plugin metadata and verify medical-form share domain warning is cleared with the deployed redirect origin.
- [~] Finish two-account OAuth isolation: exact consent approved and both accounts connected. Fresh ChatGPT AOL-only dashboard request returned the AOL identity and zero counts; cross-owner proposal/mutation denial remains untested through OAuth. Live approved-share expiry remains pending after 2026-09-20 13:23:04 UTC.

- [x] Reconnect original owner and complete approved one-hour Patient Registration email test: widget accepted, Resend Delivered, emailed recipient link renders one read-only form (2026-09-20).
- [x] Harden post-send Open secure share with validated real URL/native fallback and redirect metadata (v129, 78 tests). Earlier apparent failure also involved a delayed ChatGPT external-site prompt.
- [x] Add non-enforcing DMARC policy and recipient plain-text email alternative. Inbox placement remains recipient-dependent; original Gmail spam classification cause is unconfirmed.

- [x] Repair Resend receiving/tracking DNS: root MX and DNS-only `talk` CNAME added with user authorization and independently resolved; user confirmed DNS verified. Incoming-email delivery remains untested.

- [x] Correct malformed live `RESEND_FROM_EMAIL` to the approved Health Vault <team@healthvault.me>; original-account reconnect and replacement delivery succeeded. Failed share was revoked with explicit approval.

- [x] Correct patient email receipts to distinguish service acceptance from unconfirmed delivery; version 127, 73 tests passing with mocked delivery.
- [x] Prepare and maintain live share/CSP and two-account OAuth acceptance evidence in `packages/health-vault-mcp/LIVE_ACCEPTANCE.md`; remaining gates are recorded separately.

- [x] Add missing domain metadata to the medical-form email-share widget for app submission; use the existing Health Vault widget origin and retain restrictive CSP.

- [x] Repair browser dashboard rendering and diet confirmation payload/lifecycle; deployed MCP version 122, user verified button save, and authenticated read verified both intended entries appear once.
- [x] Audit remaining confirmation buttons and auth/CSP configuration; findings in `packages/health-vault-mcp/RELEASE_REVIEW.md`.
- [x] Harden remaining Life Signal, form, and sharing buttons against host updates, missing bridge responses, and ambiguous retries; deployed version 124 with isolated behavioral tests.
- [~] Verify all widgets with ChatGPT CSP enforcement enabled before broader release; enforcement is now enabled; dashboard, existing diet cards, and a fresh Life Signal card render. A fresh medical-forms catalog also renders. Form-review/share confirmation coverage remains.
- [x] Atomic duplicate-safe diet and Life Signal RPC saves, deployed in version 125; repeated exact events reuse their row and batches roll back together.
- [x] Test wellness database isolation with two synthetic authenticated identities in a rolled-back transaction; zero fixture rows remain.
- [x] Add durable share/email confirmation receipts; version 126 reuses identical active shares, blocks pending retries, and fixes the deployed non-email helper mismatch. Mock delivery and rolled-back two-identity database tests pass.
- [x] Deploy atomic RPC duplicate protection for condition, medication, allergy, record, and appointment confirmations (v130): exact retries reuse records; differing-details conflicts fail; owner-isolation rollback tests and 90 Node tests pass. Direct inserts from other clients are outside this lock protocol.
- [ ] Exercise simultaneous independent-session saves and cross-owner proposal/mutation denial through real OAuth sessions.
- [x] Verify the approved expired share rejects viewer, PDF, and bundle requests with HTTP 410; normal owner-authenticated revocation round trip remains pending.
- [x] Reconcile production MCP source drift at v129; compare a fresh production snapshot again before the next deployment. Other functions and the Node server entrypoint are outside this parity claim.

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
- [x] Audit and explicitly migrate legacy `organizations`, `organization_admins`, and
      `organization_patients`: three empty seeded organizations now map to draft provider
      accounts with immutable audit evidence; any legacy memberships are suspended without
      permissions and legacy patient assignments are quarantined roster identities, with no
      inferred practitioner role, identity link, consent, or provider access grant.

- [x] 2026-10-02: Deploy MCP v132 Nourished Rebel v5 widget with dual-host confirmation, pending/error feedback, verified saves, completion handling; 108 tests and typecheck passed.
- [ ] Fresh CSP-enforced ChatGPT browser acceptance for Nourished Rebel v5, vitals v3, and clinical import v2 remains required before beta approval.
- [x] 2026-10-02: Actual MCP edge entrypoint passes isolated Deno 2.9.6 check with frozen dependencies; repeatable script and CI job prepared.
- [x] Restore secondary-account read-only wellness/dashboard rendering through reconnect and metadata refresh; live Start and blank-answer validation pass.
- [ ] Complete fresh CSP-settings verification and real save/error/timeout browser acceptance.

- [x] 2026-10-02: Reproduced and fixed live cross-account reads of patient_profiles/form_responses; rollback isolation regression suite passes and zero fixtures remain.
- [x] User verified live wellness save with their entered sleep answer.
- [ ] Investigate cause of live demo-policy drift and historical access; complete real OAuth cross-account proposal/revoke tests and review dependent privileged access paths before beta.

- [x] 2026-10-02: Both share types pass rollback owner/revoke/receipt/replay isolation checks; no fixtures remain.
- [x] Added live-target ownership-policy release gate for 11 private tables; passes.
- [x] Confirmed older owner-form migration is absent from live recorded migration history; exact cause and historical access remain unresolved.

- [x] 2026-10-02: Real ChatGPT OAuth owner revoke succeeded; foreign-owner revoke rejected with unchanged fixture; both test shares cleaned up.
- [x] Deploy clearer inaccessible-share revocation error as MCP v133; 111 tests, Deno check, source parity and auth smoke checks pass.
- [ ] Identify a dedicated staging database with two independent connections for simultaneous-save acceptance; awaiting user's environment choice.

- [x] 2026-10-02: Real OAuth foreign form-proposal confirmation rejected; fixture unchanged, no form saved, cleanup verified. Proposal database regression suite passes.
- [x] Deploy MCP v134 terminal error/timeout rendering for failed form confirmations; preserves mutation locking and never retries automatically.

- [x] 2026-10-02: Live ChatGPT rejected-save card visibly shows server error and Check Health Vault after v134 metadata refresh; no indefinite loading.

- [x] 2026-10-02: Audit public privacy/terms/support routes and account export/deletion controls; documented concrete failures in USER_CONTROLS_AUDIT.md.
- [x] Implement authenticated owner-scoped account export and verify file contents/isolation with synthetic data; live authenticated acceptance remains tracked below.
- [ ] Define retention/deletion fulfillment scope and test a dedicated disposable account; reviewed request submission is implemented per owner choice.
- [ ] Publish approved privacy/terms and a monitored support destination; replace placeholder links and verify direct public routing.

- [x] Implement and deploy owner-scoped structured account-export endpoint; pagination/isolation tests and auth-denial check pass.
- [x] Implement approved reviewed-deletion request queue; live RLS/duplicate/confirmation tests pass in rollback.
- [x] Wire account controls and verify synthetic browser receipt/download behavior locally.
- [x] Prepare real privacy/terms/support routes, corrected footer links, and reviewable draft content locally.
- [ ] Confirm policy operator/contact/retention facts, assign monitored support/deletion owner, approve text, and deploy website.
- [ ] Verify authenticated deployed export using a dedicated synthetic account and complete operational deletion fulfillment procedure before readiness sign-off.
- [x] Correct local policy drafts to GO Design, Inc. as operator of Health Vault; supersedes the earlier unincorporated Health Vault, Inc. designation.
- [x] Complete team@healthvault.me inbound routing to godesigngo@gmail.com; verify delivery and original Reply-To.
- [x] Prepare tested support forwarding to owner-selected godesigngo@gmail.com; deploy closed endpoint and restricted receipt ledger.
- [x] Activate approved Resend webhook and signing secret; receiving access, delivery and Reply-To verified.
- [x] Activate owner-approved Resend webhook and configure signing secret; verify signed/unsigned authentication live.
- [x] Verify owner-approved support forward test reaches Gmail Inbox and preserves original Reply-To.
- [x] 2026-10-02: Owner-approved plain-text support-forward test delivered to godesigngo@gmail.com Inbox/Updates; SPF/DKIM/DMARC and Reply-To verified.
- [x] Complete SMTP credential handoff, verify Gmail alias and outbound From/Reply-To.
- [ ] Plan a durable mailbox before Gmail third-party send-as retires in January 2027.
- [x] 2026-10-02: User completed Resend SMTP credential and Gmail verification; Health Vault send-as alias now present and verified in Gmail settings.
- [x] 2026-10-02: Outbound Gmail/Resend SMTP test delivered to Gmail Inbox/Personal with team@healthvault.me From/Reply-To and SPF/DKIM/DMARC passing.
- [x] Record founder Timothy McGuire as support/deletion owner and initial release as adults 18+ in draft policies/runbook.
- [ ] Validate and enforce adults-only signup eligibility before release; draft wording alone is not enforcement.
- [ ] Future: design authorized parent/guardian/dependent access, consent, account separation and revocation before enabling family records; define sibling/dependent relationships explicitly.
- [x] Record owner-provided business mailing address in local support/policy drafts.

- [x] Confirm GO Design, Inc. incorporation in Illinois, USA and the same Barrington business mailing address; update local policy/support drafts.
- [x] Record owner-provided GO Design, Inc. FEIN in internal review notes only.

- [x] Draft reviewed-deletion scope, response targets, verification checklist and synthetic rehearsal criteria in DELETION_RETENTION_REVIEW.md.
- [ ] Accept operational deletion targets; approve category retention periods and implement/test erasure, access blocking and queue monitoring before readiness sign-off.

- [x] Prepare scoped account-controls website release; lockfile build, five export tests, deployed backend availability and Cloudflare dry run verified.
- [ ] Verify live website routes after deployment and complete authenticated synthetic export/deletion acceptance, dependency remediation and recovery gates.

- [x] Deploy account-controls release ef2d430 to healthvault2 and verify live support/privacy/terms routes plus authenticated Settings controls.

- [x] Make deletion isolation regression self-contained with rollback-only synthetic Auth identities; live test passes and leaves zero fixture users.
- [x] Verify all 34 export projections compile against live schema with authenticated-role grants and zero data rows read.
- [ ] Update/choose isolated preview for real authenticated two-account export and deletion-request tests; existing preview lacks nine export dependencies.

- [x] Update owner-approved preview schema without copying production data; preserve reference rows and keep ancillary integrations inactive.
- [x] Pass two-account authenticated HTTP export/deletion-request acceptance including pagination, indirect ownership and concurrent duplicate protection; verify complete fixture cleanup.
- [ ] Complete full browser acceptance with disposable preview sessions, actual erasure/access-block testing and independent file/database recovery rehearsal.

- [x] Verify real account-controls component browser download, confirmation gate, receipt and reload persistence against disposable preview account; verify cleanup.
- [x] Activate approved count-only deletion-queue digest with delivery verification and restricted failure/stale status; independent outage alerts remain below.

- [x] Activate owner-approved weekday 9 AM Mountain count-only deletion digest; verify Inbox delivery, authentication, stable retries, duplicate protection and empty/failure receipts.
- [ ] Observe first real scheduled digest check (Oct5 2026 09:00 America/Denver); current state awaiting_first_run.
- [ ] Add independent outage alerting if required; current monitor failure/stale visibility requires Timothy's weekday manual review.
- [ ] Review existing provider/consent SECURITY DEFINER execution grants reported by production advisor; do not blanket-revoke intentional authenticated RPCs.

- [x] Rehearse preview-only reviewed account block, old-JWT/refresh denial, partial-failure preservation, synthetic row/file/Auth erasure and second-account isolation.
- [ ] Fix sensitive-file delivery/revocation: warmed signed Storage URL still returned cached bytes after deletion; immediate revocation gate FAILED. Verify cache invalidation and avoid long-lived direct bearer file URLs.
- [ ] Extend block checks to privileged service jobs, anonymous share/request endpoints, OAuth/provider grants and all production ownership relationships before deploying candidate SQL/export guard.
- [ ] Complete full erasure/recovery/retention acceptance; fixture cleanup is not full production erasure readiness.

- [x] Implement/test preview protected record-file endpoint: ownership checks, bounded no-store bytes, post-I/O recheck and immediate unlink/account-block denial.
- [x] Verify real document viewer protected-image rendering and visible denied-access state; clean all synthetic test artifacts.
- [ ] Review/deploy coordinated producer/API/viewer changes after access-block dependencies; test actual incoming record-import delivery in preview.
- [ ] Migrate/revoke previously issued direct Storage URLs and verify cache invalidation; new mediated endpoint does not fix legacy links retroactively.


- [x] Verify inbound key-management JWTs and active key owners; constrain personal keys/email resolution to owner Vault; pass preview synthetic upload/protected-download and isolation tests.
- [ ] Add atomic import/block interlock, upload/metadata failure cleanup and honest partial results; extend guards to record-request and explicitly authorized provider ingestion before production rollout.


- [x] Preview inbound import journal, transactional finalization coordinated with reviewed block, serialized compensation and honest indexed partial results; verify invalid-metadata cleanup and concurrent block/save denial.
- [ ] Add/test stale-attempt and late-upload reconciliation worker; retain journal until settled, handle request retries and total body bounds, and extend guarded writes to record-request before production rollout.


- [x] Extend transactional upload protection to provider requests; verify token rotation/block denial, atomic metadata rollback, partial-result UI and owner-only resend.
- [x] Activate preview-only 15-minute failed-upload recovery after proving stale/late cleanup, saved/recent preservation and retry behavior.
- [x] Observe successful preview cron-triggered upload-recovery dispatches and completed worker receipt (October 2, 23:15/23:30 UTC; zero failures).
- [ ] Approve journal retention/backlog alerts and finish retry/body-bound/legacy-link rollout gates before production deployment.

- [x] Rehearse preview legacy file rotation and exact-object CDN purge: replacement verified before old deletion, cached old URL denied after 10 seconds at observed location, second account preserved and fixtures cleaned.
- [ ] Build durable production file-reference migration and verify all reference types before retiring the one inventoried legacy health-record link.

- [x] Bound preview upload JSON bodies before parsing (40 MiB upload / 64 KiB control, actual streamed-byte counting, 30-second read timeout); add local provider preflight and conservative retry handling for missing receipts.
- [x] Add preview provider-request durable per-file receipts across reloads/concurrent clients; recover committed results and preserve active attempts.
- [x] Add preview inbound batch-key receipts: same-key recovery, changed-payload rejection, owner isolation and concurrent slot protection.
- [ ] Approve receipt retention/historical cutover and update all inbound clients for required Idempotency-Key before production rollout.
- [x] Replace shared-client multipart mismatch with JWT JSON personal-upload route; add separate retry-aware integration client and verify real preview uploads.
- [x] Replace web in-memory upload helper with an actual file picker and durable client receipts; verify preview save, reload, and same-file recovery without duplicates.
- [x] Wire native Records picker/save to authenticated base64 uploads with stable content/owner/category retry identity; verify adapter/transport and preflight tests.
- [x] Install mobile dependencies/pods, export the iOS bundle, build/install the development client and verify native file IO/hash/upload/retry/restart against preview.
- [ ] Complete native Files picker/cancellation and interrupted-network UI acceptance; settle supported iOS/Xcode release matrix.
- [x] Resolve hosted large-body rejection: discard unread rejected bytes under the absolute deadline; preview 42 MiB request now returns JSON 413 and creates no upload attempts.
- [x] Track GPT/SaaS/mobile feature parity and wire native assistant read-only chat with capability handshake and server tool restrictions (local implementation).
- [ ] Audit assistant account-block/ownership checks, deploy read-only changes to preview and complete real two-account chat/error/denied-write acceptance.
- [ ] Wire native record sharing and provider request submit/resend/cancel; replace sample provider selection.

- [x] Deploy preview assistant read-only restrictions and active-account/RLS guards; verify blocked/anonymous access and forged history denial with disposable accounts.
- [ ] Configure preview OPENAI_API_KEY via Supabase secrets; then run live two-account answer isolation and requested-write denial tests (currently blocked by missing configuration).

- [x] Wire native provider-request resend with explicit review, JWT auth, truthful delivery feedback and persistent uncertain-outcome protection; remove fabricated email timeline.
- [ ] Verify native resend confirmation/results using an authorized test recipient and design unknown-outcome reconciliation; cancellation remains open; request creation and real provider selection are implemented below.

- [x] Replace native sample provider selector with real care-team data and wire reviewed request creation with authenticated transport and persistent duplicate protection; tests and iOS export pass.
- [ ] Verify native request creation UI and authorized email receipt; add optional date range and uncertain-outcome reconciliation.
- [ ] Implement server-backed cancellation with status migration, ownership/account checks, upload lock coordination and resend/upload refusal for cancelled requests.

- [x] Implement candidate server-backed request cancellation and native confirmation; verify ownership, invalidated links, upload/resend refusal, banned owner, idempotency and RPC permissions in a rolled-back preview transaction.
- [ ] Apply cancellation candidate to preview, deploy dependent record-request function, and complete concurrent-session plus HTTP/native UI cancellation acceptance before production rollout.

- [x] Apply cancellation candidate and deploy record-request to preview; pass live HTTP ownership/retry/revocation checks and eight concurrent resend/cancel races with disposable fixtures.
- [ ] Complete native cancellation UI acceptance and concurrent upload-finalization/cancellation tests before production rollout.

- [x] Verify cancel-first/finalize-first and six concurrent upload-finalization/cancel races using synthetic preview storage; preserve committed records and reject late completion.
- [x] Fix mobile cancelled/received/failed card labels and visible cancellation progress; iOS export passes.
- [ ] Complete on-device cancellation confirmation, progress, success and failure acceptance (backend HTTP/race tests complete).

- [x] Observe real native cancellation confirmation, Keep request, progress, success, reload persistence, refreshed counts and received-conflict refusal against disposable preview fixtures.
- [x] Close stale request detail when cancellation error is acknowledged; restored-app iOS bundle validated.
- [x] Verify injected offline/lost-response cancellation UI, error-acknowledgement navigation and full-shell Records layout on iPhone 16 Pro / iOS 18.6.

- [x] Keep cancellation deadline active through response-body reading; stalled transport/body and committed-lost-reply retry tests pass.
- [ ] Complete native Files-picker/upload interruption acceptance; implement the currently empty Connect Provider handler with a real supported flow.

- [x] Replace mobile Connect Provider no-op with real directory search, reviewed portal launch, active connection reuse, server status verification and manual-request fallback.
- [ ] Accept native provider OAuth return/restart and import-review flow on device; current callback is the existing web completion page.
- [ ] Complete actual native Files-picker and interrupted-upload UI acceptance (transport regression tests pass).

- [x] Observe actual iOS Files picker open/cancel, synthetic file selection, category selection, busy state and authentication-failure recovery; verify empty provider-search validation.
- [ ] Complete combined authenticated native picker→save receipt→lost-response/retry acceptance and live provider authorization.

- [x] Verify authenticated actual Files-picker upload, lost-response uncertainty and UI retry confirmation against preview; independent server reads prove same record ID/count=1.
- [x] Replace internal upload retry wording and preserve confirmed-save feedback when list refresh fails.
- [ ] Accept live provider OAuth return/import review and picker reselection after app restart.

- [x] Recover pending native provider authorization from owner-scoped server state, add explicit restart and truthful inactive status; tests/iOS bundle pass.
- [x] Add missing preview OAuth schema prerequisites with server-only state access; no provider enabled.
- [ ] Harden OAuth callback redirects, atomic state consumption and active-account activation before live provider acceptance.
- [ ] Configure preview sandbox provider/client and test real provider authorization return/import review.

- [x] Restrict OAuth return paths, claim state before token exchange and guard final activation with account-erasure lock/active-account/pending checks; deploy and smoke-test preview.
- [x] Pass rollback SQL activation/replay/permissions tests and return-URL unit tests; zero fixtures remain.
- [ ] Complete configured sandbox provider authorization exchange, concurrent callback HTTP acceptance and native return/import review.

- [x] Configure preview SMART sandbox and complete real browser authorization/code exchange; owner read confirms active and four consumed-state replays preserve connection.
- [x] Replace signed-out callback false failure with sign-in/reverification flow; browser state and web build pass; disposable preview account/connection cleaned up.
- [ ] Verify post-login web completion and native return/restart, then implement/accept provider import review using synthetic data.

- [x] Automatically verify pending provider connection when mobile returns to foreground; preserve confirmed status if list refresh fails; transition tests/iOS export pass.
- [x] Fix local fhir-sync false success on preview/token persistence failure; handler tests and Deno check pass.
- [ ] Review import active-account/erasure safety, deploy preview persistence fixes, and accept actual native portal return plus reviewed import.

- [x] Apply preview FHIR refresh/preview account-erasure interlock with owner/status/token checks; stop counting preview as completed sync; deploy fhir-sync and verify 401.
- [x] Pass full-handler failure tests, Deno check and rolled-back SQL ownership/block/token/permissions tests; zero fixtures remain.
- [ ] Exercise concurrent FHIR preview/erasure sessions and live native provider return/import review; add durable import confirmation before enabling native import.

- [x] Pass preview block-first/write-first and 12 concurrent FHIR preview/refresh-versus-block races; authenticated blocked endpoint refuses access; fixtures cleaned.
- [x] Remove web scaffold medical-data fallback and duplicate client preview insert; require live persisted FHIR result; client tests/web build pass.
- [ ] Accept actual native portal return and implement durable reviewed clinical import with duplicate/partial-failure handling.

- [x] Add preview atomic reviewed FHIR confirmation with durable receipt and exact-source duplicate protection; web uses selected preview indexes and server receipt.
- [x] Pass SQL rollback/retry/dedup/block/permission checks, client tests, Deno check and web build; deploy preview endpoint and verify 401.
- [ ] Complete authenticated concurrent/lost-response import confirmation tests, rendered web review and native review/portal-return acceptance before production rollout.

- [x] Pass deployed authenticated FHIR import concurrency (six simultaneous requests), ignored-response retry, ownership/confirmation refusal, exact-source dedup and transactional failure checks; cleanup verified.
- [ ] Complete rendered web confirmation/retry acceptance and native import review/portal-return flow.

- [x] Keep exact import selection on Try Again; verify actual web review/error/retry/completion components with injected lost response and failing list refresh; fix invisible primary button styles.
- [ ] Complete native import review and portal-return acceptance; combined live-browser import test remains separate from UI fault injection.

- [x] Wire mobile provider import review, selection and explicit server confirmation; persist scoped retry request and refresh Records after saved receipt.
- [x] Pass mobile import recovery/ownership/storage/receipt tests and final iOS export.
- [ ] Observe native review, selection, cancel, confirmation, uncertain-response retry, app-restart recovery and provider portal return on device.

- [x] Observe real native import selection/cancel, lost-response state, app-restart recovery and refresh-failure success preservation with synthetic adapters; restore normal entry and export iOS.
- [ ] Complete combined native live provider authorization return and authenticated import acceptance; synthetic UI and live endpoint tests are separate evidence.

- [x] Complete combined iOS native sandbox OAuth, foreground return, live preview and authenticated reviewed import; independently verify 16 clinical rows and one summary; remove disposable fixtures.
- [x] Fix native provider portal launch losing the Linking receiver; provider connection/return/import checks pass.
- [ ] Resolve generic medication labels from FHIR medication references; test mapping before production provider rollout.
- [ ] Verify the complete Records-screen refresh and physical-device/Android provider flows; simulator component acceptance does not cover these.

- [x] Trace generic medication labels to literal upstream sandbox placeholders; preserve source names without invention.
- [x] Add shared FHIR contained/included/reference medication mapping and patient-scoped include; pass mapping isolation and preview-handler tests plus Deno check.
- [x] Deploy mapping to preview and verify authenticated SMART sandbox preview persistence with real demo OAuth; remove all disposable fixtures and private credentials.

- [x] Verify complete native Records-screen import refresh using synthetic services: filter resets to All, summary appears, count/last-sync update without restart; refresh failure preserves saved success.
- [x] Prevent stale Records/statistics responses; include statistics in upload and pull refresh; pass deferred-response hook regressions.
- [ ] Fix date-only service dates shifting back one day on mobile; check narrow Records header layout.
- [ ] Repeat full-screen refresh with live services and perform physical-device/Android acceptance before release.

- [x] Fix date-only Records display on web/native with shared formatter and five-timezone regression coverage; verify native card/detail date.
- [x] Fix narrow Records header title/action layout and observe normal/320-point simulator containers.

- [x] Complete full native Records flow with live preview services: sandbox OAuth, review/confirmation, automatic list/filter/count/last-sync refresh and independent persisted receipt verification; cleanup verified.
- [ ] Perform physical-iPhone and Android acceptance; reconcile remaining release gates before production rollout.

- [x] Improve native Records statistic visibility, provider field labeling, primary/secondary action hierarchy and singular success copy; verify simulator review/confirmation and regression tests.
- [ ] Complete large-text/dark-theme and physical-device/Android acceptance before production release.

- [x] Create `design.md` with shared SaaS/native/GPT component and style reference, actual implementation links and explicit consistency gaps; link from agent instructions.
- [x] Share native Records action-button sizing, wrapping, hierarchy and busy semantics across upload/provider/import; regression and iOS export checks pass; normal-size simulator appearance checked.
- [ ] Propagate native theme semantics into Records and verify large-text layouts; audit GPT import metadata/type-chip contrast in dark mode.

- [x] Propagate shell dark mode into Records and child forms; centralize semantic palettes and explicit on-action foreground; verify dark Records/provider review in simulator and 16 contrast pairs.
- [ ] Verify large OS text, remaining Records sheets/populated states and full-shell theme switching; physical-iPhone/Android acceptance remains open.

- [x] Test actual maximum iOS Dynamic Type on Records/provider/detail; correct heading/close sizing and detail-tab layout; expose individual accessible modal controls and verify detail scrolling.
- [ ] Finish maximum-text request/import form interactions and full-shell theme switching; physical device/Android and GPT contrast checks remain open.

- [x] Centralize adaptive mobile typography and common control tokens; migrate main JS screen typography and core Records/Medical controls; document design.md rules.
- [x] Run scoped accessibility review and synthetic maximum-text control interactions; fix shared contrast/semantics and document evidence/remaining findings.
- [ ] Resolve Records placeholder actions and Medical nested control focus; complete VoiceOver/TalkBack, modal focus, keyboard, physical-device and cross-surface acceptance listed in design.md.

- [x] Remove inactive Records insight/share buttons and unreachable demo banner; show truthful capability limits.
- [x] Replace nested Medical row controls with token-based adaptive sibling controls; verify independent synthetic iOS selection/open/share callbacks.
- [ ] Replace Medical demo persistence/sharing with real authorized flows; verify new form row at maximum text and with VoiceOver/TalkBack before release.

- [x] Adopt supplied semantic ramps, rename HV Signal, preserve existing core palette; add generated source and contrast/drift checks.
- [ ] Complete rendered semantic-color acceptance and migrate remaining SaaS/native/GPT feedback consumers; keep core colors unchanged.

- [x] Add Option 1 chart palette, deterministic order/encoding/motion policy, export themes and reusable accessible trend chart to component library; preserve core brand/HV naming.
- [x] Verify synthetic light/dark chart rendering and keyboard-accessible exact-value table.
- [ ] Extend chart library with remaining base/signal/AI variants, textures, simulation and motion demos; validate mark contrast/narrow layout before patient-facing use.

- [x] Replace native Medical demo forms/save/share/history with shared catalog/autofill and authenticated data paths; verify receipt/account/consent regression tests.
- [ ] Add server-backed uncertain-send reconciliation/idempotency, native modal-focus acceptance and live sandbox Medical save/share/revoke testing before release.

- [x] Implement owner-scoped form-share request claims/receipts and mobile read-only interrupted-send recovery; injected tests and synthetic save UI pass.
- [ ] Apply/test recovery migration in preview, exercise real concurrent duplicate requests and email/receipt failure boundaries, then deploy backend before mobile release. Pending without a receipt still needs support reconciliation.
- [x] Apply recovery migration and deploy share handler in preview; verify database claim arbitration, owner-only status receipts and revoked client access using synthetic accounts; clean fixtures.
- [ ] Exercise concurrent HTTP share dispatch and email/receipt failure boundaries; complete native sandbox share/revoke and VoiceOver acceptance before production rollout. Database arbitration alone does not close this gate.
- [x] Exercise actual share handler with isolated adapters for concurrent dispatch and email/storage/receipt failures; fix ambiguous transport outcomes, upload failure continuation and zero-row receipt confirmation; deploy fixes to preview.
- [ ] Complete live cross-worker share concurrency and native sandbox share/revoke/VoiceOver acceptance. Isolated handler tests do not certify external provider behavior.
- [x] Verify live preview concurrent pending/receipt replays, payload conflict, no duplicate share events, authenticated revocation and revoked-link denial; remove synthetic fixtures.
- [ ] Verify first-send concurrency with an isolated email sink and complete interactive native sharing/revocation plus VoiceOver focus. Live seeded replays do not test a new dispatch.
- [x] Exercise synthetic native consent/send/history/revoke interactions; replace editable post-send review with receipt view and clarify history delivery labels.
- [ ] Verify VoiceOver speech/focus and maximum-text sharing/revocation on native devices; synthetic accessibility-tree inspection is not full screen-reader acceptance.
- [x] Exercise synthetic sharing at maximum iOS accessibility text; add wrapping recipient summary and reset completed review scroll to receipt heading. Restore original simulator text settings.
- [ ] Run physical-device VoiceOver focus, announcement and modal-dismissal acceptance (VoiceOver unavailable in this simulator's Vision settings); Android/TalkBack remains open.
- [x] Require persisted owner-scoped revocation receipt; test missing rows/DB errors and repeated/unauthorized calls; deploy to preview.
- [ ] Complete remaining scoped release gates in docs/medical-forms/RELEASE_ACCEPTANCE.md, including live acceptance of the final revoke update.
- [x] Verify preview v51 revocation persistence live with synthetic fixture; clean account/profile/form/share/claim and credentials.
- [x] Document conservative interrupted-send support triage and identify missing durable correlation/operator resolution tooling.

- [x] Implement private request/share/provider correlation with pre-dispatch persistence checks and isolated failure tests (local; no deployment).
- [x] Apply and verify correlation migration plus share handler in preview; SQL correlation gate and live no-email replay acceptance (v52; seeded pending/receipt, privacy, revoke, cleanup).

- [x] Add native selectable interrupted-send support reference with owner checks, UUID validation and regression tests.
- [ ] Verify support-reference long-press copy and VoiceOver on device before mobile release.

- [x] Native local-fixture Care display/filter, recovery request/expired-link checks; fix calendar-date shift and remove inert Care share action.
- [ ] User signs in to Supabase dashboard; verify recovery redirect/template settings and preview delivery. Browser OAuth attempt denied by automatic review. The preview site URL was later set to https://healthvault.me through the management API. A new recovery email was checked on 2026-10-06: the redirect is https://healthvault.me, the link was not opened, and the password was not changed.
- [ ] Implement care-history sharing before claiming native sharing parity.

- [x] Verify native recovery restart/cancel/rejected-token state and Care overlapping refresh/unmount behavior with actual-hook tests; distinguish filtered no-match copy.

- [x] Replace web/native Vitals placeholders with shared owner-scoped saved measurement history, sources/units, loading/error/empty states and refresh; verify reader and overlapping-request behavior, SDK 51 iOS export.
- [ ] Verify Vitals on device with large text and VoiceOver, plus signed-in hosted data. Current Vitals scope is read-only latest 100 measurements; entry, pagination and charts remain separate work.
- [x] Remove unavailable native gallery/marketing menu destinations; add drawer roles, selected/checked state, modal escape, shared touch targets and recoverable sign-out failure handling. Component regression checks and SDK 51 bundle verified.
- [ ] Verify native drawer focus entry/return and traversal with VoiceOver and large text on device; automated component checks are not accessibility certification.
- [x] Simulator Vitals synthetic reading and drawer AX roles verified; largest text setting exposed avatar clipping and verbose controls, now corrected. Added floating-action clearance.
- [ ] Verify end-of-list scrolling at largest text size and physical VoiceOver focus. Device Hub scroll/drag did not establish end-of-list reachability; do not mark this check passed.
- [x] Share floating-action geometry between shell and Vitals/Records scroll clearance, including device safe area; bound Vitals list viewport explicitly. Adaptive geometry regression and SDK 51 export pass.
- [x] Implement native drawer on-show focus, iOS dismissal return focus and underlying-screen accessibility isolation for drawer/assistant. Drawer regression and SDK 51 iOS export pass.
- [ ] Validate focus transfer with physical iOS VoiceOver; implement/verify Android dismissal focus separately before Android release.
- [x] Migrate native sign-in and insurance status/destructive feedback to shared semantic colors; improve recovery disabled appearance and sign-in/badge wrapping. Contrast/recovery/adaptive checks and SDK 51 export pass.
- [x] Propagate shell light/dark theme into all native Care components, neutralize record-type badges, expose time-range state and improve filter/dropdown sizing. Actual style, data/date/refresh, semantic and adaptive checks plus final SDK 51 export pass.
- [ ] Verify rendered Care dark mode and maximum-text dropdown/history interactions on device; physical VoiceOver remains open.
- [x] Propagate native Insurance shell theme through cards/status/feedback/actions; improve action wrapping and dismiss target. Actual-theme, semantic contrast and adaptive checks plus SDK 51 export pass.
- [ ] Fix native Insurance load failure currently falling through to empty-history presentation after a transient notice; retain a retryable error state, including session/race handling.
- [ ] Verify native Insurance themed populated states and large-text actions interactively before release.
- [x] Fix native Insurance persistent load-error/retry state, provider failure handling and stale responses on refresh/account-change/unmount; data/hook tests and SDK 51 export pass.
- [ ] Remove unsupported native Insurance verification-success claims: current Refresh Verification only updates local DB status without a verification service. Audit corresponding SaaS behavior before claiming verification parity.

### Insurance correctness batch — 2026-10-03
- [x] Replace unsupported verification claims/actions with honest saved-state feedback across web/native/assistant.
- [x] Add shared calendar-aware insurance dates and distinguish passed end dates.
- [x] Make web insurance failures retryable; protect refresh/account changes from stale responses.
- [x] Implement atomic owner-scoped primary selection and validate rollback/denial on synthetic preview data.
- [x] Validate 17 focused suites, web build and SDK 51 iOS export.
- [ ] Review/apply atomic-primary migration before dependent clients/functions; preflight duplicate primaries without silently resolving them.
- [ ] Preview interactive coverage mutations, repeated taps, account-change during mutation, and physical accessibility acceptance.
- [ ] Reconcile legacy member-ID hash/display conventions before claiming ID fidelity; do not treat stored workflow flags as insurer evidence.

### Insurance action safety — 2026-10-04
- [x] Share web/native mutation locking, fresh-account checks and persisted-receipt validation.
- [x] Exclude old-account/unmounted action feedback and refresh; test pre/post-dispatch account changes.
- [x] Show busy/disabled action state and clarify saved-state stop/resume/removal copy.
- [ ] Validate physical-device progress announcements and real preview button flows after the RPC migration.

### Legacy insurance identifiers — 2026-10-04
- [x] Stop displaying ambiguous legacy hash suffixes as member-ID digits in web/native and assistant readers.
- [x] Exclude uncertain member IDs from profile autofill and network/tool mappings.
- [x] Add shared ID display tests and six read-path fixtures covering hash-like/plaintext-looking storage.
- [x] Prepare read-only primary-selection rollout preflight; not run against production.
- [ ] Replace mixed legacy identifier storage with explicit provenance and a recovery/re-entry path before claiming member-ID fidelity. Existing writers still require migration.

### Explicit insurance ID storage — 2026-10-04
- [x] Add explicit member_id storage without guessing or backfilling legacy values.
- [x] Route three client writers through a shared explicit-ID payload; update readers/autofill/export.
- [x] Remove insurance save payload/result logging and raw database errors from assistant UI.
- [x] Validate owner read/write, cross-account denial and blank rejection in rollback-only preview SQL.
- [ ] Apply reviewed member-ID migration before dependent clients, assistant and account-export functions.
- [ ] Add/test authenticated re-entry for old records and interactive deployed writer acceptance. Historical IDs are not recovered by this additive migration.

### Existing member-ID re-entry — 2026-10-04
- [x] Implement inline Add/Update member ID on existing web/native coverage cards with explicit Save/Cancel.
- [x] Reuse owner/account/duplicate-write guard; reject blank IDs and preserve legacy non-inference.
- [x] Test actual web editor states and guarded update payload; retain scalable controls on stopped plans.
- [ ] Accept keyboard/VoiceOver/TalkBack and real preview save flows after applying the explicit-ID migration.

### Insurance preview release — 2026-10-04
- [x] Commit curated insurance release/dependencies (78cec7e), preserving unrelated working-tree changes.
- [x] Apply both insurance migrations and deploy assistant/account-export to the existing preview backend.
- [x] Deploy isolated web preview; verify backend isolation, hosted bundle integrity and unauthenticated denial.
- [x] Re-run installed-schema rollback tests and confirm synthetic fixture cleanup.
- [ ] Complete authenticated browser save acceptance and mobile physical interaction tests before production promotion.
- [x] Correct dedicated preview hostname being mistaken for an organization; add routing regression.
- [x] Remove six-digit onboarding verification limit; preserve full emailed codes and add explicit accessible submit with duplicate guard (preview).
- [x] Populate verified preview account with user-authorized one-time structured data copy; verify counts, ownership visibility and rendered insurance cards. Live account remains isolated.
- [x] Keep insurance save feedback stable above the list through refresh; use persistent dismissible accessible banner instead of timed sliding toast.
- [x] Derive insurance card badge from explicit member-ID completeness and end dates across web/native; clear missing-ID warning after confirmed save.
- [x] Fix insurance header overlap below desktop; reflow narrow cards and ensure 48px coverage action targets.
- [x] Give every insurance card a consistent insurer-initials tile; improve member-ID editor autofocus, Escape cancellation and return focus. Save failure/double-submit regressions pass.
- [x] Browser-test explicit HTTP save failure and successful retained-draft retry using local-only actual insurance components/hook.
- [ ] Complete VoiceOver/device insurance acceptance; simulator exists but current computer-use surface does not expose Simulator.

### Current insurance promotion gates — 2026-10-04 source audit
This section supersedes older pending preview acceptance entries above; it does not mark production or native acceptance complete.
- [x] Accept preview signup, authenticated member-ID save, primary switch, persistent feedback, keyboard cancellation and responsive web layout.
- [x] Audit isolated release source separately from working-tree checks; add a failing-on-error release check runner.
- [ ] Review/integrate missing source fixes: isolated snapshot has 169 TypeScript diagnostics; working copy has 12 marketing-only diagnostics. Preserve unrelated changes and marketing scope.
- [ ] Verify candidate dependency installation from its own lockfile, full typecheck and build on that same source before promotion.
- [ ] Test ambiguous server-commit/client-response-loss recovery.
- [ ] Complete native screen-reader, maximum text size and end-of-list action acceptance.
- [ ] Run production insurance preflight and staged backend/web promotion; preview migrations alone do not satisfy production rollout.

### Release integration batch 1 — 2026-10-05
- [x] Review/integrate seven shared component/gallery fixes; correct duplicate segmented options and cover component behavior.
- [x] Synchronize isolated candidate native insurance source with committed completeness behavior.
- [x] Validate candidate: 98 TypeScript diagnostics remain (down from 169), 14 focused suites pass, local Vite compilation passes. Not deployed.
- [ ] Review remaining network/product/service fixes; complete exact-source typecheck and reproducible dependency installation before deployment.

- [x] Fix shared narrow-screen top-bar clearance across dashboard pages; reserve header space in shell, remove per-page offsets, test layout structure/feedback.
- [ ] Deploy and visually accept shared header fix after release validation; hosted preview still runs previous layout.

### Release integration batch 2 — 2026-10-05
- [x] Integrate network form Zod/Toast compatibility and session-derived create ownership.
- [x] Reject whitespace-only provider/pharmacy names; exercise real submit handlers and synthetic-session store create paths.
- [x] Candidate: 85 TypeScript diagnostics remain, 16 focused suites pass, local build passes; not deployed.
- [ ] Resolve remaining product/service/gallery diagnostics and independently install candidate dependencies before deployment.

- [x] Ship isolated header-only preview fix and visually verify Dashboard/Forms clearance at narrow widths (Worker37b8ec81); broader integration release remains separate and blocked.

### Release integration batch 3 — 2026-10-05
- [x] Integrate reviewed product/gallery consumer cleanup and compatible provider-workspace label formatting.
- [x] Correct timeline patient identity/error propagation and require patient-scoped matching form save receipts; run synthetic regressions.
- [x] Candidate: 31 TypeScript diagnostics (12 marketing, 19 product/legacy), 18 focused suites pass, build passes. Not deployed.
- [ ] Review remaining legacy import dependencies and dashboard props; preserve marketing scope and independent-install gate.

## 2026-10-05 — Preview deployment and next batch
Completed: curated candidate preview deployment and local record-date/dashboard prop batch. Next: review import client/server contracts together; resolve remaining26 candidate diagnostics, verify clean dependency install and native acceptance before production.

- [x] Integrate provider preview/confirmation clients and receipt validation;21 focused suites pass,22 candidate diagnostics remain.
- [ ] Verify backend deployment compatibility before shipping import batch; resolve legacy import dependencies and independent dependency installation.

- [x] Verify deployed preview import contract and server-only RPC grants; remove unused mock import chain.
- [x] Resolve product candidate TypeScript diagnostics;12 marketing diagnostics remain outside app scope.
- [ ] Verify clean dependency installation, native accessibility, and final preview acceptance before promotion.

## 2026-10-05 — Clean dependency verification
Clean npm ci passed in isolated candidate; lockfile unchanged,21 focused suites and Vite build pass.12 marketing diagnostics remain. Audit reports89 affected packages including critical tar; dependency-path triage and compatible mobile upgrades remain open. See docs/release/2026-10-05-clean-install.md. No deployment or dependency changes.

- [x] Trace critical tar path and reproduce tar7/Expo51 incompatibility; reject unsafe blanket override.
- [ ] Resolve critical tooling advisory through a tested migration or compatibility patch.

- [x] Resolve critical tar finding with pinned tar7.5.22 and tested Expo51 postinstall compatibility patch.
- [ ] Review remaining85 audit findings and perform native build/device acceptance.

- [x] Test and integrate compatible dependency updates; audit79 remaining/46 high/0 critical.
- [ ] Review remaining major-version dependency fixes and native binary/device acceptance.

- [x] Validate patched PostCSS with Metro and Vite; retain native pins.
- [ ] Continue XML/image parser and remaining dependency triage; native binary/device validation still open.

- [x] Remove XML parser advisory with scoped Expo plist override and actual plist compatibility checks.
- [ ] Review image-size major-version compatibility; native binary/device validation remains open.

- [x] Patch image-size and verify Metro asset parsing with fresh dependencies.
- [ ] Prepare valid isolated native workspace/Pods and run binary/device validation; audit75 findings remain.

- [x] Prepare isolated Pods and pass unsigned iOS Simulator native build under Xcode27 with diagnostic iOS15 override.
- [x] Set the supported iOS minimum to 15.0 and pass an unsigned Xcode 27 simulator build without a command-line override.
- [ ] Run physical VoiceOver acceptance. Android tooling and an arm64 debug APK are ready; a phone is not connected.

- [x] Pass isolated iOS JavaScript/Hermes export with preview configuration; fix shared-token resolution and file-based asset parsing.
- [ ] Run physical VoiceOver acceptance. The iOS minimum is 15.0 and the unsigned simulator build passes on Xcode 27.
