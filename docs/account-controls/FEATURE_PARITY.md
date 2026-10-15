# Feature parity and acceptance ledger

October 3, 2026. Existing implementation does not imply deployment or acceptance.
GPT and SaaS checks below reference the prior readiness work; this is not a fresh
end-to-end certification of either product. Mobile is not at feature parity.

| Journey | GPT / SaaS baseline | Mobile status | Remaining acceptance |
| --- | --- | --- | --- |
| Sign-in and account isolation | Existing flows; broader OAuth checks open | Existing sign-in | Two-account UI sessions and revocation |
| Read records/profile/medications/insurance | Existing tools/pages | Existing data screens | Field-by-field parity and empty/error states |
| Upload documents | Web preview save/reload/retry passed | Native IO/hash/upload/restart passed | Physical-device/Android and coordinated release; see MOBILE_UPLOAD_ACCEPTANCE.md |
| Conversational record lookup | Existing assistant backend | Read-only chat and backend safeguards in preview | Real conversation acceptance requires preview model secret |
| Chat saves and logging | Existing GPT confirmation widgets; fresh host acceptance open | Deliberately disabled in mobile chat | Explicit review/confirm UX and enforced write authorization |
| Share records/forms | Existing secure-sharing work | Medical form sharing wired; standalone record sharing unavailable | Form sharing preview/local evidence in medical release checklist; record-sharing feature remains |
| Request provider records | Existing web request backend | Real provider/manual entry; create/resend/cancel wired; live cancellation accepted | Email acceptance for create/resend; uncertain-send reconciliation |
| Medical forms | Existing web/GPT flows | Shared catalog/autofill, real saves/share history/revoke | Physical-device access, signature parity and release review |
| Wellness/vitals/nutrition | Existing GPT work; fresh host checks open | Separate audit needed | Read/write journeys and units/validation |
| Export/deletion requests | Prior web/preview account-controls work | Separate audit needed | Native controls and approved operational fulfillment |
| Release safeguards | Multiple preview-only changes | Not release approved | Adults-only enforcement, retention, legacy links, dependency review, supported OS matrix |

## Historical implementation notes

Entries below describe their dated stage. Later acceptance supersedes earlier deployment
and missing-feature statements. Use the table above and ../release/READINESS.md for current gates.

## Current mobile assistant boundary

The main app sheet now submits authenticated requests, displays bounded in-memory
history, preserves failed drafts, prevents duplicate sends, times out requests, and
clears history/draft on account changes. Suggestions fill the input rather than
sending automatically. There is no OpenAI credential in the mobile app.

Before POST, the client requires the backend's mobileReadOnlyVersion=1 capability.
Older deployments fail closed with an update message. The backend filters available
tools and independently rejects execution of tools outside the reviewed allowlist.
Allowed tools: medical history, health records, coverages, medications, care team.
Mobile writes/shares/deletes remain disabled even when the model requests them.
This is a client mode restriction, not a replacement for backend ownership controls.

Local validation: JWT/capability/account-switch/error transport tests; allowlist
mutation/unknown-tool tests; Deno backend typecheck; actual Metro/Hermes iOS export.
No live assistant conversation or deployment was performed in this change.

## Implementation order

1. Deploy and test read-only assistant in preview with disposable accounts, including
   failure/empty states and denied write requests. Audit account-block checks first.
2. Add native sharing and provider-request actions with explicit confirmations and
   server ownership enforcement; remove sample provider data from those flows.
3. Audit forms, wellness, vitals and account controls against real user journeys.
4. Complete cross-product regression and production rollout gates. Do not declare
   parity from matching screens or a successful build alone.


## Preview assistant access verification — October 3

Read-only capability and tool execution restrictions deployed to preview. Added
verified-user checks plus active-account/block checks before each model round,
each tool and response delivery. Data queries use the caller JWT with the anon
project client; admin credentials are used only for account verification.
This is request-time enforcement, not a transactional erasure interlock; data
already sent to a model cannot be recalled if a block arrives afterward.

Live preview checks passed: capabilities, forged system-role history rejection,
blocked account 403, anonymous denial, and preservation of the second active
account (which reaches the provider configuration gate). Five access/policy unit
tests, mobile transport tests and backend Deno typecheck pass. Synthetic fixtures
were cleaned, with independent zero test-user/test-record inventory.

