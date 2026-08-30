# Health Vault — Work Log

A running log of work performed, newest first. Each entry: date, area, what changed, and
any follow-ups. Keep entries short; detailed task tracking lives in `tasks.md`.

Areas: `mobile` · `web` · `supabase` · `design-system` · `infra`

---

## 2026-08-24 (ChatGPT Patient Registration interview)

- **supabase / mcp** — Patient Registration in ChatGPT now keeps one authoritative interview per user and form. Accepted answers persist before progress is calculated, related questions are asked in groups, the same interview widget is reused for progress/review/save, and Confirm & Save still requires an explicit second step. After a completed save the card offers a secure share. Review prefilled answers calls the interview tool instead of a no-op follow-up.
- **infra** — MCP package tests and typecheck pass. Deploy `health-vault-mcp` to ChatGPT; no new database migration.

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

## 2026-08-29

- **provider security M1** — Added an additive canonical provider security foundation without
  reinterpreting legacy organization or consumer-import data. Introduced provider accounts,
  multi-role memberships, practitioner profiles, provider-managed patient identities,
  explicit identity links and consent/access grants, practitioner panel assignments, and an
  immutable admin audit envelope. Added tested fail-closed authorization contracts: provider
  administration does not imply clinical access, and practitioner access requires an active
  tenant, membership, assignment, and unexpired grant.
- **provider administration API** — Added a server-only Edge Function for active-tenant
  membership listing and bounded role assignment. Role permissions are derived from trusted
  server templates; provider admins cannot delegate owner/auditor authority, actors cannot
  change their own roles through the endpoint, and allowed/denied/failed operations write to
  the immutable audit envelope. Added authorization tests for delegation and fail-closed input.
- **provider membership lifecycle** — Added expiring provider invitation records and guarded
  membership activation, suspension, and removal. High-risk role/lifecycle changes require a
  recently issued AAL2 session; self-lockout, non-owner changes to owners, and suspension or
  removal of the final active owner fail closed. Invitation delivery is intentionally reported
  as pending until the MFA enrollment and email-acceptance flow is implemented.
- **provider operations UI** — Replaced the Provider Operations placeholder with locally
  reviewable Directory and Memberships views. Added fictional roster-only fixtures, lifecycle
  and readiness summaries, working directory search/status filters, responsive tables, and
  explicit synthetic-data notices. Provider mutations remain disabled until the security API,
  MFA, and invitation acceptance workflow are deployed. Added four view-model tests; the full
  provider suite now passes 17 tests, and the admin production build passes.
- **provider invitation acceptance** — Added a dedicated authenticated invitation endpoint and
  atomic database acceptance function. Acceptance fails closed unless the signed-in identity has
  a confirmed matching email, a verified TOTP factor, an AAL2 token, valid provider roles, an
  active provider account, and a pending unexpired invitation. Membership creation, invitation
  consumption, and immutable success auditing occur in one transaction. The provider suite now
  passes 22 tests. Email delivery and provider-facing MFA screens remain pending integrations.
- **provider invitation and MFA UI** — Added an isolated `/provider/invitations/:id` route that
  does not reuse the legacy subdomain provider dashboard. The flow gates invitation details on
  the verified matching email, supports TOTP enrollment and AAL2 challenge, reviews organization
  and assigned roles, and requires an explicit acceptance action. Added a privacy-gated preview
  endpoint and deterministic state-machine tests. The provider suite now passes 27 tests, the
  main production build passes, and the signed-out local route has no browser console errors.
- **provider invitation delivery** — Connected invitation creation and resend to Supabase Auth
  passwordless email. Delivery uses a validated invitation-specific HTTPS redirect, provisions
  new provider identities when necessary, records sent/failed attempts without storing auth
  tokens, rate-limits retries, and writes immutable delivery audit outcomes. Added migration
  fields for operational delivery state and redirect-policy tests; 30 provider tests now pass.
  Live delivery remains gated on deployment, `APP_URL`, and the Supabase Auth redirect allowlist.
