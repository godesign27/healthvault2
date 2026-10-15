# Upload recovery — preview acceptance

October 2, 2026. Production is unchanged. Preview project: roeudwddxvniazwufdqf.
Deployed: record-request v35, inbound-records v13, upload-recovery v1.

## Provider-request uploads

The private upload journal now includes a bucket and optional request ID. Its
constraints bind each object path to the owner/attempt or request/attempt UUIDs.
`finalize_request_upload` checks the current token, expiry, request owner/state,
Auth eligibility, account block and uploaded object. It inserts request-file
metadata, the health record and the committed receipt in one transaction. It
uses the same account lock as reviewed blocking. Invalid record metadata rolls
back both database inserts before compensation removes the object.

Only an entirely successful batch completes the request. Partial results return
HTTP 207 with saved indices and indexed file errors; all-failed batches use 422.
The web page inspects success explicitly, removes saved files from the retry
list, and keeps rejected files visible. Unknown outcomes disable immediate
retries and direct the provider to check status/support. This reduces accidental
retries in the current page; it is not request-level idempotency across reloads.
The unsupported HIPAA-compliant footer claim was removed from this page.

Portal reads and submissions check the owner's active account. Resend now
verifies the bearer token and exact request ownership before rotating a token or
sending mail. Token rotation between upload and finalization rejects the save.
Tests did not send email. Broader email delivery and all privileged-path races
remain separate review items.

## Recovery worker

The worker accepts only a Vault-generated scheduler credential verified by a
service-only RPC. No credential is copied to source or command arguments.
`upload_recovery_settings` is closed to app users and contains a five-minute
lease and last-run counts/timestamps. No patient data is returned in worker HTTP
responses. The dispatcher has a fixed configured endpoint and is operator-only.

Each run considers up to 20 non-committed attempts older than one hour, ordered
by least-recent cleanup check so older failures do not monopolize every pass.
The worker first serializes abandonment with the finalizer. A concurrent commit
wins and its file is preserved; otherwise the worker removes only the journal's
validated object path. Database or Storage failure is counted, keeps the journal,
and is retried in a later run. A prepared attempt abandoned by recovery cannot
subsequently finalize. Both inbound and request-file buckets are supported.

Abandoned rows are intentionally retained and revisited: a timed-out Storage
upload may arrive after an earlier delete. Journal retention and archival still
need an approved policy. This is failed-upload recovery, not patient erasure.

Preview schedule `health-vault-upload-recovery` is active every 15 minutes.
Activation SQL is `supabase/operations/activate-preview-upload-recovery.sql`.
Two manual dispatcher runs passed. Scheduled dispatches at 23:15 and 23:30 UTC
on October 2 succeeded; the 23:30 worker receipt completed at 23:30:01.030122 UTC
with checked=0 and failed=0. Production scheduling is not enabled. Operators should check
`last_finished_at`, `failed`, stale leases and backlog; independent alerts and
long-term run history remain open.

## Verification

- Sixteen focused tests pass, including committed-file preservation, ambiguous
  commit handling, removal retry, unsigned denial and multi-megabyte validation.
- Five provider-request HTTP groups pass with disposable A/B accounts: token and
  resend isolation; real partial failures/cleanup; protected download; completion
  and replay denial; token rotation and account blocking after upload.
- Eight inbound HTTP regression groups still pass after journal extension.
- Two real worker dispatches removed old prepared/abandoned bytes, preserved
  committed and recent files, retained journals, then removed a recreated late
  arrival. The second receipt reports checked=2, failed=0.
- Actual ProviderRecordSubmitPage browser test with explicitly simulated HTTP 207
  response displays “1 file saved…” and leaves only the rejected file selected.
  This UI test used synthetic files and no network upload. Screenshot:
  `/tmp/health-vault-partial-upload.png`.
- Isolated Deno checks and web build pass. Security advisor has only expected INFO
  notices for closed RLS tables, no warnings/errors.

Repeatable runners: `scripts/test-request-upload-preview.mjs`,
`scripts/test-inbound-access-preview.mjs` and
`scripts/test-upload-recovery-preview.mjs` (setup/check/late/cleanup).
They require a protected preview-only `HV_PREVIEW_KEYS_FILE`. The recovery test
requires an operator to call `dispatch_upload_recovery()` between setup/check and
late/check. Always run cleanup, including after a failed assertion.

## Remaining rollout gates

Settle journal retention/backlog alerts, add
request-level retry identifiers and total body limits, and review remaining
service-role/provider/share paths. Migrate/revoke legacy signed links and finish
erasure/recovery/retention acceptance before production rollout. Deploy the
candidate database dependencies before functions, then ship the updated viewer
and provider page with their corresponding endpoints. No production-ready claim.


## Whole-request limits and uncertain responses — October 2

