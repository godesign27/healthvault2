# Protected file delivery — preview acceptance

October 2, 2026. Implemented and verified in preview; production unchanged.

## Behavior

`record-file` accepts an authenticated POST containing only a record UUID. It
validates the Auth user and reviewed-account access gate, reads the owned record
through RLS, validates the underlying object ownership, downloads bounded bytes,
and rechecks authorization/reference before returning them. It never redirects
or returns a signed Storage URL. All success/error responses set private/no-store,
CDN no-store, nosniff and no-referrer headers. Files are capped at 25 MB.

Objects in `record-request-files` require the file metadata → request → user
ownership join and the matching request directory. `inbound-records` and
`medical-form-uploads` require the authenticated user's directory. A user-editable
preview_url on an owned record is not sufficient to read someone else's object.
Only these private buckets and the exact project's legacy signed/authenticated
Storage URL format are accepted; arbitrary external hosts and public-bucket URLs
are rejected. Failures in access checks fail closed.

The web viewer fetches protected bytes by record ID and renders a short-lived
local blob URL. Closing/switching the document aborts pending work and revokes its
blob URL; sign-out/user changes clear it. Loading and access-denied states are
visible. Data already delivered to a browser or downloaded cannot be recalled.
An account block is enforced on the **next server request**, not by remotely
removing pixels from a document already in memory.

Local changes to `record-request` and `inbound-records` replace year-long URLs
with `hv-storage://bucket/encoded-path` internal locators and set upload browser
cache duration to zero. Local record API/web adapters expose a protected-file flag
instead of forwarding the stored pointer/token. The AI record adapter omits direct
file URLs. Existing legacy references are interpreted server-side with the same
ownership checks, enabling migration without making them public again.

## Evidence

- Preview Edge `record-file` v1 active, custom Auth/gate checks, no production
  deployment. Requires the preview access-block candidate already installed.
- Six handler tests: strict reference parsing, anonymous/malformed denial,
  no-store success/errors, block/reference change during I/O, ownership and
  infrastructure failure behavior. Isolated Deno type check passes.
- Seven real HTTP check groups with two disposable accounts: exact bytes for
  private owner and request-file paths; no-store/no redirect; anonymous/foreign
  denial; forged pointer on an owned row denied for both paths; legacy reference
  support; immediate 404 after unlink while object still exists; immediate 403
  after account block while B remains readable; complete fixture cleanup.
- Real DocumentViewer browser integration displayed the synthetic image with
  naturalWidth=1 through a blob URL. After operator-blocking that disposable
  account and reopening, the viewer displayed “This account is unavailable.
  Contact support.” No Storage token was used in the rendered element.
- Browser screenshot: `/tmp/health-vault-file-blocked.png`.
- Production build passes. Existing project-wide TypeScript failures remain;
  no reported errors in the changed record/viewer files. No claim of a clean
  repository-wide type check.
- Independent preview query verifies zero test users, sessions, blocks, Storage
  objects, health records, record requests/files and deletion requests. Protected
  key/session files removed, browser closed and test server stopped.

Test runner: `scripts/test-record-file-preview.mjs` with a mode-600
HV_PREVIEW_KEYS_FILE for preview only. Browser harness: `tests/record-file-browser/`
with `scripts/record-file-browser-fixture.mjs` setup/serve/block/cleanup.

## Remaining release gates / deployment order

1. Finish and review account-block coverage for privileged jobs, incoming uploads,
   share/request token endpoints and OAuth/provider access before real erasure.
2. Reconcile candidate SQL and live migrations; deploy reviewed database dependency
   before export/file functions. Missing gate infrastructure intentionally denies
   file access rather than falling back to direct Storage URLs.
3. Review live importer/function differences, deploy file endpoint first, then
   record API/viewer and producer changes together. The inbound-records producer has passed a synthetic preview upload/download
   test; provider-request delivery and recovery have since passed preview tests
   documented in UPLOAD_RECOVERY.md. Neither
   producer change has been deployed to production.
   The web viewer is built/tested locally; mobile document viewing was already a
   placeholder and has not acquired a new viewer in this change.
4. Inventory existing saved/issued signed URLs without logging bearer tokens.
   Convert stored references, plan object rotation/deletion and verify cache
   invalidation before claiming old URLs are disabled. This endpoint does not
   retroactively revoke an already-issued direct Storage URL.
5. Test remaining file types, large files, recipient sharing and real provider
   import flows in preview, plus erasure/recovery/retention acceptance.

The old signed-URL immediate-revocation gate remains failed for legacy URLs.
The **new mediated download path** passes immediate denial tests. These are
separate results, not a claim that all file sharing or production erasure is ready.


## Inbound authorization follow-up — October 2, 2026

Preview `inbound-records` v11 introduced verification of key-management bearer tokens with
Auth instead of trusting decoded claims. Every API key must belong to an existing,
non-banned, non-blocked Auth account; missing block infrastructure fails closed.
Personal import keys can target only their creator's Vault. Email resolution is
also owner-scoped. An organization label is not authorization to write another
patient's data. Provider-wide ingestion needs explicit patient grants before it
can be enabled; this restriction is a compatibility change to review for rollout.

Four focused tests and isolated Deno type checking pass. Five live HTTP check
groups cover forged JWTs on GET/POST/DELETE key routes, verified creation and
foreign listing isolation, foreign-patient denial, actual PNG ingestion with an
internal locator and protected byte delivery, blocked JWT/key denial, and cleanup.
No email or production mutation is involved.