Live conversation/read-isolation and model-requested write-denial acceptance remain
OPEN: preview has no OPENAI_API_KEY. The function returns 503 for an active user
until configured; authentication/block enforcement runs before that configuration
check. No secret was copied from production. Production is unchanged.


## Native resend increment

Resend now opens a recipient/identity/request-content confirmation and calls the
existing authenticated resend endpoint. It displays email-service acceptance
separately from inbox delivery and from a replaced-link/email-failed result. Unknown
network/server/malformed responses leave an opaque owner/request marker in AsyncStorage,
blocking repeat sends across restarts until delivery is reconciled. No automatic retries.
The current UI does not resolve that marker; support reconciliation is still needed.
Received/cancelled/unknown statuses are unavailable for resend in this UI.

Removed the fabricated Email Sent timeline event (previously derived from created_at
or submitted_at). The local hide action now has an eye-off icon and accessible label;
it does not cancel or delete the server request. Real cancellation remains unimplemented.

Transport tests cover success, email-failed result, lost-response marker persistence,
malformed/rejected responses, missing auth and account changes. Actual iOS bundle
export passes. No live provider email or native confirmation UI acceptance performed.
Assistant live test was retried and still returns expected 503 for missing preview
OPENAI_API_KEY. Its synthetic accounts/records were cleaned; production unchanged.


## Native request creation increment

Provider selection now loads the signed-in user's real care team; empty/error states
allow manual entry. Both routes use one editable form and explicit recipient, record
type, priority, message and identity-disclosure confirmation before authenticated
request creation. Saved requests distinguish email-service acceptance from an email
failure; no inbox-delivery claim is made. Removed the default sample received banner.

An opaque hash of owner and normalized input retains pending status before sending
and a receipt afterward. Unknown outcomes block an identical retry across restarts.
This is client duplicate protection, not server idempotency; reconciliation remains
open. Tests cover validation, auth, success, email failure, lost responses, rejection
and account changes. Actual iOS Metro/Hermes export passed. No live email or native
confirmation UI acceptance was performed. Optional date-range parity remains open.

Cancellation cannot be implemented as a local hide: the inspected preview constraint
allows only pending/sent/received/failed. It needs a cancelled state, an owner-checked
server operation coordinated with upload receipt locks, and resend/upload guards.
Production unchanged.


## Native cancellation candidate — October 3

Added a reviewed Cancel request action and authenticated `/record-request/:id/cancel`
endpoint. The candidate SQL adds cancelled status and a service-only transition RPC:
owner/account checks, account advisory lock, row lock, token rotation/expiry, prepared
upload abandonment, and idempotent repeat cancellation. Received requests cannot be
cancelled; any records committed before cancellation remain. A trigger prevents older
clients reopening cancelled requests through direct updates. Resend uses the same
locked transition, and cancelled link reads are refused. Existing upload receipt
guards reject revoked tokens. An already in-flight email can still arrive with a
closed link; cancellation cannot recall an external email.

Validation: candidate and synthetic fixtures executed together on preview inside a
rolled-back transaction. Assertions passed for ownership, repeat cancellation, link
revocation, upload reserve/finalize rejection, abandonment, received-state refusal,
banned-owner refusal, direct-update reopening refusal and RPC execute permissions.
Mobile cancellation/create/resend tests, backend Deno check and iOS export pass.
Concurrent-session stress testing and native UI/HTTP acceptance remain open.

Not deployed: apply `20261003033411_request_cancellation.sql` to preview before
deploying the changed record-request function (resend now depends on this RPC).
Then verify cancellation through HTTP and the native UI. No production changes.


## Cancellation preview deployment and HTTP acceptance — October 2 (Denver)

Applied the cancellation candidate to preview roeudwddxvniazwufdqf and deployed
record-request afterward. Live tests with disposable accounts passed owner/anonymous
denial, idempotent cancellation, revoked portal/upload/resend, direct reopening
refusal, received-request preservation, and banned-owner denial without mutation.
Eight concurrent resend-RPC/cancel-HTTP races ended cancelled. No provider email
was sent; synthetic requests/users and the temporary key file were removed.

The initial banned-owner assertion expected 403; Supabase Auth rejected the token
with 401 first. The test now accepts either denial and verifies unchanged state.
Native transport tests pass. Native UI acceptance and upload-finalization race
stress testing remain open. Production is unchanged.