Preview record-request v39 and inbound-records v16 use a shared streamed JSON
reader. Upload requests are capped at 40 MiB encoded body bytes, ordinary create
request/key metadata at 64 KiB. Content-Length flags oversized bodies but is not trusted: chunked or understated
bodies are counted during reads. Rejected bodies are discarded without decoding
or retention until EOF, under the same absolute deadline. Returning a response
with an unread body caused the hosted relay failure described below. A 30-second body
read deadline cancels stalled senders. Non-object/malformed JSON returns 400,
oversized bodies 413 and body-read timeout 408, with request_body_rejected so the
client can distinguish this pre-save failure from an unknown server outcome.
Existing 25 MiB per-file and 20-item batch constraints still apply. The 40 MiB cap
includes base64 and metadata, so several individually valid files may need a
smaller batch. This bounds each request, not total concurrent memory or rate.

The local provider page checks file counts/sizes before reading files and checks
the serialized UTF-8 payload before sending. Missing receipts, server/proxy errors
and uncertain completion now block immediate retry rather than claiming that no
files were saved. A known partial receipt still removes saved files from selection.
This does not provide durable deduplication after a reload or across clients;
request-level idempotency remains an open rollout gate.

Five body-reader tests cover actual-byte limits with absent/dishonest headers,
split UTF-8 at the exact boundary, malformed JSON, cancellation and timeout.
Three retry-classification tests cover missing receipts, pre-save rejection and
partial/uncertain results. The eleven existing authorization/persistence tests
also pass; isolated Deno checks and the web build pass. These frontend changes
are local and have not been deployed to the production website.


Initial live large-body acceptance failed (resolved below): a synthetic body just over 40 MiB first
hit the test client's 30-second transfer timeout; with a 120-second client timeout,
it returned HTTP 502 without the application's request_body_rejected receipt.
This does not establish which gateway failed, nor demonstrate the application's
413 response for that large transfer. Both runs cleaned their fixtures. Run the
expensive check explicitly with HV_TEST_LARGE_BODY=1 on the provider runner;
502 remains a failure, not an accepted size rejection. Small 64 KiB metadata
rejection is separately tested on both functions. Do not claim full hosted
large-upload acceptance from local streamed-reader tests alone.

Six provider-request and nine inbound live check groups pass after deployment,
including both control-body limits, partial uploads and cleanup. Independent final
preview inventory found zero users, records, objects, attempts, requests, keys and
blocks. No email was sent. Production remains unchanged.


### Gateway rejection fixed — October 2 (October 3 UTC)

Controlled preview probes reached the function at 1, 8, 24 and 36 MiB. Returning
an error without consuming a declared-oversized body produced Cloudflare HTML
502, with no completed function invocation receipt. Removing cancel alone did
not help. Reading to the limit fixed the just-over-40 MiB case, but stopping with
an unread tail still stalled the 42 MiB case. Final implementation discards the
remaining rejected bytes without decoding or retaining them and uses the same
absolute 30-second deadline; only after EOF does it return JSON 413. No rejected
body reaches JSON parsing, record/file creation or upload journaling. Inbound
API-key authentication may still update its last-used timestamp before reading.

The final 42 MiB hosted probe returned HTTP 413 with request_body_rejected. The
full disposable provider suite now enables that case with HV_TEST_LARGE_BODY=1
and verifies no upload-attempt rows were created. Twenty focused tests pass,
including an endless oversized stream that hits the deadline and cancels. This
fix bounds retained/parsed bytes and duration, not total network bytes consumed
while discarding. A transport-aborted or stalled request can still lack an app
receipt; the provider UI correctly treats that outcome as uncertain.

Preview only: record-request v39, inbound-records v16. Production unchanged.
The prior size-rejection gate is resolved for the tested 42 MiB request. Durable
retry deduplication across reloads and the production legacy-reference migration
remain separate rollout requirements.

Final acceptance: seven provider and ten inbound live groups pass on v39/v16,
including authenticated 42 MiB rejection with zero upload attempts in both suites.
All synthetic fixtures and protected temporary credentials removed; independent
preview inventory users/records/objects/attempts/requests/keys/blocks is zero.


Provider-request retry deduplication is now implemented in preview v40. See
[UPLOAD_RECEIPTS.md](UPLOAD_RECEIPTS.md) for matching semantics, concurrency tests
and historical-file/retention limitations. Earlier notes that provider-request
retry identifiers are wholly unimplemented are superseded; general inbound API
idempotency remains open.


Inbound retry protection is now preview v17; see
[INBOUND_IMPORT_RECEIPTS.md](INBOUND_IMPORT_RECEIPTS.md). It requires a persistent
client batch retry key and has a production client-migration gate. Earlier notes
that all inbound idempotency is unimplemented are superseded.