- **provider pilot deployment and demo** — Applied the three provider migrations to Supabase
  project `sgwekxjlvadvdosyudgj` and deployed JWT-protected version 1 of both provider Edge
  Functions. Seeded an active synthetic `Health Vault Demo Provider` tenant and linked the
  existing approved `godesigngo@aol.com` Auth identity as its active organization owner with
  the canonical 12 owner permissions. Existing credentials were preserved and the operation
  was recorded in the immutable provider audit stream. Post-deployment advisors report only
  the intentional no-policy invitation table and authenticated security-definer RPC warnings.
- **synthetic provider roster import** — Defined and tested the roster-only
  `health_vault_roster_csv_v1` contract, including exact-header enforcement, quoted CSV
  handling, normalization, duplicate detection, formula-prefix rejection, and demographic
  validation. Added protected import source/job/row/exception/reconciliation tables with RLS,
  revoked direct client access, provenance, idempotency, commit, reconciliation, and rollback
  behavior. Transformed the official MITRE Synthea 100-patient sample to the approved schema,
  deployed the import migrations, and committed all 100 valid synthetic identities to Health
  Vault Demo Provider with zero exceptions and an immutable audit event.
- **provider workspace and roster UI** — Added the canonical `/provider` route with fail-closed
  session, verified-email, TOTP enrollment, AAL2 challenge, active-membership, and permission
  gates. Deployed provider-admin-api v2 to resolve only the signed-in user's active provider
  workspace and list committed roster demographics for members with `imports.read`. Added an
  organization overview, synthetic-data notice, searchable roster table, and workspace-view/
  roster-view auditing. The provider suite now passes 37 tests and the production build passes.
- **provider browser invocation fix** — Diagnosed the post-MFA workspace failure as a CORS
  preflight mismatch, not a localhost or authenticator problem. Added `x-client-info` to both
  provider functions' browser header allowlists, added regression coverage, deployed provider
  admin v3 and invitation v2, and verified a live localhost-origin preflight returns HTTP 200
  with the complete allowlist. Added an in-place workspace retry state for transient failures.
- **provider roster import workflow** — Added the provider-facing Roster Imports view with a
  downloadable roster CSV v1 template, 2 MB/500-row limits, local preview and exception
  summary, synthetic-data declaration, protected server revalidation, idempotent SHA-256
  staging, explicit commit, import history, reconciliation visibility, and guarded rollback.
  Clinical or unknown fields fail closed, every privileged action is audited, and direct table
  access remains revoked. Deployed JWT-protected `provider-admin-api` v4, verified the live
  localhost CORS preflight, passed 21 focused tests, and completed a production build.
- **live platform provider operations** — Replaced the Admin Provider Directory and Memberships
  fixtures with a dedicated JWT-protected platform-admin provider API. Reads require
  `providers.read`; invitation creation/resend requires `providers.manage` and recent AAL2.
  The live UI now shows the canonical provider account, roster, membership, and invitation
  lifecycle data, supports organization selection, and keeps platform-admin authority separate
  from provider-tenant authority. Deployed API v1, passed nine focused tests, completed the
  admin production build, and verified the live localhost-origin CORS preflight.
- **admin MFA elevation** — Added an in-place Admin Provider Operations assurance gate that
  detects verified TOTP factors, supports enrollment when absent, challenges AAL1 sessions,
  and unlocks invitation/resend controls only after AAL2 verification. Read-only provider
  operations remain available before elevation. Updated recent-MFA enforcement to use the
  documented most-recent TOTP timestamp in the JWT `amr` claim, deployed platform-admin
  provider API v2 and provider-admin API v5, passed 30 focused tests, and completed both builds.
- **platform import monitoring** — Enabled the Admin Provider Operations Imports tab with live,
  cross-provider job monitoring. Added organization/status/source filters, job health totals,
  validation and exception counts, provenance, synthetic labels, and reconciliation results.
  The API deliberately never queries or returns patient import rows or demographics. Deployed
  platform-admin provider API v3, passed 15 focused admin tests, and completed the admin build.