## 2026-10-02 (Denver) — Upload/cancellation race acceptance

Extended preview cancellation acceptance with real synthetic storage bytes and
upload receipts. Cancel-first, finalize-first and six concurrent finalization/cancel
checks passed: committed records survive, abandoned attempts cannot create records,
and revoked completion tokens cannot close or reopen requests. Eight resend/cancel
races and the previous ownership/auth checks also passed. Cleanup removed storage
objects, request-file rows, health records, receipts, requests and Auth users. An
independent inventory found zero synthetic users/requests/records. Temporary keys
removed. No emails sent or production changes.

Mobile review found cancelled/received/failed request cards displayed Sent. Corrected
status labels, renamed the mixed-state section Record Requests, hid resend on closed
requests and added visible/accessibility Cancelling progress. Actual iOS export passed
at /tmp/hv-cancel-states-export. This was code/build verification; native on-device
confirmation/result acceptance remains open.


## 2026-10-02 (Denver) — Native cancellation interaction acceptance

Used the installed iPhone 16 Pro / iOS 18.6 development client with the actual
RecordsScreen and a temporary entry wrapper that signed into a disposable preview
account. Observed through Device Hub: confirmation copy, Keep request leaving the
server status sent, visible Cancelling progress, Request cancelled success, detail
status cancelled, absent resend/cancel controls, refreshed Cancelled card and zero
active count. Reload retained the cancelled card.

A second synthetic request was changed to received on the server while its detail
was open. Cancellation displayed the accurate closed-request refusal and did not
change the server row. This revealed a stale detail sheet after errors; the error
acknowledgement now closes it to return to the refreshed list. That small follow-up
was bundle-checked, not re-exercised in the simulator. Offline/lost-response native
interaction and full-shell responsive layout remain separate acceptance work.

Normal index.js restored byte-for-byte, Metro stopped, simulator shut down, temporary
credentials/wrapper removed. Deleted synthetic requests/Auth user; independent
inventory confirmed zero fixtures. No emails or production changes.


## 2026-10-02 (Denver) — Native cancellation recovery acceptance

Cancellation now applies its 30-second deadline to both the HTTP response and JSON
body, including transports that do not reject when aborted. Unit tests cover stalled
fetch/body promises and safe retry after a simulated committed-but-lost response.

Exercised the actual Records screen in the full mobile shell on iPhone 16 Pro / iOS
18.6 against a disposable preview account. Temporary cancellation-only fetch faults
produced (1) failure before sending, with server status remaining sent, and (2) a lost
reply after real server commit, with status cancelled. Both showed the honest unknown
outcome alert. Acknowledging it closed the stale detail sheet; the refreshed list
showed Sent/1 active and Cancelled/0 active respectively. These were injected transport
failures, not an OS-wide offline test. Full-shell header/actions fit without the notch
collision seen in the earlier isolated wrapper; broader device/font-size coverage is
still open. Fixture authentication required one reload to settle its temporary session.

Restored normal index.js byte-for-byte, removed fault injection and temporary credentials,
stopped Metro and shut down the simulator. Preview cleanup independently confirmed zero
fixture users/requests. Cancellation tests and restored-app iOS export passed; Metro
continues to warn about cssInterop_transformerPath. No email or production changes.

Next: native Files-picker/upload interruption acceptance and provider connection flow.
Connect Provider currently has an empty handler; do not claim full mobile parity.


## 2026-10-02 (Denver) — Native provider connection entry

Replaced the Records Connect Provider no-op with a native provider-directory sheet.
It searches real organization names with escaped wildcard input, offers explicit
portal review and manual request fallback, reuses active owner-scoped connections,
and starts the same fhir-oauth-start endpoint used by the web app. Launch accepts
only HTTPS URLs without embedded credentials and checks for account changes and
closed screens before opening the browser. No Supabase session is placed in a URL.

Returning users explicitly check connection status against their own connection row.
Only active server status says connected; opening a browser never does. Connection
and record import remain separate, and the UI explicitly says no records have been
imported. Closing/reopening can recover an already-active connection by selecting
that provider again. Pending-flow restoration across app restart and a native import
review are still open; the current OAuth callback remains the existing web callback.

