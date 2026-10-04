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

## Preview routing correction

The initial HTTP/bundle checks missed a rendered Organization Not Found error. The exact preview hostname now uses main-app routing; production tenant routing and deliberate organization previews remain intact. Regression test and build passed. Redeployed Worker version `6df6236c-5fa1-4456-b76c-ecc0e60cde5f`; browser reload verified the landing page and Log In opening the sign-in form. Authenticated saves remain unverified.

## Email verification unblock

Preview Worker `2959233c-e4e0-4be4-8a0d-38cfefb719e9` replaces the six-slot OTP form with a full-code input and explicit submit. Component regression and isolated build pass; browser confirms the deployed labeled field and Verify email button. Account email can be re-entered when the verification step is reopened. Emailed-code acceptance remains pending user completion; no production auth configuration was changed.
