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

## Persistent insurance feedback

Preview Worker `0fdd894c-1dc1-4027-94dd-c524e549912a` uses a static persistent Banner above the insurance list. Regression covers loading/refetch stability and accessible manual dismissal; isolated build passes. Interactive preview save showed the confirmation after cards returned and beyond the old timeout; manual dismissal passed. Test primary selection was restored to its original plan. No production release.

## Member-ID badge correction

Worker `58de17f4-6c31-4ffa-bce2-fdfc2eb1d6a7` derives card status from explicit member-ID presence and end dates. Browser confirms the updated plan displays Saved, the missing-ID plan displays Member ID needed, and the ending-soon plan retains its warning. Three focused regressions and isolated build pass. Shared native source updated; no native or production deployment.

## Responsive insurance layout

Worker `46d3e27c-34b8-41ee-ba5c-14aad18de3fb` preserves header clearance at phone/tablet widths and stacks narrow card content. Browser checks at 375px and 768px: document width equals viewport width, heading begins at 80px under the 56px header, and measured coverage actions are 48px tall. Focused regressions/build pass. Native device accessibility remains a separate gate.

## Consistent insurer tiles and keyboard editing

Worker `1f5a57ca-d569-4255-b873-4b7e0fbed836` provides initials on every coverage card and member-editor focus recovery. Browser verified Enter opens the editor, autofocus reaches its labeled input, blank Save is disabled, Tab reaches Cancel, and Escape/keyboard Cancel restore focus. Component/hook tests cover failed-save draft retention and duplicate writes. Initial browser load was blank without captured errors; reload recovered. Live network-failure simulation and native screen-reader acceptance remain unverified.

## Browser failure recovery acceptance

Local isolated fixture: real insurance card/hook sends same-origin HTTP requests. A 503 retains the draft, shows an error, re-enables controls and never claims success. Retrying with 200 saves once, closes editor and shows Saved/Member ID saved; two requests total. No real account data touched. Native theme/data/refresh suites pass. VoiceOver and ambiguous network outcomes remain unverified; this result is not production approval.