- **provider practitioner panels** — Added automatic, always-unverified practitioner profiles
  when trusted membership workflows assign the Practitioner role, plus lifecycle synchronization
  that deactivates profiles when memberships are suspended/removed or the role is withdrawn
  without altering credential verification. Added provider-owned panel listing, assignment, and
  revocation behind recent AAL2 and `patient_panels.manage`; assignments require an active,
  professionally verified same-tenant practitioner and active roster identity. The provider UI
  shows practitioner credential state and patient grant presence while explicitly preserving the
  rule that panel assignment never creates consent, access grants, or clinical access. Applied the
  lifecycle migration, deployed JWT-protected provider-admin-api v6, passed 52 focused tests, and
  completed the production build. Supabase advisors reported only the existing intentional
  no-policy/service-only table notices, authenticated security-definer RPC warnings, and legacy
  performance backlog.
- **practitioner invitation and credential review** — Added a provider-facing Members section
  for Practitioner-only invitations, pending/accepted access visibility, resend, and an explicit
  fresh-TOTP challenge for protected mutations. Corrected provider authorization so an active
  AAL2 session can perform read-only workspace and panel reads while the 15-minute recent-TOTP
  window remains mandatory for invitations, imports, assignments, and revocations; Edge Function
  errors now surface their actual policy reason. Added the separate Admin Practitioners review
  view with pending/verified/rejected/expired decisions, bounded evidence references, review
  reasons, reviewer/timestamp attribution, immutable audit events, and server-enforced recent
  AAL2. Applied credential metadata/index migrations, deployed provider-admin-api v7 and
  platform-admin-provider-api v4, passed 64 focused tests, and completed both production builds.
- **admin-to-provider portal navigation** — Added a responsive “Open Provider Portal” link to
  the Provider Operations header. Local development opens `127.0.0.1:5173/provider` in a new
  tab; deployments can override the destination with `VITE_PROVIDER_PORTAL_URL`. The Admin
  production build passes.
- **synthetic patient identity and consent pilot** — Added provider-owned patient access
  invitations limited to committed synthetic roster contacts, fixed `roster.demographics`
  scope, care-coordination purpose, versioned pilot consent, seven-day response expiry, and a
  bounded access period. Added the patient-facing review route with verified matching-email
  gating, explicit synthetic acknowledgment, accept/decline controls, and atomic creation of an
  active identity link plus matching time-limited access grant. Tightened practitioner access so
  an active panel assignment, professionally active practitioner, active patient identity link,
  and grant for the same consumer principal are all mandatory. Applied the protected schema,
  deployed provider-admin-api v8 and patient-access-invitation-api v1 with JWT verification,
  passed 60 focused tests, and completed the production build. Production use remains blocked
  pending Privacy/Legal approval of consent, evidence, field scope, revocation, and retention.
- **high-volume patient invitation workspace** — Replaced the single-patient selector with a
  searchable, 25-row paginated roster table, persistent row selection, page selection, and
  separate Patient roster / Invited tabs. The roster shows not-invited, invited, and access-active
  states; accepted patients receive access immediately through the existing atomic response
  function. Added server-side Invite all eligible processing that walks every committed synthetic
  import row in bounded pages, inserts in safe batches, skips pending or currently active access,
  and reports created/skipped counts. External email delivery remains deliberately disabled for
  this synthetic pilot. Deployed provider-admin-api v9, passed 59 provider tests, and completed
  the production build.
- **patient roster consolidation** — Merged patient-access management into the Patient roster
  destination. The separate sidebar item is removed; Patient roster now opens the unified
  selectable roster / invited-list workspace while retaining bulk actions and immediate access
  activation after acceptance. The production build passes.
