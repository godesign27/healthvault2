# Provider upload retry receipts — preview

October 2, 2026 (October 3 UTC). Preview record-request v40 only; production unchanged.
Candidate: `supabase/operations/candidates/20261003011217_request_upload_receipts.sql`.
Requires the existing account-block, upload journal and request-recovery candidates.

## Behavior

Each provider file is identified by a server-computed SHA-256 digest of its decoded
bytes and normalized filename/type/kind/title/notes/content type. Identity is scoped
to one request. No client key, browser storage or local in-memory state is required.
Identical reselected files after a reload therefore recover the same saved record.
Different metadata or a different request is a different operation, not a replay.

The service-only reserve_request_upload RPC takes the account advisory lock and
request/attempt row locks. It verifies the current token, expiry, account eligibility
and request status before looking up any receipt. A unique partial index gives one
active fingerprint owner. It returns one of:

- A new prepared journal reservation: this caller alone uploads/finalizes the file.
- A committed record receipt: no upload or compensation is performed.
- A busy existing attempt: no upload, finalization or abandonment is performed.

A known abandoned attempt can relinquish the fingerprint to a fresh UUID/path.
Its old journal/path remains for late-file cleanup, and it cannot finalize later.
A prepared attempt with an unknown outcome remains busy until reconciliation;
retries never take ownership of that attempt. Receipt recovery fails closed if the
original record is gone. Completed requests can recover committed receipts, but
cannot reserve new files. Replaying completion preserves submitted_at.

The shared persistence adapter accepts the optional reservation result; inbound
imports whose prepare callback returns void retain existing behavior. This change
adds provider-request deduplication, not general inbound API idempotency.

## Verification

23 focused tests pass across bounded bodies, auth, persistence, hashing and retry
classification; isolated Deno checks pass. Live disposable-account acceptance checks
partial/completed replay IDs, unchanged completion timestamp, exactly one concurrent
reservation, busy retry without upload, fresh-path retry after abandonment, app-role
RPC denial and account-block enforcement. The final run also checks token expiry,
rotation and the 42 MiB JSON rejection. Test runners remove their own rows/files/users.

## Rollout limits

This only deduplicates files reserved after deployment. Historical uploaded files
without fingerprints are not retroactively matched. Before production rollout,
plan a quiescent cutover or separately verified backfill for any active requests;
do not promise deduplication for old unindexed receipts. Keep committed journal
receipts for the supported retry window; retention/erasure review must include the
fingerprints and receipt metadata. Never delete a receipt while promising replay.

The same file with edited notes/metadata is a new operation. Ordinary inbound API
requests still need their own replay contract. No production migrations/functions
were applied, and no user health records or emails were changed by these tests.

Final live run: nine check groups pass. Independent preview inventory confirms
zero users, records, objects, attempts, requests and account blocks after cleanup.
Temporary credentials removed. No new security warnings/errors; existing closed
service-only RLS tables retain informational notices.
