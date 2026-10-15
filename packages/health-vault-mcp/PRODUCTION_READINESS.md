# Health Vault ChatGPT app — invited beta release gate

Reviewed 2026-10-02. Decision: **not yet approved for invited beta or public submission**.
This document covers the ChatGPT MCP app, not a certification of the entire Health Vault platform.

## Verified baseline

Latest update: MCP v134 is deployed with all 32 source files matching the baseline.
Nourished Rebel v5, vitals v3 and clinical imports v2 use the shared host bridge.
118 isolated tests passed for v134; an additional host-lock regression passed in a
focused run (119 tests now). The earlier package typecheck passed. The actual edge entrypoint also passes
Deno 2.9.6 checking in an isolated source workspace with a frozen dependency lock.
Run `node scripts/check-health-vault-edge.mjs` with Deno 2.9.6 on PATH.
This checks types/dependency resolution; it does not simulate Supabase runtime or
prove the live deployment consumed this validation-only lock. CI is prepared, not run remotely.
Secondary-account reconnect plus metadata refresh/retry restored fresh wellness and
dashboard rendering. Live Start and empty-answer validation pass without saves.
Actual mutation/error/timeout acceptance and explicit CSP-settings verification remain
open. Independent-session concurrency is also open.

Update: MCP v130 is deployed; all 32 source files match the updated hash baseline,
90 isolated tests and package typecheck pass. The atomic authenticated health-save
RPC now covers all five remaining create paths. Rolled-back database tests verify
exact retry reuse, conflicting-detail rejection, owner isolation, forged ownership
rejection and missing identity. This does not establish concurrent-session stress
or browser OAuth mutation isolation. Direct inserts outside the RPC do not take its lock.
The approved expired link returns HTTP 410 on viewer, PDF and bundle routes.
The v129 observations below retain the earlier readiness baseline.

- Production MCP v129: 31 deployed source files now match this checkout exactly.
  Five missing import/wellness modules and their live tool registrations were restored.
  `production-baseline.json` records file hashes and gateway configuration, not secrets.
- 84 isolated tests pass. Package TypeScript check passes with production SDK versions
  (`@modelcontextprotocol/sdk` 1.25.3, Supabase 2.112.3, Zod 4.1.13; TypeScript 5.9.3).
  This is a package typecheck, not a Deno edge bundle/typecheck or full web/mobile build.
- Public discovery returns 200; unauthenticated tools/list POST returns 401.
- Second-account dashboard returns its own identity and empty counts. Owner-only
  mutation/proposal checks through two real OAuth sessions remain open.
- Live revoked links and invalid tokens return 403 on viewer, PDF, and bundle routes.
- Approved form email was delivered and opened; initial Gmail placement was spam.
  DMARC and text alternative are in place; inbox placement is not guaranteed.
- ChatGPT refreshed metadata recognizes the share widget domain. Current security
  settings show CSP enforcement enabled; the second-account card's initial stale
  CSP-off badge means it is not counted as fresh CSP acceptance.
- Read-only receipt check: one completed receipt, no pending receipts on this review.
  No ongoing alert or monitoring service has been configured by this work.

## Ownership correction — 2026-10-02

A synthetic database probe reproduced cross-owner reads of patient_profiles and
form_responses under legacy demo policies. The live migration now restricts these
reads to the authenticated owner. Owner writes still pass; cross-owner reads,
updates and deletes, forged ownership and anonymous reads are denied in rollback
tests. No fixtures remain. See supabase/tests/patient-form-isolation.sql.
This is database-role verification, not end-to-end OAuth acceptance.
Historical access and migration drift investigation remain unresolved; there is no
evidence in this test establishing actual third-party access.

Real OAuth revoke check passed on 2026-10-02: the connected account could revoke
its disposable empty/expired fixture, while a synthetic foreign owner's fixture
remained unchanged. Both were cleaned up. A later real OAuth foreign-proposal confirmation also returned the explicit ownership
error and left the disposable proposal unchanged. These checks do not establish
active-token lifecycle, two active browser sessions, or simultaneous-session behavior.

## Required before invitations

| Gate | Required evidence | Status |
| --- | --- | --- |
| OAuth ownership | B cannot confirm A's proposal, read A's private form, or revoke A's fixture; A unchanged | Open; use dedicated synthetic fixtures |
| Link lifecycle | Approved link fails after expiration; normal authenticated revoke round trip blocks access | Live expiry passed on three routes; normal revoke round trip open |
| Duplicate writes | Concurrent/replayed condition, medication, allergy, record, and appointment confirmations insert once | Atomic RPC deployed and retry tests pass; independent-session stress open |
| Widget behavior | Fresh form review/share/import/wellness cards with CSP on; success, error, timeout, retry behavior | Imports and wellness hardened; fresh browser acceptance failing/open |
| Release validation | Deno check/bundle, lock remote dependencies, match expected tools/resources, deploy candidate and smoke-test | Deno frozen check, source parity and package typecheck pass; bundle/runtime and deployment-lock verification open |
| Recovery | Database backup retention verified and restore exercised in a separate environment | Daily physical backups observed Sept 25–Oct 2; PITR off. Restore rehearsal, retention guarantee and uploaded-file recovery remain open. See docs/account-controls/RECOVERY_REVIEW.md |
| Operational coverage | Assign an operator, configure alerts for failures and pending deliveries, prove alert delivery | Timothy McGuire assigned to support/deletion requests; email verified. Queue/failure alerting and operational coverage remain open |
| User controls | Verify published privacy/terms/support destinations, export/deletion behavior and retention disclosures | Privacy notice approved October 7, 2026: https://healthvault.me/privacy. Support is https://healthvault.me/support. Terms remain a draft. Export and reviewed-deletion queue are deployed. Retention periods and queue monitoring remain open. See docs/account-controls/ |
| Submission | Reviewer account with synthetic data and exact test steps; accurate app metadata and permissions | Submitted October 12, 2026. MCP https://mcp.healthvault.me/ is domain-verified and authorized. Not published. Tool updates remain held until OpenAI finishes review. |