- **provider table workspace and demo contacts** — Replaced the provider sidebar with a
  horizontally scrolling top navigation and expanded the workspace to a 1600px table-oriented
  content width. Seeded `godesigngo@aol.com` onto all 100 committed patients belonging to the
  explicitly identified synthetic Health Vault Demo Provider import, with a corresponding audit
  event; verified 100 of 100 rows were updated. Invitation selection is consequently enabled for
  the demo roster. The production build passes.
- **patient invitation delivery queue** — Added service-only, tenant-scoped digest delivery jobs
  with queued/sent/failed/cancelled states, recipient deduplication, attempt/error metadata,
  performance indexes, and revoked direct browser access. Bulk creation now collapses the 100
  shared demo recipients into one digest job, and the Invited tab shows queue status with
  recent-MFA-protected cancel/retry controls. Applied the schema, deployed provider-admin-api
  v11, passed 62 tests, and completed the production build. Cloudflare Email Sending could not be
  activated because this environment has no API token or onboarded sender configuration, so jobs
  correctly remain queued and no external message was sent.
- **practitioner assigned-patient workspace** — Added a fail-closed practitioner endpoint and
  My patients view. Access requires an active provider membership with `patients.read_assigned`,
  an active professionally verified practitioner profile, an active panel assignment, an active
  patient identity link, and an active unexpired grant for the same linked consumer principal.
  The UI exposes roster demographics, relationship, and access expiry only; no clinical data is
  queried. Provider administrators continue to receive panel management, while practitioners see
  assignment/access totals and only their currently authorized patients. Deployed
  provider-admin-api v12, passed 64 tests, and completed the production build.
- **atomic provider access revocation** — Added a service-only database revocation transaction
  and recent-MFA-protected provider action. An explicit reason is required; the transaction
  revokes all active grants and provider-specific identity links, marks accepted invitations
  revoked, and appends a single immutable audit event with affected counts. Because practitioner
  reads intersect active assignments with active links and matching grants, revocation removes
  the patient from all practitioner workspaces immediately. Added the Invited-table action,
  applied the migration, deployed provider-admin-api v13, passed 66 tests, and completed the
  production build.
- **provider security activity** — Added a permission-gated security timeline to the Provider
  Overview. Owners and privacy auditors can search and filter the latest 100 tenant-scoped
  membership, import, panel, invitation, delivery, access, and authorization events. The API
  returns a bounded operational evidence model and deliberately excludes raw metadata and
  authorization payloads; no clinical data is queried. Deployed provider-admin-api v14, passed
  68 tests, and completed the production build.
- **patient ownership boundary correction** — Removed the provider-facing Revoke access control
  and the provider-admin API action after product policy clarified that providers cannot revoke
  patient-owned identity or access. Retained the atomic service-only database primitive for future
  patient and Health Vault super-admin workflows only. Added a regression test that rejects any
  provider UI/API revocation surface, deployed provider-admin-api v15, passed 69 tests, and
  completed the production build.
- **patient-controlled connected providers** — Added a signed-in Health Vault Connected providers
  page with active/expired/revoked history, approved roster-field scope, consent version, access
  dates, and patient-only withdrawal. Ownership is rechecked atomically in a SECURITY DEFINER
  database function; authenticated clients cannot execute it directly, while the JWT-protected
  Edge Function binds the actor to the current Auth user. Withdrawing revokes only that patient's
  provider-specific link, grant, and accepted invitation and retains an immutable audit event;
  it never deletes or transfers the patient's Health Vault profile. Linked the page from Profile
  Settings, applied the migration, deployed patient-provider-access-api v1, passed 73 contract
  tests, and completed the production build.
- **Health Vault super-admin patient access intervention** — Added an owner-only Patient access
  section to Provider Operations with bounded connection/history search, active/expired/revoked
  status, roster-only identity context, approved scope, and access dates. Both the admin route and
  API require the normalized `platform_owner` role; `providers.manage` is explicitly insufficient.
  Termination additionally requires fresh AAL2/TOTP, exact provider/patient identifiers, and a
  non-empty bounded reason. The service-only atomic transaction revokes the provider-specific
  grant, identity link, and accepted invitation while preserving the patient-owned Health Vault
  profile and writing distinct super-admin audit provenance. Applied the audit normalization,
  deployed platform-admin-provider-api v5, passed 77 tests, and completed both production builds.