The v11 request-time checks have now been extended by the v12 commit guard below.
`record-request` still needs equivalent guards. Existing long-lived signed URLs
remain a separate failed gate. Production remains unchanged.


## Inbound failure recovery and commit guard — October 2, 2026

Preview `inbound-records` v12 writes a private `inbound_upload_attempts` row before
sending an object to Storage. Object paths contain only owner/attempt UUIDs.
The service-only `finalize_inbound_upload` RPC inserts the health record and marks
the attempt committed in the same transaction. It shares an account advisory lock
with `operator_block_reviewed_account` and rechecks Auth eligibility plus the
account block before committing. This ordering covers those two RPC paths; it is
not a blanket guard on every service-role write or a direct administrative block
insert. An upload already sent to Storage may finish after a block, but cannot
be finalized into a record by this RPC after the reviewed block succeeds.

The initial preview migration exposed a real privilege mismatch: service_role
cannot select auth.users. A second candidate migration adds a private boolean-only
Auth eligibility function, executable only by service_role, with an explicit
caller identity condition and fixed search_path. No broad Auth grants were added.
Apply candidates in order: account_erasure_access_block, inbound_import_commit_guard,
then inbound_import_auth_lookup. Do not deploy the Edge function before them.

`abandon_inbound_upload` serializes compensation with finalization. If the record
already committed but the response was lost, it returns that receipt and the file
is preserved. Otherwise it marks the attempt abandoned before Storage removal,
preventing a delayed finalization from succeeding. If receipt lookup or removal
fails, the response says `reconciliation_required` and includes the attempt UUID;
no underlying error, file path or token is returned. A missing/invalid file never
silently turns into a fileless success. Batches report `received`, `failed` and
indexed `recordErrors`; mixed results use HTTP 207 and all-failed batches use 422.
Clients must inspect `success`, not treat every 2xx response as a complete import.
The per-record file limit is 25 MB and the batch limit is 20 records.

Ten focused tests and isolated type checking pass. Eight preview HTTP check groups
pass, including a real mixed batch with invalid base64 and a database-rejected
record kind. Only two valid files remained; the rejected file was removed and its
abandoned journal retained. Anonymous/authenticated roles cannot read the journal
or call finalization. A staged upload followed by a reviewed block cannot commit.
A separate concurrent SQL rehearsal held the reviewed block transaction open for
12 seconds while finalization ran in another call; finalization returned 42501,
with zero records committed, one prepared attempt and the block present. Fixtures
were then removed. Advisor reports only expected INFO for intentionally closed
RLS tables, no warnings/errors.

### Remaining recovery work

- Keep non-committed journal rows. A timed-out upload may still complete later;
  deleting the row after one cleanup attempt would lose that object inventory.
- Add and test an operator reconciliation worker that abandons stale prepared
  attempts before removal, preserves committed attempts, and rechecks abandoned
  paths for late arrivals. No scheduled reconciliation worker is installed yet.
- Settle journal retention and alerting, request-level retry/idempotency, total
  request-body bounds and paused-worker recovery before production rollout.
- Add equivalent record-request protection and cover direct administrative paths,
  provider jobs and the full erasure inventory. Existing legacy URLs still need
  rotation/invalidation. Production is unchanged.

Final independent inventory: zero Auth users/sessions, API keys, upload attempts,
health records, Storage objects, account blocks and deletion requests.


Provider-request parity and repeated failed-upload cleanup now pass preview acceptance.
See [UPLOAD_RECOVERY.md](UPLOAD_RECOVERY.md) for the current versions, scheduler,
verification and remaining gates; the earlier open-worker notes above describe
the preceding stage. Production and legacy signed URLs remain unchanged.


## Legacy-link retirement rehearsal — October 2

Production read-only aggregate inventory found one health_records reference using
this project's legacy signed Storage URL and eleven records without file references.
No production file, URL, token or patient row was retrieved or changed. This count
is not a complete inventory of all other tables, exports or previously issued links.

`scripts/test-legacy-file-rotation-preview.mjs` rehearses disposable files in
medical-form-uploads with two isolated accounts. It warms the old signed URLs,
uploads replacement bytes to a fresh owned path, verifies byte equality, conditionally
updates the exact original reference to an internal locator, and verifies the
protected download before deleting the synthetic original. It then purges only
that exact old object path and checks the unchanged old URL without cache busting.

The purge returned HTTP 200. The first old-link probe still returned 200/HIT;
a probe ten seconds later returned 400/BYPASS. The protected replacement and
second account's file remained byte-identical and accessible. Four check groups
passed, including cleanup. Independent inventory afterward confirmed zero users,
records, objects and account blocks in preview.

This is one observed cache location, not global or immediate revocation. Supabase
[documents](https://supabase.com/docs/guides/storage/cdn/purge-cdn-cache) up to 60
seconds for CDN invalidation and no browser-cache purge. Previously downloaded
copies cannot be recalled. Do not mark the production legacy-link gate complete.

Before production migration: inventory every reference to the object, verify
ownership and backup/recovery policy, deploy the protected viewer/API dependencies,
then use a durable operator migration journal with byte verification and conditional
pointer updates. Request-file references need a transaction covering both
record_request_files.storage_path and health_records.preview_url. Retire old objects
only after all references and protected reads are verified, purge their exact paths,
and retain receipts and failed-purge retries. This rehearsal is not that production
migration tool and deliberately cannot target production.
