# Remaining live acceptance

Latest update: MCP v130, 90 isolated tests plus package typecheck pass. The approved
replacement link is now expired and returns HTTP 410 / Share expired on viewer,
PDF and bundle endpoints. Atomic health-save SQL tests passed under two simulated
identities and rolled back all fixtures; real OAuth mutation isolation and normal
owner-authenticated revocation are still separate pending gates.

Status: approved email delivered and recipient opened the scoped form; MCP version 129,
84 passing isolated tests. ChatGPT metadata refreshed with the widget domain warning
cleared. Database isolation tests used synthetic JWT identities and rolled back;
they do not establish browser OAuth isolation. Gmail initially classified the email
as spam; inbox placement is not established by provider delivery.

## Setup

- Identify the approved recipient email, completed form, expiration, and whether a
  patient receipt is wanted. Review the exact share card before confirming it.
- Prefer an existing synthetic test form/account. Creating synthetic health records
  in a personal account is not part of this test without explicit authorization.
- Use separate browser profiles for account A and account B; the user handles sign-in.
  Keep private form content, passwords, OAuth codes, and bearer links out of reports.
- Verify CSP enforcement remains enabled and request fresh cards; do not reconfirm
  historical cards created before durable share receipts were deployed.

## Share confirmation

1. Request a preview for the approved form and recipient. Confirm the rendered form
   title, recipient, scope, expiry, and receipt option match the intended disclosure.
2. Click Confirm & Email once. Verify visible pending state and then a terminal
   success or error message. Incidental host updates must not reset the card.
3. Check the corresponding share record and delivery audit read-only. Record one
   share ID and provider acceptance status; do not include the token in the report.
4. Ask the recipient to confirm inbox receipt and correct form access. Provider
   acceptance alone does not pass inbox-delivery acceptance.
5. Check the patient receipt, if requested, accurately describes delivery status.
   An ambiguous outcome must not prompt another click or automatic resend.
6. Revoke the specific test share only as part of approved cleanup and verify the
   recipient link no longer reveals the form. Expiry/token rejection already have
   isolated tests; live verification must use only the approved test share.

## Two-account OAuth isolation

1. Connect account A to its ChatGPT session and confirm the dashboard identifies A.
2. Connect B in a separate browser profile and confirm the dashboard identifies B.
3. With synthetic fixtures owned by A, attempt owner-only reads and mutations from
   B using the normal authenticated app/tools. Expect denial or no accessible row;
   verify A's fixtures are unchanged. Include form response, proposal, share history,
   and revocation access. Never substitute an admin/service credential.
4. Inspect pending confirmation cards across disconnect/reconnect: an A-specific
   proposal must not be usable while connected as B. Use only authorized fixtures.
5. A recipient bearer link is an intentional disclosure mechanism, not an owner API;
   distinguish its scoped access from the owner-only checks above.

## Evidence and exit criteria

Record app version, browser, CSP setting, scenario, expected/actual result, and
sanitized share/proposal identifiers. Mark unrun steps pending. No broad-release
sign-off until the remaining browser checks pass; other health-write concurrency
and full production/source reconciliation remain separate tracked work.

## Security acceptance — 2026-09-20 13:00 UTC

- Follow-up at 13:03 UTC: exact second-account OAuth permission approved by user.
  Both accounts appeared connected on inspection. Fresh ChatGPT conversation
  `6aafd93d-a258-83e8-bba2-7abeca572dc4` used the AOL connection and returned its
  account email, zero dashboard counts, and no appointment. The visible widget
  matches its empty web dashboard. Basic account-specific read routing passes;
  cross-owner proposal/mutation denial through OAuth remains pending. The card
  initially displayed CSP off while Security settings reported Enforce CSP enabled;
  do not count this card as verified CSP acceptance.