- **patient access expiration and renewal** — Added service-only, provider-scoped lifecycle
  reconciliation that marks elapsed active grants and accepted or unanswered invitations expired,
  while deliberately preserving the patient-owned identity link and its history. Provider list,
  single-invite, and bulk-invite paths reconcile only after tenant/permission checks, so expired
  requests no longer block renewal. Renewed patient consent reuses the existing active identity
  link only when it belongs to the same authenticated patient, creates a new bounded grant, and
  fails closed if another identity owns the link. Applied the migration, deployed provider-admin-
  api v16, passed 80 tests, and completed both production builds.
- **local patient invitation review controls** — Corrected the unified Patient roster so its tab
  count always represents the full roster rather than only currently invite-eligible patients.
  Added deterministic newest-invitation selection so old lifecycle rows cannot overwrite a newer
  pending, accepted, expired, or revoked state. Pending synthetic invitations now expose both
  Open review and Copy link controls with visible copy confirmation; ended invitations expose no
  actionable link. Passed 82 tests and completed the production build. No invitation was seeded
  outside the protected workflow: the demo provider currently has zero invitations, so the first
  review link must be created through the provider UI with fresh MFA.
- **immutable synthetic consent receipts** — Added an append-only consent-evidence table captured
  by a database trigger inside the invitation acceptance transaction. Each receipt snapshots the
  invitation, provider and patient identities, authenticated consumer, exact approved scope and
  purpose, consent version, effective/expiry period, verified-email evidence reference, synthetic
  flag, and request ID. Acceptance fails atomically if its matching active grant evidence is
  missing. Direct authenticated table reads and writes are revoked, and update/delete attempts are
  rejected by an immutable trigger. Patient-owned Connected providers now shows receipt evidence;
  the platform-owner endpoint receives the same bounded fields, while providers receive none.
  Applied the schema, deployed patient-provider-access-api v2 and platform-admin-provider-api v6,
  passed 84 tests, and completed both production builds. Production consent remains blocked on
  Privacy/Legal approval rather than inheriting the synthetic language.
- **live provider connection metrics** — Replaced the hard-coded zero in Provider Directory with
  a server-derived, per-organization count using the same fail-closed intersection as patient
  access: active provider patient identity, active patient-owned link, identical consumer on an
  active grant, effective start, and unexpired end. The calculation deduplicates repeated rows and
  rejects mismatched, future, expired, revoked, or malformed lifecycle evidence. Directory loading
  fails closed if either lifecycle query fails and returns no demographics or clinical fields.
  Corrected the workspace test command so all platform-admin function tests are mandatory, then
  deployed platform-admin-provider-api v7, passed 94 tests, and completed the admin build. The live
  count remains zero until the first demo invitation is accepted, matching the database aggregate.
- **patient-owned invitation narrative** — Reframed the synthetic patient invitation around the
  benefits established on HealthVault.me: one secure, organized profile, accepted health
  information kept together, and less repeated intake at future visits. The screen now states
  plainly that the patient controls the profile, a provider cannot revoke/take over/delete it,
  and the patient may stop future provider access while retaining the profile. Avoided unshipped
  AI, token, blockchain, and absolute lifetime-retention claims. Because the acknowledgement
  changed materially, new invitations use `health-vault-synthetic-pilot-access-v2`.
- **patient invitation account handoff** — Diagnosed a valid invitation preview returning 403
  because the browser retained the provider's Gmail session while the synthetic patient invite
  targeted a different verified account. Preserved the fail-closed email binding and replaced the
  generic Edge Function error with a privacy-safe account-mismatch explanation and explicit
  sign-out/switch-account action.
