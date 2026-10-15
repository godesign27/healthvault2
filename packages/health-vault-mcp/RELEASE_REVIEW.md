# ChatGPT widget release review — 2026-09-19

Current deployment: `health-vault-mcp` version 131. See `PRODUCTION_READINESS.md` for
current gates and validation (100 tests and package typecheck). Source parity now covers
all 32 deployed MCP files; the remaining dated findings below are historical.
This targeted confirmation-flow
review began at version 122; the dated/versioned findings below retain that history.
It is not a full security audit.

## Follow-up: version 127 — accurate patient email receipts

- Patient receipts previously said the recipient email was sent even when delivery
  failed. They now distinguish service acceptance from an unconfirmed request;
  neither outcome promises inbox delivery. Unconfirmed outcomes direct the patient
  to check share status before retrying.
- All 73 tests pass. Six new mocked cases exercise both package and deployed-edge
  implementations for accepted, rejected, and timed-out recipient requests, including
  escaped recipient names and no secure token in the patient receipt.
- Deployed only the email helper on the fresh version-126 source snapshot, preserving
  unrelated live files. No real email or health-record mutation occurred.
- Final acceptance needs an approved recipient/form and two signed-in accounts.
  Follow `LIVE_ACCEPTANCE.md`; it separates browser evidence from existing SQL tests.

## Follow-up: version 126 — durable share/email receipts

- Added private owner-scoped `share_confirmation_receipts` and security-invoker
  claim/completion RPCs. The claim is committed before a link or email is created.
  Equivalent normalized requests reuse a completed active share. Concurrent or
  interrupted pending requests never automatically dispatch another delivery.
  Revoked, expired, or deleted completed links permit a new explicit confirmation.
- General-share identities include the selected snapshot; medical-form identities
  include the form revision, recipient, receipt choice, and patient identity.
  A different snapshot, revision, recipient, or other input is a different request.
  This is duplicate-dispatch protection, not an external email delivery guarantee.
- Fixed production drift: the deployed medical-form helper was the old non-email
  implementation even though its registered tool promised email. Deployed the
  repository's email implementation with the durable guard. Preserved the live
  general-sharing `vitals` category and synchronized it into the worktree.
- All 67 Node tests pass, including the actual medical-form helper with a mocked
  sender, repeated/concurrent calls, and lost delivery/receipt responses.
- Database tests passed for pending claims, result reuse, owner isolation,
  cross-owner revocation rejection, and revoked/expired replacement. Rolled back
  every fixture; follow-up counts confirmed no receipt/share fixtures remained.
  Anonymous RPC execution is denied. No real emails were sent.
- A pending receipt deliberately has no automatic timeout/release. Recovery
  requires inspecting the matching share and delivery service before clearing
  or completing it; never blindly reset it or resend after an ambiguous failure.
  Historical shares created before these receipts are not deduplicated by this
  mechanism. Do not reconfirm an old pre-upgrade card just to test it.
- A fresh medical-forms catalog rendered in ChatGPT with CSP enforcement enabled; no form was started or changed.
- Remaining: atomic duplicate checks on other health-data writes, all live
  confirmation/share CSP paths with legitimate test inputs, and browser OAuth
  isolation across two signed-in accounts.

## Follow-up: version 124

- Life Signal, general sharing, standalone form review, form interview, and form
  email sharing now embed one shared host bridge. It supports standard
  initialization/calls and legacy calls, ignores unrelated/repeated globals,
  preserves confirmation state, rejects tool errors, and bounds waiting to 30
  seconds. Confirmed requests cannot be dispatched again from the same card.
- All 59 package tests pass, including ten tests of the actual five cards across
  both bridges, timeout/error tests, and isolated sharing-handler rejection tests.
- Local sharing-handler tests reject revoked, expired, and incorrect-token
  requests before reading form contents. A snapshot test verifies only selected
  categories are queried/included. A duplicate-condition test prevents insertion.
- Production RLS is enabled on shares, diet logs, Life Signals, and form
  proposals; policies require owner identity for reads/writes. This inspection
  does not substitute for a second-account integration test.