- Read-only requests to deployed share service v63 rejected the previously revoked
  test share with HTTP 403 / Share revoked for viewer JSON, PDF, and bundle routes.
  Incorrect tokens for the active approved test share returned HTTP 403 / Invalid
  token on all three routes. Responses contained errors only, no form data.
- Expanded isolated handler tests to cover revoked, expired, and wrong-token denial
  on all three routes before form reads. All 84 MCP tests pass. Live expiry of the
  approved replacement remains pending until after 13:23:04 UTC; tests do not
  substitute for that live check or an owner-authenticated revocation round trip.
- Second Health Vault browser session identifies the AOL test account with an empty
  dashboard. ChatGPT Connect another account opened consent for that account.
  Automatic approval review rejected Allow access; exact approval requested for
  ChatGPT to read that account's email and health summary. No second OAuth grant
  made, no sign-out, and cross-owner OAuth acceptance remains pending.
- Refreshed ChatGPT plugin actions. The medical-form share template now shows
  widgets.healthvault.me in both domain metadata fields and healthvault.me in
  redirect_domains. The missing widget-domain submission warning disappeared.
  This confirms metadata refresh, not a fresh end-to-end widget interaction pass.

## Live attempt — 2026-09-20 00:56 UTC

- User approved Patient Registration and a specific recipient. Fresh ChatGPT card
  displayed 13/13 fields, the exact recipient, one-hour expiry, and no patient receipt.
- Clicked once: button disabled with pending feedback, then displayed email failure
  and the created-share state. No automatic second send was attempted.
- Share `50afda34-56ea-4b9c-9d32-f86ad0f80268` was created with expiry
  `2026-09-20T01:56:44.756Z`. Read-only audit verified Resend HTTP 422:
  invalid `from` field format. Recipient delivery was rejected, not accepted.
- Requested the intended verified sender before replacing `RESEND_FROM_EMAIL`.
  Do not reset durable receipts or blindly retry. This failed completed share is
  retained for audit; sender repair and a controlled recovery are still pending.
- Second-account browser sign-in remains pending. No cross-account pass claimed.

### Sender repair and second-account progress

- Supabase accepted the corrected `RESEND_FROM_EMAIL` setting: `Health Vault
  <team@healthvault.me>`. Resend domain verification still needs dashboard login.
- Earlier rejected share was still unexpired during this check; did not bypass the
  receipt guard, reset receipts, create another share, or resend.
- Second account is signed into the in-app Health Vault browser. Its dashboard
  identifies the test account and shows zero health records, forms, appointments,
  and medications. ChatGPT OAuth account-switch and owner-API tests remain pending.

### Resend verification — 2026-09-20 01:02 UTC

- Authenticated Resend domain detail confirms root `healthvault.me` DKIM, sending MX,
  and SPF records are Verified, with sending enabled. Its Partially Failed overall
  status concerns receiving MX conflicts and tracking CNAME; neither was changed.
- Original failed share remains active. Requested explicit approval for revocation
  of `50afda34-56ea-4b9c-9d32-f86ad0f80268` before replacing it with the same approved
  one-hour Patient Registration disclosure. No retry, revocation, or resend yet.

### Approved recovery — 2026-09-20 01:05 UTC

- User explicitly approved revoking the failed share and sending one replacement.
- Connector/browser revocation attempts failed. Per exact user authorization, a
  backend update constrained by share ID, recipient, failed delivery, and active
  status revoked the old share and appended an audit event. This is administrative
  recovery and does not pass the end-to-end revoke-tool acceptance test.
- Replacement button clicked once; returned an unverified internal-error state.
  Read-only checks found no new share and the prior durable receipt unchanged.
- Supabase invocation logs: failed POSTs at 01:03:27–01:05:12 UTC were 401; original
  preview/send at 00:56 UTC were 200. Public GET remains 200. Requires reconnecting
  the original owner account before continuing. Second-account sign-out may have
  invalidated the original session; causation not established.

### Resend DNS repair — 2026-09-19 local evening

