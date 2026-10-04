# Insurance preview deployment — October 4, 2026

Code commit: `78cec7e` (curated insurance batch and required shared dependencies).
Other accumulated working-tree changes were excluded. No Git push or production release performed.

Web: https://healthvault2-insurance-preview.timothymcguire.workers.dev
Cloudflare Worker: `healthvault2-insurance-preview`
Version: `56b544d0-8b75-4372-9f6e-bd01352f7546`
Backend: `roeudwddxvniazwufdqf`, the existing preview branch of `sgwekxjlvadvdosyudgj`.

## Deployed in order

1. `atomic_primary_insurance`: zero duplicate-primary owners, RLS enabled before migration.
2. `explicit_insurance_member_id`: additive explicit-ID column, no historical conversion.
3. `ai-health-assistant` version 34; JWT verification retained.
4. `account-export` version 4; JWT verification retained.
5. Web build from the exact curated staged snapshot, using only the preview Supabase URL/key. Production backend URL was absent from the bundle.

## Verification

- Exact staged snapshot: nine insurance suites and Vite build passed.
- Installed migrations: rollback-only SQL passed owner/replay, foreign/stopped rejection, second-write rollback, unique-primary constraint, explicit-ID round trip and blank rejection.
- After tests: zero synthetic users/providers remained.
- Hosted `/` and `/dashboard` serve Health Vault HTML successfully.
- Hosted JavaScript SHA-256 matches the preview build artifact.
- Unauthenticated POSTs to both deployed functions return 401.
- An initial Python HTTP probe received 403; subsequent curl probes returned 200 and passed bundle integrity. No access controls were changed to obtain this result.

## Limits and rollback

This is a preview deployment, not production approval. Authenticated browser saves, mobile keyboard/screen-reader flows, full TypeScript/dependency gates and the broader readiness list remain open. No mobile store/OTA release was performed. The broader working tree still contains unrelated unfinished work.

Previous preview function versions: assistant 33 and account-export 3. Web preview Worker was created for this release. Reverting clients/functions must preserve newly stored explicit member IDs; do not drop the column as rollback. Keep the atomic RPC while any client depends on it.