Tests cover auth, unsafe/invalid links, server errors, existing-connection reuse,
closed-screen launch prevention, search escaping and owner-scoped status checks.
Native upload transport/reselection/retry regression tests also passed. Live provider
portal authorization and native Files-picker/interrupted-upload interaction were
not run in this increment. No production deployment or provider authorization.


## 2026-10-02 (Denver) — Actual iOS document picker acceptance

Used the iPhone 16 Pro / iOS 18.6 development client with the actual UploadRecordForm
and ProviderConnectionForm in a temporary isolated screen. No valid account or API key
was supplied. Observed: Files picker opens; Cancel returns with Save disabled and Choose
file usable; a 45-byte synthetic text file saved locally through the iOS share sheet can
be selected through Files; its filename appears, categories become available, selecting
Lab results updates the checked category, and Save displays Working/Saving with controls
disabled. Authentication refusal then shows an error and restores enabled controls
while retaining the file and category. Empty provider search displays the expected
2–100-character validation. No provider authorization was attempted.

This verifies picker wiring, selection and failure recovery, not an authenticated
upload receipt or interruption after server commit. Those combined native acceptance
cases remain open, as does live provider OAuth. The earlier transport tests remain
separate evidence and must not be conflated with this UI run.

Restored normal index.js byte-for-byte, stopped Metro, shut down simulator and removed
all three files named hv-picker-synthetic.txt from this test simulator's containers
(source cache, Files copy and picker cache). No production changes or emails.


## 2026-10-02 (Denver) — Authenticated native picker upload recovery

In the iPhone 16 Pro / iOS 18.6 development client, exercised the real UploadRecordForm,
Expo Files picker, file IO/hash and upload transport against one disposable preview
account. A temporary wrapper waited for session initialization and injected one lost
HTTP reply after reading the server response. Selected a synthetic text file through
Files, chose Lab results, and observed disabled controls with Saving/Working. After
the injected loss, the UI correctly reported an unknown outcome and retained selection.
Independent server read found one lab record. Pressing Save again showed Saved, cleared
the selection and displayed server count 1; an independent read confirmed the exact
same record ID. No duplicate was created.

Changed upload feedback to replace internal batch/key terminology with same-file/category
retry guidance. Also separated list-refresh failure from upload failure: a confirmed
save remains reported as saved if its onSaved callback fails. These follow-up edits
have build verification; the observed native interaction preceded the copy change.

Restored normal entry byte-for-byte before the component edit, stopped Metro, removed
temporary credentials/wrapper/session and local synthetic files, and shut down the
simulator. Fixture cleanup deleted storage, record, attempts, batches and Auth user;
independent inventory returned zero fixture users/records. No production changes,
provider authorization or emails. This is an injected lost-response test, not an
OS-wide network interruption or app-kill test.

Remaining: live provider authorization/return and native import review; upload recovery
through an app restart with real picker reselection still has only separate harness
coverage from the earlier native transport test.


## 2026-10-02 (Denver) — Provider authorization recovery and preview prerequisites

Native provider selection now looks up the signed-in owner's latest pending connection
when no active connection exists. Reopening the sheet or restarting the app and selecting
the same provider recovers that server row without storing authorization URLs/tokens or
starting another OAuth request. Explicit Restart authorization bypasses pending reuse;
active connections still take precedence. Pending and inactive/revoked statuses now have
distinct truthful messages. Closed-screen protection runs before starting authorization.
Focused recovery/auth/URL/status tests and restored normal iOS export passed. This is
helper/build evidence, not a completed provider-portal or app-restart UI acceptance run.

Preview schema inspection found missing authorization_endpoint/token_endpoint/smart_scopes
columns and no fhir_oauth_states table. Applied the minimal prerequisite migration in
supabase/operations/candidates/20261003043000_preview_fhir_oauth_schema.sql to preview only.
Unlike the historical pilot migration, it does not seed or enable a provider. OAuth state
has RLS, no anon/authenticated privileges, and service-role access; verified after apply.
No configured preview organizations exist yet. Live provider authorization therefore
remains unverified and needs a configured sandbox provider/client before acceptance.

Callback review also identified remaining release work: redirect_after needs an allowlist,
state consumption needs atomic replay protection, and activation needs active-account
checks. These are not fixed by the prerequisite schema or mobile recovery work. No
production changes, provider consents, imported data or emails in this increment.


## 2026-10-02 (Denver) — OAuth callback hardening in preview