- Cloudflare had no root MX or tracking CNAME. Added `talk` CNAME to
  `links1.resend-dns.com`, DNS only, Auto TTL.
- User explicitly approved receiving through Resend. Added root MX to
  `inbound-smtp.us-east-1.amazonaws.com`, priority 10, Auto TTL.
- Cloudflare authoritative server and public resolver 1.1.1.1 both return the
  exact new records. Existing sending records and Worker hosting remain intact.
- Restarted Resend verification after DNS propagation. Provider status pending;
  no inbound test or replacement medical-form email sent during DNS repair.

### Successful replacement — 2026-09-20 12:23 UTC

- User reported DNS verified and completed original-account reconnect. Authenticated
  summary returned the intended original account successfully.
- Clicked the existing approved card once. Pending state transitioned to email
  accepted, Secure share created, and a one-hour expiry; confirmation button removed.
- Resend email `01a0bec5-1d48-72fb-9245-d6606d085191` shows Delivered to
  `ottoart27@gmail.com` from `Health Vault <team@healthvault.me>` at 12:23 UTC.
- New share `72e76ad0-3c05-4597-81e5-1d6b49aa9b00` expires at 13:23:04 UTC.
  Emailed URL renders one read-only Patient Registration form and logs access.
- Widget Open secure share did not visibly navigate in this test; recipient URL
  was opened from the delivered-email preview. Navigation follow-up remains.
- No duplicate send or patient receipt. Cross-owner OAuth and expiry/revocation
  acceptance remain separate from this successful delivery check.


## 2026-10-02 — Wellness check-in widget hardening (MCP v132)

- Confirmed fresh production was v131; deployed only the Nourished Rebel widget source change, preserving the other 31 source files.
- Widget URI v5 uses the shared legacy/standard host bridge. Saves disable controls, reject repeated clicks, preserve editing against incidental output, and validate enrollment and the exact returned answer/skip before showing saved feedback.
- Empty input no longer enrolls a user. Missing/error responses stop for verification instead of claiming success or allowing resubmission. Completed six-question check-ins no longer restart at question one.
- Validation: 108 passing Node tests (8 new dual-host wellness tests), isolated package TypeScript check, whitespace check excluding preserved baseline EOF blanks. Fresh production v132 matches all 32 tested source files; discovery HTTP 200 and unauthenticated POST HTTP 401.
- No health records, enrollment, answers, or emails were created during verification. Fresh CSP-enforced browser acceptance, real OAuth negative writes, independent-session concurrency, and operational/privacy release gates remain outstanding. This is not production-readiness approval.

## 2026-10-02 — Reconnect and fresh browser read-only acceptance
- User signed in; resumed the existing secondary connection and ChatGPT reported connected, now labeled Timothy's Health Vault account. No new scope approval or permissions changes were made.
- Read-only wellness backend returned HTTP 200. Initial card rendering still failed; after refreshing metadata in the secondary account context and retrying, the existing wellness card rendered successfully.
- Live Start check-in opened question 1. Save & continue with an empty textarea displayed “Enter an answer or choose Skip.” No enrollment, answer, insight generation or record save was dispatched by this validation path.
- Fresh dashboard also rendered and identified godesigngo@aol.com with zero condition/medication/allergy/record counts. ChatGPT prose initially claimed no card, but the actual rendered iframe was present; visual/DOM evidence takes precedence.
- Evidence: /tmp/health-vault-reconnect-validation.png; conversation https://chatgpt.com/c/6abfcc3e-0948-83e8-a787-8fdce9d3b661.
- This passes read-only rendering and blank validation, not real save/error/timeout acceptance or a fresh explicit CSP-settings verification. Two-account negative writes, independent-session concurrency and operational release gates remain open. No code deployment this turn.