- **invitation package summary and dashboard handoff** — Added a server-derived “information
  ready” summary to the patient invitation, including explicit zero clinical counts while the
  provider clinical-import track remains unimplemented. Successful acceptance now routes to the
  standard Health Vault dashboard and carries a one-time connection confirmation banner. A
  database trigger creates a starter profile from verified roster demographics only when the
  invited account has no profile; it never overwrites an established patient-owned profile.
- **provider clinical package quarantine** — Added the first clinical-import foundation:
  synthetic-only provider/patient-scoped packages, source format and digest provenance,
  normalized records/labs/medications/conditions/allergies/immunizations/vitals, bounded
  lifecycle states, idempotency, and fully revoked browser access. Patient invitation totals now
  derive from validated or released packages instead of placeholders. Release remains blocked
  until the consumer identity matches the roster patient beyond the shared demo email.
- **provider clinical import staging UI** — Added a provider-portal Clinical imports workspace
  for uploading the versioned synthetic JSON format, hashing the original file, staging it in
  quarantine, reviewing normalized resource totals, and explicitly validating the package behind
  fresh MFA. The server rejects unknown fields/types, malformed dates, duplicate resources,
  oversized payloads, non-synthetic content, cross-provider patient references, and duplicate
  source digests. Added a ready-to-upload eight-resource demo package for HV-DEMO-0058. This slice
  intentionally stops before patient-vault release so a shared demo email cannot attach one
  roster patient's clinical package to another person's established profile.
- **bulk clinical quarantine** — Replaced the one-patient-only upload assumption with the
  versioned `health_vault_clinical_bulk_json_v1` format. One interactive upload may now contain
  250 roster patients and 5,000 resources; the server verifies every roster identifier, rejects
  duplicate/missing patients, preserves the original batch SHA-256, and creates an independently
  auditable quarantine package per patient. Added a generated 100-patient/300-resource fixture.
  Larger provider exports remain planned for private resumable Storage plus asynchronous jobs,
  avoiding misleading synchronous browser scaling claims.
- **patient navigation consolidation** — Renamed the provider's primary patient destination to
  `Patients`, removed `Roster imports` from top-level navigation, and moved its full upload,
  validation, history, commit, and rollback workflow into a wide right-side drawer opened by the
  page-level `Import patients` CTA. Kept “roster” only in the drawer title and CSV terminology,
  where it remains useful healthcare-operations language.
- **consent-bound clinical release** — Versioned new synthetic invitations to v3 with explicit
  roster-demographics and imported-clinical scopes, and added an acknowledgement that clearly
  authorizes provider-supplied clinical information to enter the patient-owned vault. Acceptance
  now releases only validated synthetic packages after a matching immutable consent receipt,
  active identity link, active unexpired scoped grant, and exact patient profile/roster first name,
  last name, and date of birth. Released resources are immutable patient-owned snapshots with
  source and batch provenance and are mirrored idempotently into the existing Records UI. Pending
  roster-only invitations are revoked and reissued rather than silently broadening their consent.
  Applied the migration, deployed provider-admin-api v21, passed 113 tests, and completed the
  production build. The existing AOL/Timothy account remains untouched because it does not match
  the accepted Jordan roster identity; production clinical data remains behind Privacy/Legal and
  production-ingestion approval.
- **identity-matched release review fixture** — Added and contract-validated a one-patient
  synthetic roster plus an eight-resource clinical package matching the approved AOL demo
  patient's existing first name, last name, and date of birth. The fixtures use the normal roster
  and clinical upload paths, allowing the complete import, invite, consent, dashboard handoff, and
  Records display to be reviewed without weakening the identity check or inserting hidden linked
  data. Copied both fixtures to Downloads and passed 115 tests.
- **roster commit role-model repair** — Diagnosed the identity-matched roster's successful stage
  followed by commit failure from immutable audit evidence: the original commit and rollback RPCs
  referenced a normalized `provider_membership_roles` table that was never part of the deployed
  schema. Replaced both RPCs with the canonical `provider_memberships.roles` array checks, retained
  tenant, active-membership, and role restrictions, and locked their security-definer search paths.
  Applied the migration, passed 116 tests, and successfully exercised the exact staged commit in a
  rolled-back authenticated transaction; the job remains validated and ready for the provider to
  commit from the UI.