Restricted requested return URLs to the configured app origin's fixed
/connect/fhir/complete path, without credentials, query parameters or fragments.
The callback repeats validation for stored legacy return URLs and uses generic error
text so provider/database details do not enter browser URLs. Added GET-only callback
handling and runtime connection-method validation on start.

Callback now conditionally updates an unconsumed, unexpired state before exchanging
the authorization code. Concurrent claims contend on the same update; only its returned
row proceeds. A failed exchange requires a fresh authorization (state is not reopened).
Checks active account before exchange. Final activation uses a service-only invoker RPC
with the existing account-erasure advisory lock, active-account/block checks, unexpired
claimed state, matching owner/organization and pending-only update. Repeated activation
cannot replace stored tokens or report success for an absent/replaced connection.

Applied 20261003050000_fhir_activation_guard.sql to preview and deployed fhir-oauth-start
and fhir-oauth-callback there. SQL assertions in a rolled-back synthetic transaction
passed unclaimed/expired/banned/repeated refusal, successful single activation, token
preservation and client-role denial. Independent fixture inventory is zero. Return-URL
unit test and Deno checks passed. Live preview HTTP smoke passed anonymous-start 401,
callback POST 405 and sanitized error redirect. These tests do not certify an actual
provider authorization exchange or a concurrent external-provider callback run.

Production unchanged. Next: configure a preview sandbox provider/client and perform
real authorization/return and import-review acceptance; preview currently has no
configured provider organizations.


## 2026-10-02 (Denver) — Live SMART sandbox authorization acceptance

Configured preview-only FHIR_CLIENT_ID=health-vault-preview-sandbox and
APP_URL=http://localhost:5173. Added SMART Health IT Sandbox (Preview Test Only)
to the preview provider directory using the official launcher's Patient Standalone
Launch configuration. Plain /v/r4/auth/authorize failed before state consumption;
the generated /v/r4/sim/<configuration>/auth endpoints completed authorization.
See FHIR_SANDBOX_ACCEPTANCE.md for the reusable configuration.

A disposable preview account started authorization (foreign return URL rejected),
then the actual sandbox demonstration login/consent completed code exchange. An
owner-authenticated read confirmed active status; server checks confirmed token,
patient identifier and claimed state. Four concurrent consumed-state callback
replays returned error redirects and preserved connection ID, status and updated_at.
This is replay-after-success evidence, not a simultaneous initial-code exchange test.

Fixed the completion page's misleading signed-out failure: it now renders existing
Sign In UI, retains the connection URL, and reloads to repeat owner-scoped verification
after login. Mobile users are directed to return and tap Check connection. Observed
the signed-out browser screen and passed npm run build. Post-login completion UI was
not exercised in this run. Existing unrelated EOF whitespace warnings remain outside
this change.

Removed the disposable account, provider connection and temporary credential files;
independent preview counts confirmed zero remaining test accounts/connections.
The reusable synthetic provider configuration remains. No clinical records imported,
no production deployment and no email sent. Native return/restart and import-review
acceptance remain open.


## 2026-10-02 (Denver) — Native provider return checks and preview persistence

Mobile provider connection screen now checks its owner-scoped pending receipt when
AppState transitions from background/inactive to active. It keeps the manual Check
connection button, suppresses overlapping return checks, removes the listener on
unmount, and does not start authorization or import records on return. Confirmed
connection feedback survives a failing records-list refresh; closed screens no longer
receive run error/final state updates.

Fixed fhir-sync ignoring preview insert errors/missing IDs: failed persistence now
returns 500 without a success receipt or sync timestamp update. Refreshed-token writes
must also succeed before fetching the preview. Pinned Supabase dependency consistently
with the OAuth handlers and corrected its client/connection TypeScript annotations.

Passed provider-return transition/overlap/retry/unmount tests, existing provider
connection tests, full preview-handler tests with injected persistence failures, Deno
check and actual Metro/Hermes iOS export (/tmp/hv-provider-return-export). These are
local code/build tests: no new native UI or live import acceptance was performed, and
fhir-sync changes have not been deployed. Production unchanged.

Remaining: actual native browser return/restart acceptance; preview import active-account
and concurrent erasure review; reviewed native import UI with durable duplicate protection.


## 2026-10-02 (Denver) — FHIR preview account-erasure interlock