## 2026-10-02 — Real OAuth revoke acceptance and MCP v133
- Created two tightly scoped disposable share fixtures: empty form lists, no usable token, expired, no health payload/email. One belonged to the signed-in AOL account and one to a synthetic owner.
- Through the existing ChatGPT OAuth connection, requested revoke_health_share once per fixture. Foreign-owner request was rejected and database verification showed no change. Owner request succeeded; database showed revoked=true/status=revoked with timestamp. This proves a real OAuth negative revoke and positive owner revoke, not two separately logged-in OAuth sessions or an active-token lifecycle test.
- Both exact fixture rows were deleted under ID/note/owner constraints and zero remaining rows verified.
- Fixed unhelpful zero-row revocation error via maybeSingle + explicit unavailable/not-found/already-revoked message, preserving row-level security and filters. 111 tests and frozen Deno entrypoint check pass.
- Deployed only health-sharing.ts change from fresh v132 snapshot as v133. Fresh snapshot matches all 32 candidate files; GET discovery 200, unauthenticated POST 401.
- Evidence: /tmp/health-vault-oauth-revoke-test.png and existing chat 6abfcc3e-0948-83e8-a787-8fdce9d3b661. Screenshot shows the pre-fix raw error from the successful negative test.
- Simultaneous saves remain untested: need two independently controllable DB sessions. Asked user to identify dedicated staging project (no credentials in chat). Existing preview branch belongs to another PR and was not repurposed. No new infrastructure created.

## 2026-10-02 — Real OAuth foreign form-proposal rejection
- Created one disposable proposal owned by the primary account, with a synthetic patient reference, test-only template/text and expired timestamp. It contained no health information and could not save a valid form.
- Requested confirm_form_answers once through the connected AOL OAuth account. Actual tool response: “This form proposal was not found or does not belong to you.” This is ownership rejection, not merely expiry rejection.
- Database verification: pending, all confirmation/consumption timestamps null, exact fixture payload unchanged, zero form responses for the synthetic patient reference.
- Deleted exact proposal under ID/owner/template constraints; verified zero remaining live/rollback fixtures.
- Added supabase/tests/form-proposal-isolation.sql with owner IDs supplied through session settings. Live rollback run passes owner read, cross-account read/update/delete denial, forged insertion and ownership-reassignment denial.
- Screenshot: /tmp/health-vault-oauth-proposal-test.png. Existing test conversation remains 6abfcc3e-0948-83e8-a787-8fdce9d3b661.
- The failed-call widget displayed “Loading medical forms…” while ChatGPT correctly reported the tool error; terminal error presentation still needs review. No source change or production deployment this turn.
- Concurrency still requires an explicitly selected staging database and two independent sessions. Existing preview branch is attached to another PR, so was not reused.

## 2026-10-02 — Failed medical-form card fix, MCP v134
- confirm_form_answers now returns structured error content as well as isError/text. Shared widget host delivers standard tool-result errors to subscribers; parent-source validation and mutation locking remain unchanged.
- Medical form interview resource v2 renders an escaped terminal error with Check Health Vault. Unexpected results and missing responses (30 seconds) no longer remain indefinitely loading. The card never retries a save or claims an uncertain result was saved/unsaved.
- Full suite: 118 tests passed; an additional host-lock regression passed in a focused 12-test run (119 tests total now). Frozen Deno 2.9.6 entrypoint check passed with network access after sandbox npm DNS failure.
- Deployed only three changed production files from a fresh v133 snapshot. Fresh v134 retrieval matches all 32 candidate/local files. Discovery GET 200, unauthenticated POST 401. No commits, health-data changes, or email sends.
- Live ChatGPT browser acceptance passed after metadata refresh: one call using the previously deleted disposable proposal displayed the actual rejection inside the new card, with “Check Health Vault” and no loading placeholder. DOM and screenshot verified independently of ChatGPT prose. Evidence: /tmp/health-vault-form-error-fixed.png. No new fixtures were created. Timeout behavior is unit-tested, not independently exercised in live ChatGPT.
