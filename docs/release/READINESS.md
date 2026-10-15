# Health Vault release readiness

Current consolidated queue — October 3, 2026. **Not approved for production release.**
This is the current index; tasks.md retains historical progress rather than silently
deleting the evidence. Matching screens and passing builds do not establish feature parity.
See [validation evidence](2026-10-03-validation.md) for this pass.

| Area | Verified / implemented | Still required |
| --- | --- | --- |
| Secure sharing | Preview claims, private correlation, status, replay/revoke; hosted first-send concurrency through synthetic email sink; one dispatch per scenario | Audited support resolution; recipient/patient-receipt acceptance in real provider environment; physical-device acceptance; production rollout |
| Mobile accessibility | Shared adaptive controls; simulator large-text/AX checks; support reference and inline recovery feedback | Physical iPhone VoiceOver, Android/TalkBack, copy gesture, focus return, full-shell dark/keyboard flows |
| Design consistency | Shared semantic palette preserving core colors; chart order/dashes/markers/exact table; 320px plot scrolling | Remaining SaaS/GPT/native semantic consumers; mark contrast/color-vision checks; remaining chart variants, textures and demos |
| Feature parity | Real native forms, uploads, request/create/resend/cancel, sandbox provider OAuth/import/refresh; read-only assistant guard | Assistant conversation with configured preview secret; standalone record sharing; confirmed chat writes; wellness/vitals/account-controls journey audit |
| Security/operations | Synthetic export/deletion-request, erasure/block and upload-recovery preview evidence | Approved retention, storage+DB restore rehearsal, complete privileged access-block coverage, legacy-link migration, adults-only server enforcement, dependency remediation |
| Release preparation | Web and iOS exports; focused regression suites; current inventory | Full TypeScript gate, review accumulated diffs, coordinated migrations/backend/client rollout, production smoke checks, app submission |

## Next engineering work (no new product decision needed)

1. Implement narrowly scoped audited support recovery: authenticated platform-owner intervention,
   recent MFA, exact owner/request lookup, transaction/row lock, receipt only from persisted
   acceptance evidence, immutable audit. Never resend, infer failure from elapsed time, expose
   bearer links or clear an unknown marker. Live ownership/denial/race tests required.
   Preview currently lacks `admin_role_assignments` and `admin_audit_events`; establish the
   reviewed admin baseline before live recovery tests. No roles were granted in this pass.
2. Repair remaining TypeScript errors by feature area (12 unused-code diagnostics remain, all in marketing/public-site files outside this app scope). Prioritize model/validation/callback
   mismatches over unused imports. Do not loosen compiler flags or introduce broad any casts.
3. Compatible Babel/YAML/Joi/Nanoid/Undici patches are applied and build-tested; 84 audit
   findings remain, including critical tar in old Expo tooling. Prepare an isolated Expo/RN upgrade candidate, preserving the current pinned working stack
   until native builds and dependency compatibility pass. The [SDK 52 candidate](sdk52-candidate/README.md)
   passes web/JS export, pod installation and unsigned arm64 Debug simulator compilation on Xcode 27 with a guarded upstream fmt backport. Native runtime, Release and Android acceptance remain open. Audit toolchain and shipped runtime
   reachability separately; no force upgrade against the release branch.
4. Legacy mock import pipeline and unreachable assistant interview have been retired after
   caller audit. Continue testing the actual preview/confirm import and form-autofill flows;
   removal of obsolete code is not new functionality or a live-data acceptance test.
5. Finish semantic feedback migration and chart variant coverage without changing core brand.
6. Finish the independent parity audits and explicit confirmation flows before claiming parity.
7. Complete production legacy-file migration journal and access-block coverage using the
   documented preview evidence, with scoped dry runs before any real patient mutation.

## External inputs / environments

- A connected physical iPhone and Android device/emulator for the remaining interaction tests.
- Preview OpenAI secret configured through Supabase secrets (never paste it into chat).
- Confirmed retention periods/backup exceptions and operational fulfillment ownership.
- Authorized isolated recovery target for a full database plus file restoration rehearsal.
- Real provider email acceptance testing must use explicitly authorized test recipients;
  synthetic sink results do not prove inbox delivery.

## Release sequence

Review current diffs and decide candidate commit boundaries; do not stage the whole dirty tree.
Resolve blockers, then apply reviewed DB changes before functions that depend on them.
Verify preview and client compatibility, capture rollback versions, and perform a separate
production approval/release check. Follow backend deployment with compatible web/mobile builds,
then smoke-test login, read/save, upload, share/revoke, account controls and monitoring.

No production deployment, real patient mutation or external email occurred in this pass.

## Native runtime findings (2026-10-03)

The SDK 52 candidate launches with a clean synthetic session. Dashboard sample activity and
inert quick actions were fixed. Care samples and sign-in recovery/accessibility have local fixes with isolated regression coverage. Web/native Vitals now show owner-scoped saved measurements; native menu dead ends were removed, and focus/safe-area/semantic-feedback fixes are local. Hosted recovery callback/delivery, interactive data-flow acceptance and physical accessibility still block release. Vitals entry/charts and Care sharing remain outside implemented native parity. See
[bounded runtime evidence](sdk52-candidate/runtime-smoke.md); full native parity is not verified.

## Insurance correctness update (2026-10-03)

Unsupported insurer verification is removed locally across clients/assistant. Shared status/date rules, web retry/race protection and atomic primary selection pass focused checks; rollback-only preview SQL proves ownership, uniqueness and second-write rollback. See [insurance evidence and rollout order](insurance-correctness.md). The RPC migration must precede dependent clients/functions. This is not deployed or an insurer eligibility integration; mutation interaction/device acceptance and legacy member-ID fidelity remain open.

Explicit insurance identifier storage is now implemented locally with an additive migration and owner/foreign-denial preview evidence. Both the atomic-primary and explicit-member-ID migrations must precede dependent clients/functions (including account export). Historical re-entry and deployed interactive acceptance remain open; no production rollout has occurred.