Applied fhir_preview_guard candidate to preview and deployed fhir-sync there. The
handler checks active account before provider access; refresh and preview writes now
use service-only invoker RPCs with the existing hv-account advisory lock. Writes refuse
blocked/banned/missing owners, foreign or inactive connections and stale token snapshots.
Refresh uses compare-and-set so an older request cannot overwrite a newer token.
Preview persistence returns a real job ID or refuses the result; it no longer updates
last_synced_at, because fetching a preview has not imported any records. Handler input
validation handles null/malformed JSON and error responses hide provider/database details.

Full-handler injected tests passed malformed input, blocked account before fetch,
ownership filtering, RPC error/refusal, valid receipt and failed/stale refresh. Deno
check passed. Rolled-back SQL tests passed ownership, token compare-and-set, banned and
erasure-blocked accounts, inactive connection, preview-only state, unchanged sync marker
and restricted RPC permissions. An initial test used unsupported status 'disconnected';
corrected fixture to valid 'pending' and reran successfully. Independent inventory is
zero; service_role permission present and client/anon RPC permissions absent. Deployed
endpoint returned 401 to an unauthenticated POST.

This does not yet prove a concurrent two-session erasure race or end-to-end live FHIR
fetch/import review. No production changes. Next: concurrent interlock acceptance and
actual native return/review flow, then durable confirmation/import handling.


## 2026-10-02 (Denver) — Concurrent FHIR block acceptance; remove sample preview fallback

Added/reran preview-only HTTP acceptance for save_fhir_preview and
refresh_fhir_connection against operator_block_reviewed_account. Each operation ran
block-first, write-first and six simultaneous request pairs. All post-block writes
were refused; preview rows stayed status=preview with no completed_at and no sync marker.
Observed preview outcomes: 2 writes accepted before block, 6 refused; refresh: 4/4.
The authenticated fhir-sync endpoint refused a blocked synthetic account with 403.
An initial harness assertion expected 200 instead of the void block RPC's normal 204;
fixtures were cleaned, assertion corrected and the complete run passed. Removed all
16 disposable users, connections, previews, deletion requests, blocks and test provider;
independent inventory confirmed zero test users/providers. Temporary key file removed.
These are real concurrent HTTP requests, not a forced lock-contention schedule.

Found web fetchProviderRecordPreview checking a token absent from its selected columns,
then generating sample clinical records and persisting another preview job. Removed
all sample fallback generation and client preview inserts. The client verifies signed-in
owner/active connection, invokes live fhir-sync without exposing tokens, requires a
persisted FHIR receipt, and shows an error for unavailable/unconfigured provider data.
A real empty provider response remains a valid empty preview. Tests cover auth mismatch,
pending status, failed fetch, missing receipt, scaffold rejection and server receipt reuse.
Web build passed. Web changes remain local; no production deploy or patient data edits.

Remaining: native portal return acceptance and durable reviewed clinical import. Existing
medical-import service still needs duplicate/partial-failure handling before mobile reuse.


## 2026-10-02 (Denver) — Atomic reviewed provider import in preview

Added preview-only confirm_fhir_preview transaction and fhir-import authenticated Edge
Function. Confirmation accepts persisted job ID plus selected item indexes, never client
clinical values. It acquires the account-erasure lock, checks active owner, locks the
preview and connection, and atomically saves selected clinical rows, dedup markers,
Records summary and completed receipt. Repeating the same selection returns the receipt;
changing an already confirmed selection is refused. New previews skip exact same
provider/patient/item fingerprints. This is exact-source deduplication, not clinical
reconciliation of edited or differently sourced records. Unconfirmed previews expire
for confirmation after 24 hours.

Revoked browser insert/update on preview jobs so clients cannot forge preview values or
confirmation receipts. New service-only fhir_import_items table has RLS and auth-user
cascade deletion. No clinical values are logged by the replacement web importer. Web
review carries original preview indexes and uses server confirmation; list refresh
failure cannot turn a committed receipt into an apparent import failure. UI shows
already-imported counts. Medication dosage is no longer guessed from display names.

Applied candidate fhir_import_confirmation.sql and deployed fhir-import to preview only.
Rolled-back SQL acceptance passed four-category import, invalid-date batch rollback
(including dedup rows), same-receipt retry, changed-selection refusal, repeated-preview
deduplication, no duplicate summary, account-block refusal and restricted permissions.
Independent inventory: zero synthetic users/import markers. Endpoint unauthenticated
POST returned 401. Deno check, web build and focused client auth/payload/receipt/retry
tests passed. No production deployment or real patient data changes.