- ChatGPT's **Enforce CSP in developer mode** switch was enabled and verified on.
  Existing diet cards still render, and dashboard v2 renders in a newly opened browser page under enforcement. Full fresh-card coverage remains pending.
- The source findings below describe the pre-124 implementation; the shared host
  changes resolve their bridge, redraw, timeout, and same-card retry gaps.
- Still pending: cross-card/server idempotency, simultaneous duplicate writes,
  second-account RLS exercise, and a full set of live CSP-on widget interactions.
  The condition duplicate check reads at most 100 rows and is not atomic; do not
  treat its passing unit test as a guarantee against concurrent duplicates.

## Follow-up: version 125 — atomic wellness saves

- Diet batch/single-entry and Life Signal tools now use the same authenticated
  `SECURITY INVOKER` RPC. A transaction-scoped advisory lock serializes saves for
  each user. An exact match (event timestamp plus normalized content) returns the
  existing row; new entries are inserted atomically as a batch. Existing rows
  are neither deleted nor rewritten. This applies to these RPC-based writes,
  not arbitrary direct inserts from other clients.
- Preview timestamps are required for saving. Life Signal check-in output now
  includes a stable timestamp that its card sends back. A newly requested
  check-in is a new event; this does not collapse different timestamps or
  differently described foods into the same event.
- Applied `20260919175918_atomic_wellness_confirmation.sql`. Anonymous execution
  is revoked. RLS remains active and the database derives identity from
  `auth.uid()`, not an input user ID.
- `supabase/tests/wellness-confirmation.sql` passed against the database under
  the authenticated role using two synthetic JWT identities: repeated saves,
  no partial batch after validation failure, read/update/insert isolation, and
  missing identity rejection. The transaction rolled back and a subsequent
  count confirmed zero remaining test rows. No new auth accounts were created.
- A freshly requested Life Signal card rendered all five sliders and its button in ChatGPT with CSP enforcement enabled. No ratings were submitted.
- 62 Node tests pass. Browser OAuth isolation still needs separate signed-in
  accounts; database identity simulation is not a browser sign-in test.
- Remaining server work: durable share/email retry protection and atomic
  duplicate protection for the other health-data writes.

## Verified

- The user successfully saved a diet preview with its button. A subsequent
  authenticated read found the two intended current-day entries exactly once.
  No health data was inserted or shared during this review.
- Dashboard and diet widgets support legacy and standard host messages.
- Diet requests omit nullable display fields and preview-only metadata. The
  server also normalizes nullable optional values from older cached cards.
- Diet confirmation retains its preview across incidental host updates and
  prevents another dispatch after a mutation starts. Ambiguous outcomes direct
  the user to check Wellness. This is a per-card guard, not server idempotency.
- All 40 MCP package tests pass using Node 24. These include tests of both diet
  bridges using the actual server preview formatter. Whitespace checks pass.
- Live public discovery GET: HTTP 200. POST without a token: HTTP 401 with
  `WWW-Authenticate`. POST with a deliberately invalid token: HTTP 401.
- Live source validates tokens with `auth.getUser` before creating the MCP
  server and passes the user's token to the database client. Gateway
  `verify_jwt=false` does not remove the handler's authentication checks.

## Other confirmation buttons: source findings

| Flow | Input contract | Remaining reliability gap |
| --- | --- | --- |
| Life Signal | Builds numeric slider values; omits an empty note. No diet-style null forwarding found. | Legacy `callTool` only; no timeout; ambiguous failures re-enable the write button. |
| General health share | Selects expected fields and omits empty organization/note. | Legacy bridge only; globals redraw the card, potentially removing feedback; no timeout or persistent attempted-write guard. |
| Medical form review | Sends only proposal ID and explicit confirmation. | Standalone review redraws on every globals event, including after success; legacy bridge only; no timeout. |
| Medical form interview | Confirmation sends proposal ID, not the full display preview. | Handles standard incoming results but only legacy outgoing calls; `call` does not reject `isError` before rendering; no timeout. |
| Medical form email share | Selects expected fields and normalizes optional values. | Standard fallback lacks initialization and timeout; globals may redraw an enabled button while a request is pending; ambiguous failures permit retry. |

