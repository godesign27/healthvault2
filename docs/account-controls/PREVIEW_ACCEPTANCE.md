# Account controls — isolated HTTP acceptance

Verified October 2, 2026. Preview project: `roeudwddxvniazwufdqf`.
Production project `sgwekxjlvadvdosyudgj` was not modified in this exercise.

## Environment and limits

Owner authorized updating the existing preview after its missing schema was reported.
Before the update: zero Auth users, zero Storage objects, 43 public tables; reference
rows existed and were preserved. Added nine export tables and ten foreign-key dependency
tables using production catalog definitions, primary/unique/check/foreign-key constraints
and indexes. Added provider_connections.ehr_source. Export-table RLS policies were
aligned with the inspected production policies, including removal of stale demo-wide
patient/form reads. Dependency-only tables remain RLS-enabled with no client policies.

The guarded bootstrap is `supabase/tests/preview-account-controls-bootstrap.sql`.
It refuses a database with existing Auth users or account_deletion_requests and runs
atomically. It is a preview test baseline, NOT a production migration or full schema
synchronization. Do not run it against production or reset the preview to repeat it.
No production rows, credentials, integration triggers, email jobs or provider connections
were copied. Ancillary integration workflows and full app parity were not tested.

Deployed the current account-export source as preview version 1, with handler-level
Auth validation and user-context RLS. Security advisor reported only ten INFO findings
for the deliberately closed dependency tables without policies; no warning/error finding.

## Passed tests

- Zero-row authenticated-role projection/grant probe for all 34 export tables.
- Rollback-only deletion SQL regression using two synthetic identities.
- Two independent password sign-ins through the real Auth API; admin-created synthetic
  accounts were confirmed without sending email.
- HTTP exports returned all 34 expected table keys and correct counts. Account A had
  251 conditions to exercise the 250-row pagination boundary; account B had one.
- Saved forms and both supported share-owner representations were included only in
  their owner's export. A foreign user/account ID in the POST body was ignored.
- Direct REST reads by B returned no A condition, patient-profile, form or share rows.
- Unauthenticated export returned 401.
- Two simultaneous deletion POSTs returned 201 and 409, with exactly one owner receipt.
- Foreign receipt reads returned no rows; foreign and unconfirmed inserts, plus an
  owner attempt to forge completion, returned 403.
- A subsequent export included the deletion receipt and still contained all 251
  conditions. Request submission did not erase data.

Runner: `scripts/test-account-controls-preview.mjs`. It hardcodes the preview project,
checks the API-key project claims, requires a mode-600 key file, generates random
passwords in memory, prints no credentials or export bodies, and cleans its own fixtures.
It uses a server-only service-role key for setup/cleanup and each user's own token for
all behavior under test. Run with HV_PREVIEW_KEYS_FILE pointing to a protected file
containing CLI JSON key output. Do not commit keys or pass key values in command arguments.

## Cleanup evidence

Seven HTTP check groups passed, including cleanup. Independent database verification:
zero Auth users, sessions, deletion requests, synthetic profiles/patients/conditions,
form responses and share events; zero stored objects. The original 18 form templates,
two providers and one pharmacy remain. The temporary preview API-key file was removed.

## Remaining acceptance

These results cover authenticated HTTP export and reviewed deletion requests, not
actual account erasure, uploaded-file cleanup, backups/restoration or revocation of
previously issued access tokens. Full browser-download/request testing with disposable
preview sessions remains distinct from the production Settings render smoke check.
The isolated schema baseline also does not resolve production migration drift.

## Browser acceptance — October 2, 2026

The real AccountDataControls component ran locally against the deployed preview APIs
using a disposable authenticated account. A loopback-only Vite proxy avoided changing
the production endpoint's CORS allowlist. This is a focused component integration test,
not a rehearsal of the entire signup/onboarding flow.

- Download My Data returned a JSON file in Downloads. Browser automation missed its
  download event, so the actual saved file was independently checked: correct synthetic
  account ID, all 34 tables and the seeded condition.
- Submit deletion request remained disabled until DELETE was entered.
- Submission showed a receipt, requested status and explicit confirmation that the
  account remained active. Reload preserved the same receipt and disabled repeat request.
- Preview request reference: 081fb742-dbb4-4228-b4c0-c43553ffe5e1 (subsequently cleaned).
- Cleanup independently verified zero users, sessions, requests and seeded conditions.
  Temporary session/key files were removed and the local test server stopped.

Harness: tests/account-controls-browser/. Fixture lifecycle helper:
scripts/account-controls-browser-fixture.mjs (setup, serve, cleanup). The session.local
file is ignored by Git and contains only a disposable user session, never an admin key.
Screenshot evidence: /tmp/health-vault-preview-receipt.png.