- **super-admin MFA recovery** — Added a centralized platform-owner recovery workspace for every
  Health Vault authentication identity rather than limiting resets to provider roles. An operator
  must complete fresh AAL2, search by exact email, review verified-factor count, retype the email,
  and document a bounded recovery reason. The server prevents self-reset, rechecks the exact Auth
  identity, removes verified factors through Supabase's supported Admin API (which invalidates
  sessions), and records immutable audit evidence without storing secrets. Deployed platform-admin-
  provider-api v8, passed 118 tests, and completed the admin production build.
- **high-volume practitioner credential review** — Expanded the Admin Practitioners workspace
  for queues of dozens or hundreds of reviews. Added total, needs-review, verified, and attention
  summaries; searchable name/email/specialty/organization/identifier fields; credential-status
  filtering; 25-row pagination; page-level select-all with selections retained across filters and
  pages; a synthetic-pilot batch evidence shortcut; and an explicit confirmation before applying
  a bulk decision. Existing individual review remains available, bulk updates still create one
  immutable audit event per practitioner, and closeable success feedback is preserved. Added
  deterministic filter/summary tests, passed 130 tests, and completed the admin production build.
- **provider operations UX/UI refinement** — Audited the protected admin workflow for a daily
  desktop operator and applied a ten-item usability and visual-system pass. The pilot boundary and
  successful AAL2 notices are independently dismissible for the browser session; Close review,
  Refresh, row Review, and pilot-evidence helpers now use secondary hierarchy. Summary tiles act
  as accessible status filters, including correct combined needs-review and attention states.
  Practitioner, organization, credential, and review-date columns are sortable; page selection
  exposes its mixed state; selected rows and the sticky batch action area remain legible at scale.
  Replaced one-off success colors with Health Vault tokens, added visible keyboard focus, 44px
  controls, reduced-motion handling, stable checkbox sizing, row scan states, and a compact
  horizontal tablet admin shell. Verified the rendered desktop and 768px layouts, passed 130
  tests, and completed the admin production build.
- **high-volume patient-access operations** — Upgraded the platform-owner Patient Access screen
  from a small lifecycle list into an operations-ready review workspace. Added clickable total,
  active, expired, and revoked summaries; search across patient/provider identity, scope, consent
  version, evidence type, and receipt; sortable lifecycle columns; 25-row pagination; and clear
  active status treatment. Every row now opens a structured connection record with patient and
  provider identity, approved scope, purpose, immutable consent evidence, receipt, and effective/
  end dates. Active access termination remains deliberately individual and requires a bounded
  reason, an explicit patient-ownership acknowledgment, and a named browser confirmation before
  the existing super-admin endpoint is called. Added destructive/secondary action hierarchy,
  dismissible success feedback, error styling, responsive evidence grids, and contained table
  scrolling. Rendered the live seeded connection at desktop and 768px with no page overflow and
  completed the admin production build.
- **collapsible admin navigation** — Added a desktop sidebar control that persists the operator's
  expanded or collapsed preference locally. The collapsed 76px rail retains every destination,
  disabled state, and sign-out action as an accessible icon button; hover and keyboard focus reveal
  the full destination label in a tokenized tooltip. At 800px and below the shell continues to use
  the existing full-label horizontal navigation. Verified the expanded and collapsed Patient Access
  layouts in the live admin app and completed the admin production build.
- **admin dark mode** — Connected the platform admin shell to the existing shared dark token theme,
  defaulting to the operating-system preference until the operator explicitly chooses light or dark.
  Added a persistent appearance control to expanded, collapsed, and small-screen navigation, and
  corrected dark semantic action/link/feedback tokens so selected summaries, statuses, banners,
  and destructive states remain legible. Verified dark Patient Access visually, switched back to
  light mode, reloaded, and confirmed the saved preference remained active.