These are source-level findings, not evidence that every flow has failed in
the user's client. No provider emails, shares, or form writes were triggered.
The passing existing tests do not establish end-to-end success for these paths.

## Before broader release

1. Apply the diet flow's tested lifecycle protections to the remaining buttons:
   standard initialization/call responses, stable pending/success states,
   explicit tool-error handling, and bounded waiting without automatic retries.
   Use isolated fixtures for writes and email delivery.
2. Add durable request IDs/server idempotency for mutations where a response can
   be lost after the database write or email request succeeds. A fresh card must
   not bypass duplicate protection.
3. Test with ChatGPT CSP enforcement enabled. The user's latest screenshots show
   **CSP off**, so successful rendering does not yet verify CSP enforcement.
   Dashboard metadata allows only the Supabase resource origin, with no direct
   connections; diet metadata allows neither. Other resources still primarily
   declare legacy CSP fields. Check all assets and tool calls under enforcement.
4. Complete the existing second-account RLS isolation test. This review checked
   unauthenticated rejection, not cross-account authorization.
5. Reconcile production/local source drift before deploying the entire checkout.
   Production contains unrelated changes absent from this worktree. Versions
   120–122 were deployed by patching the latest production snapshot, preserving
   those changes. This commit is not a complete production source snapshot.

Full package typecheck/build was not run: dependencies are not installed in this
worktree. The tests use Node 24's native TypeScript stripping. Publishing and
changes to the ChatGPT installation's CSP setting were not performed.


## 2026-10-02 — Wellness check-in widget hardening (MCP v132)

- Confirmed fresh production was v131; deployed only the Nourished Rebel widget source change, preserving the other 31 source files.
- Widget URI v5 uses the shared legacy/standard host bridge. Saves disable controls, reject repeated clicks, preserve editing against incidental output, and validate enrollment and the exact returned answer/skip before showing saved feedback.
- Empty input no longer enrolls a user. Missing/error responses stop for verification instead of claiming success or allowing resubmission. Completed six-question check-ins no longer restart at question one.
- Validation: 108 passing Node tests (8 new dual-host wellness tests), isolated package TypeScript check, whitespace check excluding preserved baseline EOF blanks. Fresh production v132 matches all 32 tested source files; discovery HTTP 200 and unauthenticated POST HTTP 401.
- No health records, enrollment, answers, or emails were created during verification. Fresh CSP-enforced browser acceptance, real OAuth negative writes, independent-session concurrency, and operational/privacy release gates remain outstanding. This is not production-readiness approval.

## 2026-10-02 — Fixed cross-account patient/profile form reads
- Live pg_policies inspection found SELECT USING (true) demo policies on patient_profiles and form_responses. A transaction-only synthetic probe reproduced both cross-account reads (one profile and one form visible to identity B).
- Applied restrict_patient_form_reads_to_owner using Supabase apply_migration. Local migration: 20261002165322_restrict_patient_form_reads_to_owner.sql. Replaced only the two demo SELECT policies; enabled RLS explicitly. No rows, ownership values, grants, or server-side share token behavior changed.
- Regression test supabase/tests/patient-form-isolation.sql passes on the live database: owner insert/read/update; cross-owner read/update/delete denied; forged inserts and owner reassignments denied; anonymous reads denied. Synthetic identities are transaction-local JWT claim simulations, NOT real OAuth browser sessions.
- Verified live policy definitions and zero remaining fixture rows after rollback. Existing provider access requires explicit authorized server routes; broad browser reads of all patient profiles are intentionally blocked.
- Source had an older owner-only form migration that was not reflected in live policy state; why the drift occurred remains unverified. Do not reapply unrelated historical migrations blindly.
- This establishes an exposure condition, not evidence that another person accessed data. Historical access assessment and wider view/privileged-function review remain open before release.
- Supabase RLS documentation and changelog reviewed. Current minor-version notes do not change this owner-equality policy pattern.
- User separately reported entering “8 hours” and saving successfully in the live wellness card; mark successful save as user-verified, not an agent-created fixture.

