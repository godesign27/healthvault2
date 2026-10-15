# Inbound import retry contract — preview

October 2, 2026 (October 3 UTC). Preview inbound-records v17 only.
Candidate: `supabase/operations/candidates/20261003012453_inbound_import_receipts.sql`.
Production is unchanged. Requires existing account-access, journal and recovery SQL.

## Client contract

POST `/functions/v1/inbound-records` now requires `Idempotency-Key` as well as the
existing personal API key. Generate a UUID once for each logical batch, persist it
before sending, and reuse it with the unchanged batch after a lost response. Never
generate a fresh key merely because a request timed out. Keys are 1–128 characters:
letters, digits, dot, underscore, colon and hyphen (first character alphanumeric).
Missing/invalid keys return 400. The CORS allowlist includes Idempotency-Key.

The key is scoped to the authenticated Vault owner, not a browser or connection.
The server stores a hash of the key and a hash of the normalized batch/provider.
JSON object property order is ignored; record order, count, content, metadata and
provider identity are bound. Reusing a key with changed records returns 409
idempotency_conflict before any upload reservation. A new key explicitly creates a
new logical import, allowing intentional repeated clinical records.

Responses include importBatchId and the existing records/recordErrors. A replay's
received count includes recovered records; it is not a count of new insertions.
Existing record UUIDs remain stable. Fileless FHIR imports use the same contract.

For a partial response, unchanged retries with the same key recover saved records
and retry failed slots. To correct invalid input, send only the failed records with
a new key; do not include already saved records in that new batch. While a slot's
outcome is unknown, it returns reconciliation_required and cannot be stolen by a
retry. Allow reconciliation to settle it; do not switch keys to bypass the busy slot.

## Database behavior

inbound_import_batches is service-only with closed RLS and a unique owner/key-hash
constraint. Account advisory locks serialize batch and slot reservations with
reviewed account blocking. A unique batch/index constraint gives one active slot
owner. Committed slots return their owned record receipt; prepared slots return
busy without upload or compensation. Known abandoned slots can be reassigned to a
fresh attempt/path. Their old journals remain for late-file cleanup. The batch has
no cascading Auth foreign key; retention/erasure review must include these receipts.

The HTTP route still verifies the API key and active owner before replay. Slot RPCs
also check account eligibility. App roles cannot reserve batches or slots. Receipt
lookup fails closed if the committed record was removed. Fingerprints/receipts are
not public, and no clinical payload or raw API/retry key is logged or stored in the
batch table.

## Rollout requirements

This changes the inbound API contract. Update and verify every root-import client
before production deployment; old callers without the header will receive 400.
Do not mix the provider-request content-deduplication contract with this batch-key
contract. Previously imported records have no receipts and are not retroactively
deduplicated. Retention and historical cutover need approval before production.

Repository inspection also found packages/api-client/src/client.ts uploadRecord
using multipart `/inbound-records/upload`, while this function exposes a JSON root
API. That existing route/auth mismatch is separate and has not been silently
rewritten as part of this change. Verify the intended mobile/web upload contract
before rollout rather than assuming the new header fixes that path.

## Acceptance evidence

26 focused tests and isolated Deno checks pass. Thirteen preview HTTP/SQL groups
verify stable replay IDs, changed-payload conflicts, partial replay, fileless FHIR,
owner isolation, concurrent reservation, abandoned retry, blocked access and the
42 MiB rejection. Grant audit denies batch reads/reservation to app roles. Security
advisor has only informational notices for deliberately closed RLS tables.
Independent cleanup inventory: zero users, records, objects, attempts, batches,
keys and account blocks. Protected temporary credentials removed.


Shared-client multipart mismatch is resolved in preview v18 with an authenticated
JSON personal-upload route. See [IMPORT_CLIENTS.md](IMPORT_CLIENTS.md). Production
client rollout and actual web/mobile screen wiring remain outstanding.