Remaining: authenticated endpoint concurrency/lost-response acceptance, rendered web
confirmation flow, native import review UI and real native portal return. Production
rollout must include schema plus endpoint before deploying the changed web client.


## 2026-10-02 (Denver) — Authenticated import confirmation concurrency acceptance

Added scripts/test-fhir-confirmation-preview.mjs and ran against deployed preview
fhir-import with two disposable authenticated accounts and synthetic medical values.
Six simultaneous confirmations of the same job returned identical completed receipts.
A subsequent repeat, representing a client that ignored/lost the first response,
returned that same receipt; independent reads showed exactly one row in each clinical
category and one Records summary. This is ignored-response recovery, not a network
proxy dropping the response in the rendered UI.

Anonymous/foreign-owner/unconfirmed requests were refused, as was a changed selection
for an already completed job. A fresh preview of the identical items skipped all four
as duplicates. A deliberately invalid second record returned failure and preserved
exact prior clinical/dedup counts, proving rollback through the deployed endpoint.
After a reviewed account block, confirmation was refused with 403.

Removed synthetic clinical rows, receipts, dedup markers, connections, deletion request,
blocks, sessions, accounts and provider; independent inventory confirmed zero users,
provider, test conditions and import markers. Removed the temporary credentials file.
Focused import client and provider-preview tests also pass. Production unchanged.

Remaining: rendered web import/retry acceptance and mobile review UI/portal return.


## 2026-10-03 — Web confirmation retry UI acceptance

Fixed Try Again to retain and resubmit the exact pending job/selection instead of
returning to provider search. Added an in-flight confirmation guard; explicit Back
abandons the pending request, while a completed receipt clears it. Verified the actual
ProviderRecordConnectionFlow and ImportReviewDialog in an isolated Vite harness with
synthetic adapters and the real import client. First confirmation simulated a committed
write with lost response: the screen showed uncertain status; Try Again submitted an
identical payload and displayed Import Complete. An injected list-refresh exception
left completion intact. This is UI fault injection, separately supported by the prior
live endpoint concurrency/receipt tests; it is not one combined live-browser test.

Screenshot inspection caught invisible white-on-white primary actions. Switched the
flow's affected buttons to action-primary/content-on-action tokens and verified visible
Done. Reconfirmed after hot reload: three identical attempts, one simulated record.
Evidence: /tmp/health-vault-import-retry.png. Web build and import-client tests passed.
Test server stopped and temporary browser tab closed. No backend or production changes.
Remaining: native import review and actual portal-return acceptance.


## 2026-10-03 — Mobile reviewed provider imports

Added ProviderImportReview to active provider connections with real fhir-sync preview,
selectable accessible record rows, explicit confirmation, empty state, cancellation,
progress/error feedback and per-category receipt total/duplicate count. Mobile sends
only preview ID and selected indexes to the same tested fhir-import endpoint. Confirmed
imports refresh Records and vault statistics without negating success on refresh failure.

Before dispatch, the adapter persists an owner/connection-scoped confirmation request
in AsyncStorage (job ID/indexes only, no clinical values). Fresh callers recover that
same request; loading a new preview or changing the pending selection is blocked until
recovery. Requests have a 30-second client deadline and preserve uncertain outcomes for
retry. Account ownership is rechecked around asynchronous operations. Successful receipt
remains successful if local cleanup fails; a later retry recovers the server receipt.

Focused adapter tests passed pre-send storage failure/no dispatch, owner isolation,
selection payload, uncertain response, fresh-caller recovery, exact retry and cleanup
failure. Existing provider-connection tests pass. Final Metro/Hermes iOS export passed
at /tmp/hv-mobile-import-export-final. These are helper/build checks, not an observed
native UI/restart/portal acceptance run. No real clinical data, emails or production
changes. Next: actual device review/selection/retry/restart and portal-return acceptance.


## 2026-10-03 — Native import review and restart acceptance