## 2026-10-02 — Share isolation and migration-history follow-up
- Live migration history has no version 20260822000003 or name secure_gpt_medical_form_proposals, although that migration exists in the checkout. Later proposal-table migrations are recorded. This confirms differing recorded migration history, not proof of exactly when/how the read policies persisted or actual data access.
- New rollback suite supabase/tests/share-isolation.sql passes for health_share and medical_form_email: foreign-owner share/receipt reads denied, revoke/update denied, completion RPC rejects another owner's operation, forged owner insert denied, same request across owners has distinct identity, pending and completed retries reused, owner revoke allowed. No emails or external share links sent.
- Zero synthetic share and receipt rows remain after rollback. Form response patient/template unique index is present (implemented as an index, not a table constraint).
- Added/read-tested ownership-policy-gate.sql against 11 private tables: fails on disabled RLS or unconditional client policies. This is a scoped catalog guard, not proof against all possible policy bugs or a scheduled monitor.
- Real browser OAuth negative-write tests, concurrent-session tests, historical access investigation, and proposal behavioral coverage remain open. No production code or schema changes this turn.

## 2026-10-02 — Real OAuth revoke acceptance and MCP v133
- Created two tightly scoped disposable share fixtures: empty form lists, no usable token, expired, no health payload/email. One belonged to the signed-in AOL account and one to a synthetic owner.
- Through the existing ChatGPT OAuth connection, requested revoke_health_share once per fixture. Foreign-owner request was rejected and database verification showed no change. Owner request succeeded; database showed revoked=true/status=revoked with timestamp. This proves a real OAuth negative revoke and positive owner revoke, not two separately logged-in OAuth sessions or an active-token lifecycle test.
- Both exact fixture rows were deleted under ID/note/owner constraints and zero remaining rows verified.
- Fixed unhelpful zero-row revocation error via maybeSingle + explicit unavailable/not-found/already-revoked message, preserving row-level security and filters. 111 tests and frozen Deno entrypoint check pass.
- Deployed only health-sharing.ts change from fresh v132 snapshot as v133. Fresh snapshot matches all 32 candidate files; GET discovery 200, unauthenticated POST 401.
- Evidence: /tmp/health-vault-oauth-revoke-test.png and existing chat 6abfcc3e-0948-83e8-a787-8fdce9d3b661. Screenshot shows the pre-fix raw error from the successful negative test.
- Simultaneous saves remain untested: need two independently controllable DB sessions. Asked user to identify dedicated staging project (no credentials in chat). Existing preview branch belongs to another PR and was not repurposed. No new infrastructure created.

## 2026-10-02 — Failed medical-form card fix, MCP v134
- confirm_form_answers now returns structured error content as well as isError/text. Shared widget host delivers standard tool-result errors to subscribers; parent-source validation and mutation locking remain unchanged.
- Medical form interview resource v2 renders an escaped terminal error with Check Health Vault. Unexpected results and missing responses (30 seconds) no longer remain indefinitely loading. The card never retries a save or claims an uncertain result was saved/unsaved.
- Full suite: 118 tests passed; an additional host-lock regression passed in a focused 12-test run (119 tests total now). Frozen Deno 2.9.6 entrypoint check passed with network access after sandbox npm DNS failure.
- Deployed only three changed production files from a fresh v133 snapshot. Fresh v134 retrieval matches all 32 candidate/local files. Discovery GET 200, unauthenticated POST 401. No commits, health-data changes, or email sends.
- Live ChatGPT browser acceptance passed after metadata refresh: one call using the previously deleted disposable proposal displayed the actual rejection inside the new card, with “Check Health Vault” and no loading placeholder. DOM and screenshot verified independently of ChatGPT prose. Evidence: /tmp/health-vault-form-error-fixed.png. No new fixtures were created. Timeout behavior is unit-tested, not independently exercised in live ChatGPT.
