# Insurance preview deployment — October 4, 2026

Code commit: `78cec7e` (curated insurance batch and required shared dependencies).
Other accumulated working-tree changes were excluded. No Git push or production release performed.

Web: https://healthvault2-insurance-preview.timothymcguire.workers.dev
Cloudflare Worker: `healthvault2-insurance-preview`
Current web version: `1f5a57ca-d569-4255-b873-4b7e0fbed836` (initial version: `56b544d0-8b75-4372-9f6e-bd01352f7546`).
Backend: `roeudwddxvniazwufdqf`, the existing preview branch of `sgwekxjlvadvdosyudgj`.

## Current promotion status

**Blocked pending release-source integration and remaining acceptance gates.** Insurance preview behavior has passed scoped checks; this is not whole-app production approval.

| Gate | Current evidence |
| --- | --- |
| Real preview account signup | User completed verification with the full emailed code. |
| Authenticated insurance writes | Member-ID save and primary switch accepted; original primary restored. |
| Feedback and keyboard | Persistent receipt, manual dismissal, editor autofocus, Escape and Cancel return focus accepted. |
| Responsive layout | 375px and 768px checks passed; controls measured at least 48px high. |
| Explicit failed save | Local real-component HTTP 503/200 fixture passed retained-draft retry; no real account writes. |
| Full source typecheck | **Fail:** isolated preview source reports 169 diagnostics across 40 files; working copy reports 12 across four marketing files. Results are not interchangeable. |
| Native accessibility | VoiceOver/TalkBack, maximum text size and end-of-list action reachability remain open. |
| Ambiguous save outcome | Response lost after server commit remains untested. |
| Production backend and web | Not promoted. Run production preflight and reviewed rollout after source/acceptance gates. |

### Source consistency audit

The isolated snapshot at `/tmp/hv-insurance-release` was built with the workspace's installed dependencies via a `node_modules` symlink. Its Vite build passing does not imply TypeScript validation passed or that installation is reproducible from its own lockfile. The snapshot retains older source consumers while the working copy contains additional uncommitted fixes. Examples include Zod `.errors` access, required Toast IDs, component prop mismatches, and network ownership types. The full 169 diagnostics include 79 unused-symbol diagnostics and 90 other diagnostics; none are reported directly in the insurance files.

Do not copy the entire working tree to clear these failures. Review and integrate the missing dependencies/fixes in bounded batches, then install from the candidate lockfile and check that exact candidate. Marketing files are outside the current app-edit scope; their 12 unused-symbol diagnostics remain recorded rather than suppressed. No compiler exclusions or weakened checks were added.

Audit result: working copy **12/13 checks pass** (only full typecheck fails); isolated snapshot **11/13 pass** (typecheck plus the cross-client completeness assertion fail). Current test scripts were copied into the temporary snapshot before checking it; application source was not changed. The snapshot still contains the older native status resolver, while the working copy has the shared completeness resolver. This is an additional native source-integration gap, not evidence that the deployed web badge is broken.

Run `node /path/to/repository/scripts/check-insurance-release.mjs` **with the release source root as the working directory**. It runs the full web typecheck and 12 focused suites, continues after a failed check, and exits nonzero if any fail. It does not build, deploy, touch account data, or replace device/browser/database acceptance.

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

This is a preview deployment, not production approval. Authenticated browser saves have passed the checks above. Native screen-reader flows, ambiguous save outcomes, full TypeScript/dependency gates and the broader readiness list remain open. No mobile store/OTA release was performed. The broader working tree still contains unrelated unfinished work.

Previous preview function versions: assistant 33 and account-export 3. Web preview Worker was created for this release. Reverting clients/functions must preserve newly stored explicit member IDs; do not drop the column as rollback. Keep the atomic RPC while any client depends on it.

## Preview routing correction

The initial HTTP/bundle checks missed a rendered Organization Not Found error. The exact preview hostname now uses main-app routing; production tenant routing and deliberate organization previews remain intact. Regression test and build passed. Redeployed Worker version `6df6236c-5fa1-4456-b76c-ecc0e60cde5f`; browser reload verified the landing page and Log In opening the sign-in form. Authenticated saves were unverified at this routing step; later acceptance is recorded above.

## Email verification unblock

Preview Worker `2959233c-e4e0-4be4-8a0d-38cfefb719e9` replaces the six-slot OTP form with a full-code input and explicit submit. Component regression and isolated build pass; browser confirms the deployed labeled field and Verify email button. Account email can be re-entered when the verification step is reopened. The user subsequently completed emailed-code verification; no production auth configuration was changed.

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

## October 5 — Shared component integration candidate (not deployed)

This update supersedes the original audit counts for the local candidate; the hosted Worker is unchanged.

Reviewed seven component/gallery fixes: Accordion child content and keyboard activation, icon registry lookup, segmented selection semantics/examples, typed wizard steps, typed legacy navigation, and current scenario component props. Corrected duplicate gallery option labels so selected examples have matching unique values. Added component-contract and icon-rendering regressions to the release runner. Synchronized the candidate native InsuranceScreen with already-committed source, clearing the stale completeness assertion.

TypeScript diagnostics fell from **169 to 98**. All 12 insurance/routing suites and both component regressions pass. Full typecheck still fails. Local Vite compilation passes with the existing large-chunk warning. This compilation did not supply deployment environment variables and must not be uploaded; deployment requires a fresh build with explicit preview backend configuration. Dependencies remain shared via symlink; independent lockfile installation and native device acceptance remain open.

Next: review network validation/ownership types, remaining product consumers and legacy service errors. Preserve marketing scope and unrelated working-tree changes.

## October 5 — Network validation integration candidate (not deployed)

Integrated reviewed network drawers/tabs and store create signatures. Provider/pharmacy creation derives ownership only from the signed-in session, ignoring even untyped caller-supplied IDs; absent sessions reject before insert. This checks create ownership only, not all network authorization paths. Forms use Zod issues and required Toast identifiers. Names now trim before minimum-length validation, preventing whitespace-only entries.

Candidate validation: **85 TypeScript diagnostics remain**, down from 98. All **16 focused suites pass**; full typecheck is the sole failed check (16/17). New tests execute actual submit handlers with real schemas for invalid/valid names and actual store create functions with synthetic sessions. Vite compilation passes with existing chunk warning. No deployment credentials supplied to compilation; do not upload this local output. Production and hosted preview unchanged. Other network behavior such as duplicate submissions/account transitions remains outside this validation claim.
