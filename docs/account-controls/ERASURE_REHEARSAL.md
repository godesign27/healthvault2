# Account erasure rehearsal — preview only

October 2, 2026. Preview `roeudwddxvniazwufdqf`; no production mutations.
Overall result: **PARTIAL_WITH_FAILED_GATE**, not production-ready erasure.

## Implemented and observed

The candidate adds an operator-only account block tied to an exact, confirmed
request in `reviewing`. A pending request stays active. Clients cannot create a
block, and the operator RPC rejects an unreviewed request. Blocks survive Auth
removal and cannot be read or changed by app clients.

A caller-bound function in a private schema checks the actual Auth identity,
ban status and block. Restrictive policies supplement existing ownership rules
on 39 selected personal/import tables and `storage.objects`; they never replace
ownership checks or grant access. Export checks the gate explicitly and returns
403 instead of a misleading empty export. Missing gate infrastructure returns 503.

Candidate SQL was applied only to preview; the timestamp was created by the CLI.
It is intentionally outside automatic migrations at:
`supabase/operations/candidates/20261002211828_account_erasure_access_block.sql`.
Preview account-export is version 2. Production remains unchanged. Do not deploy
the modified export without its database dependency and a reviewed rollout plan.

## Real HTTP rehearsal

`scripts/test-account-erasure-preview.mjs` is restricted to preview project keys.
It creates two unique synthetic Auth identities without sending email, and deletes
only IDs/files recorded by that process. It is not a generic production erasure tool.
Each fixture has a profile, patient profile, condition, health record, completed
form, pending form proposal, revoked share row and private uploaded file metadata.

Seven check groups completed:

1. Independent accounts and private files; B cannot read A's rows.
2. Global sign-out revoked refresh sessions but the old JWT **still read a database
   row**. A client block and an operator block of an unreviewed request were denied.
3. After operator review/block, the old JWT could not read covered rows or insert
   data; an independently valid session received export 403. Authenticated file
   access and new file upload were denied.
4. A pre-issued signed Storage URL remained readable after the account block,
   demonstrating that it needs separate treatment.
5. Synthetic storage failure stopped erasure with original rows intact and the
   block preserved. Refresh was denied after session revocation/ban.
6. Retry removed A's exact fixture rows, Auth identity and Storage metadata/objects.
   Old JWT could not recreate data. B's complete 34-table export was unchanged and
   B's file bytes remained readable.
7. Cleanup removed both synthetic identities, sessions, blocks, requests and files.

Existing five export unit tests and isolated Deno type check pass. Database checks
confirm 40 restrictive policies, no authenticated block-table access, no client
operator-RPC access and no anonymous private-gate execution. Advisor returned only
expected INFO notices for deliberately closed tables; no warnings/errors.

## Failed release gate: signed-file revocation

A warmed signed URL returned HTTP 200 with `cf-cache-status: HIT` immediately after
successful file deletion. Adding a query nonce also returned 200 during the test.
Storage metadata was subsequently independently verified empty. This is not proof
of immediate removal from every serving layer, so the test retains a failed gate
and exits nonzero when this behavior occurs.

Supabase documents up to 60 seconds for CDN invalidation after object deletion;
browser caches are separate. Token expiry and CDN cache lifetime are independent.
See [Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn) and
[cache purge](https://supabase.com/docs/guides/storage/cdn/purge-cdn-cache).
This run did not measure the eventual global cache-invalidation time. Previously
downloaded recipient copies cannot be recalled.

Next implementation work: serve sensitive shared files through an authorization
check on each request with no-store responses, avoid handing recipients long-lived
direct Storage URLs, and establish verified deletion/cache-invalidation handling
for existing links. Repository `record-request/index.ts` currently signs file URLs
for a year; this needs targeted review. A shorter token alone does not prove cache
revocation. Do not mark a deletion complete merely because Storage metadata is gone.

## Boundaries and remaining work

- RLS does not constrain service-role jobs, SECURITY DEFINER mutations or anonymous
  bearer-link endpoints. Each must explicitly reject blocked owners and stop late
  imports/proposal confirmation. These paths are not covered by this candidate.
- Fixture share rows were already revoked; this is not live share-link revocation
  acceptance. Provider consent/grant/OAuth and incoming record-request fixtures
  remain to be rehearsed.
- Production schema inventory includes additional auth-related tables absent from
  preview (e.g. ehr_auth_tokens, fhir_oauth_states, patient_identity_links and
  share_confirmation_receipts). The 34-table export is not a deletion inventory.
- Production `shares` bucket is private; preview's historical `shares` bucket is
  public. The rehearsal used only the private `medical-form-uploads` bucket.
- No retention expiry, recovery/reapplication of deletion, provider-managed data
  erasure or production rollout is approved by these tests. Keep minimal tombstone
  retention as an unresolved policy/implementation decision.
- Snapshot B equality and zero synthetic leftovers prove fixture isolation only;
  they do not prove a universal erase procedure for every production relationship.

## Protected-download follow-up — October 2, 2026

The new `record-file` path now passes immediate unlink/account-block denial in
preview, including two-account object ownership and a real browser viewer check.
See PROTECTED_FILE_DELIVERY.md. Previously issued direct Storage links, privileged
import/share paths and full production erasure remain separate unresolved gates.