Provider database advisor results: 22 informational RLS-without-policy findings,
one anonymous and seven authenticated SECURITY DEFINER warnings, no error-level
findings. These are not proof of exposure or a clean security audit. The anonymous
finding is `capture_patient_access_consent_receipt()`, verified to return `trigger`
with an empty search_path; it is not an ordinary callable data-returning RPC.
Review grants and each function's authorization before changing provider behavior.
Do not add permissive policies merely to clear informational findings.
[Advisor remediation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

## Database release checks

Run these against the actual target database with the authorized SQL runner:
- supabase/tests/ownership-policy-gate.sql (read-only catalog guard)
- supabase/tests/patient-form-isolation.sql (synthetic rollback tests)
- supabase/tests/share-isolation.sql (synthetic rollback tests; no emails)
- supabase/tests/form-proposal-isolation.sql (supply two auth-user IDs through session settings)
- supabase/tests/health-record-confirmation.sql (synthetic rollback tests)

Record the returned PASS results and verify fixture cleanup. These scripts do not
replace real OAuth or concurrent-session acceptance. The share suite passed on
2026-10-02. A catalog check alone cannot prove ownership logic correct.
The live migration history lacks the checkout's 20260822000003 owner-form migration;
compare effective policies as well as names before each release.

## Release procedure

1. Retrieve a fresh production Edge Function snapshot; retain it in restricted release
   storage. Run `node scripts/check-health-vault-production.mjs --snapshot /path/to/snapshot.json`
   from the repository root. Review differences; never automatically overwrite a newer release.
   Without `--snapshot`, the script compares against the recorded production baseline only.
2. Run `node --test packages/health-vault-mcp/src/*.test.ts` with Node 24, package typecheck,
   and the Deno validation above. Review the full candidate diff and migration ordering.
   CI is prepared in `.github/workflows/health-vault-mcp-checks.yml` for isolated tests;
   it has not run remotely and does not deploy or establish complete build validation.
3. Record candidate source hashes, dependency locks, migration versions, and the previous
   release artifact. Obtain the requested release commit explicitly; no commit is created here.
4. Deploy only `health-vault-mcp`, preserving `verify_jwt=false` for discovery and the handler's
   `auth.getUser` validation for every authenticated request. Never deploy all functions casually.
5. Verify 200 discovery and 401 unauthenticated/invalid authentication, then both-account reads,
   approved synthetic mutations, fresh CSP cards, and one explicitly reviewed delivery test.
6. Refresh ChatGPT app metadata. Verify domains and output templates. Record the live version
   and release evidence before inviting users. Publication/submission is a separate release action.

## Operational response

- Check Supabase function error rates and Resend accepted/delivered/bounced events. Store only
  request IDs, operation/share IDs, timestamps and error classes in operational notes; exclude
  health answers, access tokens, bearer URLs and recipient addresses from aggregate dashboards.
- Investigate a pending share receipt older than 15 minutes. That is an investigation threshold,
  **not** permission to expire the claim, enable the button, or resend. Inspect its matching share
  and provider delivery outcome first. An unknown outcome stays unknown until reconciled.
- Treat a successful send response as provider acceptance. Surface failed delivery and bounced
  messages separately; never label every accepted request as delivered to an inbox.
- On suspected account leakage, halt invitations and affected writes, retain sanitized evidence,
  and follow the incident process. Do not destroy logs or revoke unrelated accounts.
- For a bad code deployment, restore the reviewed previous function artifact and re-run smoke
  tests. Code rollback does not undo database writes, emails, or migrations. Use a compatible
  forward repair for schema changes; do not drop data to restore a version.

## Reviewer steps

Submitted October 12, 2026 with reviewer account godesigngo+hv-review@gmail.com.
Never give a reviewer a personal account, live patient data, or a bearer link. The plugin
is not published.

Privacy policy URL: https://healthvault.me/privacy
Support URL: https://healthvault.me/support

1. Open the privacy policy. It names GO Design, Inc., adults 18 and older, the ChatGPT connection, and support at team@healthvault.me. It does not say “Draft” or “Not approved.”
2. Connect Health Vault with the synthetic reviewer account. Ask for the health summary. The dashboard shows that account’s name and that account’s counts.
3. Ask to log one meal. Nothing is saved before the confirmation button. One confirmation creates one entry and a visible success. Repeating that same confirmation does not create a second copy.
4. Ask to add an appointment. A preview appears first. Nothing is saved until the reviewer confirms those exact details.
5. From a second synthetic account, ask to read the first account’s conditions, change them, or revoke the first account’s share. Each request is denied. The first account is unchanged.
6. Disconnect the app. A signed-out request does not return the reviewer account’s records.

What must stay denied: another person’s vault, confirming another person’s save, revoking another person’s share, and treating a deletion request as immediate erasure. Health Vault is not an emergency service.