Observed actual ProviderImportReview on iPhone 16 Pro / iOS 18.6 through Xcode Device
Hub. Used an isolated development harness with the real native component, adapter and
AsyncStorage; provider/API results were synthetic and no authenticated backend calls
were made. Verified preview with two selected records, Cancel review, reopening,
unchecking one item, Confirm import (1), lost-response uncertainty and recovery action.
Terminated/relaunched the app: pending request survived and Check or retry import
returned the same one-record receipt. The harness rejects a changed selection. Injected
list refresh failure preserved Import complete and showed a reopen-to-refresh message.

Evidence: /tmp/health-vault-mobile-import-recovery.png. Reset synthetic storage keys via
the harness, closed the test app, restored index.js byte-for-byte from its pre-test
backup, stopped Metro, and exported the normal app successfully. Harness remains under
apps/mobile/tests and is not imported by the normal entry. Initial setup needed isolated
placeholder Supabase environment variables and a functions-client getter override;
after correction the full native UI sequence passed.

This proves native UI/restart behavior with simulated responses; prior authenticated
endpoint tests separately prove server atomicity and receipts. Combined native live
provider OAuth return and import remains a release gate. Production unchanged.

### 2026-10-03 — Combined native live sandbox acceptance

The real native provider connection and import-review components passed a combined iPhone 16 Pro / iOS 18.6 simulator run against the preview backend. A disposable user authorized the public SMART demo patient in Safari, returned through the iOS app breadcrumb, and saw the connection verified automatically. Live review returned 16 items; explicit confirmation saved 3 conditions, 2 medications and 11 immunizations, with one Records summary. Independent database reads matched the durable receipt and native completion message. Authorization alone saved no clinical rows.

This run found and fixed the unbound `Linking.openURL` callback. It used a temporary shell/session bootstrap, not mocked service calls. Fixtures and session were removed afterward. Full Records-screen refresh, physical-device/Android acceptance and production provider registration remain separate gates. Medication reference mapping also needs correction: the live source produced two generic “Medication” labels. Do not treat this run as production release approval.

### 2026-10-03 — Medication mapping clarification

The two generic medication names in native acceptance are confirmed upstream sandbox placeholders (`medicationCodeableConcept.text = "Medication"`, no code or reference), not a reference-mapping failure. Do not replace them with guessed drugs. Separately, shared FHIR preview mapping now supports contained/included Medication resources and reference display names, and requests MedicationStatement's medication include. Both web and mobile consume the same server preview. Reference URLs are not fetched; included Medication resources are excluded from statement/import counts.

### 2026-10-03 — Complete native Records screen refresh

Actual iOS simulator UI acceptance now covers RecordsScreen with real hooks and provider import components under synthetic transport adapters. Importing from the Lab Results filter switched to All, showed the saved provider summary and updated total/last-sync without restart. Injected statistics failure preserved import success and displayed a refresh warning. Hook regressions verify stale-response exclusion and error propagation. Upload and pull refresh also refresh statistics. This does not replace live full-screen or physical-device/Android acceptance. A date-only display timezone defect was identified for follow-up.

### 2026-10-03 — Record service date parity

Web record cards/document details and native record cards/details share a calendar-date formatter. Date-only values preserve their supplied day across timezones, while timestamp values retain local-time display. Five-timezone regressions and native card/detail observation pass. Native Records header now places its title above wrapping actions, verified at normal and 320-point test widths. No backend behavior or patient records changed.

### 2026-10-03 — Live full-screen Records acceptance

The complete native RecordsScreen now has live preview acceptance on iPhone 16 Pro / iOS 18.6. Using a disposable account and public SMART demo patient, the actual screen completed OAuth, foreground return, review and confirmation, then refreshed from Lab Results to All with the import summary visible, count 1, connected provider 1 and current last-sync date without restart. Independent reads matched the 16-item durable clinical receipt and one Records summary. Authorization alone imported nothing. Session and fixtures were removed and cleanup verified. Only shell/session setup was substituted; service calls were live. Physical iPhone and Android acceptance remain open; this is not a production release approval.


### Native Medical integration — 2026-10-03
Replaced demo state with real patient-scoped form responses, shared web catalog/autofill, explicit save receipts, authorized share requests and share-history revocation. Uses authenticated user ID for share ownership and patient_profiles.id for form responses. No live operation has been accepted yet. The share endpoint lacks a client retry identity: native blocks repeated sends after an unknown outcome using a durable owner-only marker; reconciliation and duplicate-safe retry remain required. This implementation is not production parity approval.
