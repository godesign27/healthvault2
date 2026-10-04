# Insurance correctness — 2026-10-03

Local implementation is validated; nothing in this batch is deployed.

## Changes

- Web/native show Saved for legacy connected/verified flags, with a notice that benefits and eligibility have not been checked. Fake Refresh Verification and timed verification writes are removed. Both assistant verification handlers fail closed without database writes.
- Shared dates preserve date-only calendar values. Passed end dates no longer display Ending soon.
- Web reads are owner-scoped, retain rows with missing provider metadata, show persistent failure/retry and exclude late responses across refresh/account changes/unmount. Header refresh no longer captures the initial missing account.
- Primary selection uses `set_primary_insurance(uuid)` in both clients and assistant paths. It authenticates through `auth.uid()`, honors RLS, accepts only the owner's active coverage, locks per owner, and changes both rows in one transaction. A unique partial index guards duplicate primary flags. Both assistant paths require confirmation; all callers require a matching result before claiming success.
- Client delete/stop/resume mutations now require owner scope and a returned row.

## Evidence

17 focused local suites passed: insurance correctness; web insurance data/refresh; native insurance data/refresh/theme; semantic colors; adaptive layout; navigation; Vitals data/refresh; Care data/dates/refresh/theme; password recovery; auth recovery state.

Vite build passed, with the existing large-bundle warning. SDK 51 iOS export passed at `/tmp/hv-insurance-correctness-export`, with the existing CSS interop configuration warning. Full TypeScript reports 12 pre-existing unused-code diagnostics in marketing/public-site files outside this app scope.

Isolated preview `roeudwddxvniazwufdqf` rollback-only test passed: own active target, replay, foreign/stopped rejection, injected failure on the second write preserving the previous primary, and duplicate-primary constraint. Tests run under authenticated RLS, with synthetic users inside the transaction. Follow-up confirmed fixtures and the test RPC were absent after rollback. No production patient data was read or changed.

## Rollout order and remaining acceptance

1. Review migration `20261003220000_atomic_primary_insurance.sql`. Preflight duplicate primary flags; resolve them through an explicit data decision. The unique index deliberately aborts if duplicates exist.
2. Apply reviewed migration in the approved preview environment before clients/functions that call it. Run interactive success/failure/replay acceptance there. Without the RPC, new callers fail visibly rather than clearing a primary in separate writes.
3. Review/deploy assistant function and web/native changes together after migration acceptance. Capture previous function/client versions for rollback; do not drop the RPC while dependent clients are active.
4. Test repeated taps, account changes during mutations, and physical screen-reader/large-text behavior. Automated read races and database rollback do not certify these interaction cases.

Legacy member-ID hash/display conventions still differ across paths. Stop/resume only change saved Vault flags; they do not alter insurer coverage. No real insurer eligibility integration was added. Production rollout, dependency remediation, hosted password recovery and physical-device release gates remain open.

## Interaction guard update — 2026-10-04

Shared web/native mutation hook now blocks duplicate dispatch, checks the current account before a write, validates returned row IDs, and excludes late feedback/refresh after auth events or unmount. Focused actual-hook tests pass account changes before/after dispatch, stale owner confirmations, duplicate taps and missing receipts. Five focused suites and web/iOS export passed; 12 marketing TypeScript diagnostics remain unchanged. Buttons disable while saving and show progress. Local stop/resume labels now describe saved flags.

An already-dispatched server write can still complete after an account change; suppressing its receipt does not cancel it. Physical interaction/screen-reader acceptance and deployed preview checks remain outstanding.

## Legacy identifier safeguard — 2026-10-04

Inspection found `member_id_hash` mixes one-way hashes and plaintext across old writers. A suffix of that column cannot be asserted to be a member ID. Web/native cards now show Not available when no explicit member ID exists, and assistant readers do not generate masked digits from this ambiguous column. Profile autofill omits the uncertain value; network/tool readers return an empty member ID. No stored rows were changed, decrypted or reconstructed. This may hide previously displayed legacy values even when they look plausible; that is intentional until provenance is established.

A future storage migration must provide explicit encoding/provenance and a supported recovery/re-entry path; this safeguard does not repair lost originals or claim encryption. Existing legacy writers remain a release limitation. `scripts/test-insurance-member-id.mjs` exercises both hash-like and plaintext-looking fixtures across six reader/autofill paths and the shared display helper.

Read-only rollout preflight is saved in `supabase/tests/insurance-primary-preflight.sql`. Run it only against the approved rollout target, require zero duplicate-primary owners and enabled RLS, review inactive primary flags, then follow the migration sequence above. No production preflight or migration was run in this pass.

## Explicit storage implementation — 2026-10-04

Supersedes the earlier “existing writers require migration” implementation note: all three located client write paths (onboarding, assistant form and connection hook) now use the explicit `member_id` column through one payload helper. New writes leave `member_id_hash` empty for compatibility. Readers and account export consume the new field; legacy-only rows still produce no asserted identifier. Storage remains protected by existing coverage RLS; this is not application-level encryption. No historical backfill is attempted.

Migration `20261004120000_explicit_insurance_member_id.sql` MUST be applied before the updated web/mobile readers and writers, assistant function or account-export function. The migration is additive and can coexist with old clients, but old clients may continue writing ambiguous legacy values; do not claim those writes are repaired. Do not drop the new column as a rollback while it contains newly supplied IDs. Roll back clients/functions first and preserve captured data.

Five focused suites, web build and SDK 51 iOS export passed. Synthetic rollback-only SQL proved owner round trip, foreign read/write denial and blank rejection; follow-up verified all fixtures and the column were rolled back. Interactive deployed writer acceptance and an authenticated old-record ID re-entry flow remain open. Production has not changed.

## Existing-record editor — 2026-10-04

Web/native inline member-ID re-entry is implemented locally. It uses the guarded owner-scoped mutation path and requires an explicit nonblank save; cancel discards the draft without changing storage. Web component tests cover labels, failure retention, disabled busy controls, cancel and success. Shared mutation tests verify blank rejection and the explicit trimmed payload. Stopped cards keep usable controls without disabled-card dimming. Interactive deployed saves and physical keyboard/screen-reader focus acceptance remain open; migration order is unchanged.
