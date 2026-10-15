# Validation snapshot — October 3, 2026

This is a readiness inventory, not a production approval.

## Automated checks

17 existing focused regression suites passed: mobile assistant, cancellation, Medical,
provider connection/import/return, record refresh/colors, request creation/resend/upload,
adaptive layout, share handler/claims, semantic colors, chart policy and calendar dates.
The added rendered-chart and form-schema compatibility suites also passed (19 suites total).

Web build passes. iOS normal-entry export passes. Existing bundle-size and Metro
cssInterop configuration warnings remain.

## Full TypeScript gate

12 errors remain (down from 180 across the readiness passes) after fixing provider/pharmacy validation, the onboarding
legacy-insurance promise chain and Zod 4 insurance metadata records. No compiler options were relaxed. These include unused
code, missing model fields and callback/type mismatches. The successful Vite build does
not typecheck these paths. Fix by feature area; do not suppress them wholesale.

Counts by diagnostic after the component follow-up: **TS6133: 12** (unused code).
All previously reported structural/prop/type diagnostics are resolved. The full gate
still fails; unused declarations must be reviewed, not hidden by compiler changes.

## Dependency gate

`npm audit --omit=dev --json` reported {'info': 0, 'low': 3, 'moderate': 30, 'high': 53, 'critical': 1, 'total': 87}.
These are dependency-graph findings, not that many independently exploitable deployed
endpoints. Expo includes tooling in its dependency graph. The critical `tar` advisory
is reached through Expo/cacache tooling; runtime reachability has not been exhaustively
assessed. Many npm proposals replace pinned Expo 51 / RN 0.74 with major releases.

Do not run `npm audit fix --force`. Use a separate reviewed SDK upgrade: select a supported
Expo/RN/native-module matrix, rebuild dev clients, migrate NativeWind/Metro patches,
exercise sign-in/secure storage/files/OAuth/notifications and run native release builds.
Apply compatible transitive patches only after checking their parent constraints.
Re-run audit on the actual release lockfile and record accepted exceptions with owners.

## Preview email sink acceptance

A temporary preview-only adapter executed the real handler with live Supabase Auth,
database and Storage. It rejected non-fixture accounts and allowed only three invalid
synthetic recipients. It replaced both Resend call sites; no external email was sent.
Six simultaneous first requests per scenario produced exactly one recorded dispatch.
Accepted response persisted matching provider ID and receipt. Lost reply and HTTP 503
remained pending with no receipt; replay did not dispatch again; changed content conflicted.
All three claims had share correlation and attempt timestamps. Six storage objects were
removed. Independent inventory found zero fixture users/claims/shares/objects.
Normal preview handler restored as v57, identical SHA to v52:
`545fbefc87c1946ec7f6fd14297daf0975e5ac05eb1a83983860b21e9f3de1bb`.
Temporary sink table removed. This tests hosted concurrency with simulated provider outcomes,
not Resend inbox delivery or every live receipt-write failure.

## UI acceptance

Chart light/dark examples inspected at 320px: plot scrolls rather than shrinking labels;
legend wraps, markers and dash encodings remain distinct, Enter exposes exact-value table.
Viewport override restored and test tab closed.
Native synthetic pending-send reference is exposed as labeled selectable text. Found
recovery feedback was located above the long form list; moved it beside Check interrupted
send and observed the inline result. Copy gesture and VoiceOver speech are not certified.
Device Hub listed only iOS simulators, no physical iPhone or Android device. Normal entry
restored, Metro and test app stopped. No patient data used.

The reusable sink generator now fails closed on handler source drift and validates owner UUIDs.
Its new readiness preflight and logout-finally safeguard passed local generation/syntax checks;
these last harness-only safeguards were not part of the hosted v56 run.

## TypeScript follow-up

Reduced diagnostics from 173 to 153 without changing compiler settings. Network creation
now derives owner IDs solely from the session; its input type excludes caller ownership.
Care timeline resolves the patient profile ID for form reads and surfaces query errors
instead of returning a successful empty result. Added coverage status mapping, preserved
FHIR metadata through an object record, provided stable drawer toast IDs, removed unused
stat-card props and used ES2020-compatible provider-label formatting. Dynamic icons now
use Lucide's icon-only export and render its forward-ref objects correctly.

Timeline and network ownership tests use isolated adapters around the actual modules;
they do not certify hosted RLS. Both suites, icon rendering and the existing form-schema
suite passed. Web build passed; its existing bundle-size warning remains. No deployment.

## Component contract follow-up

Reduced TypeScript diagnostics from 153 to 82, all now unused-code diagnostics.
Scenario accordion callers now use the supported expanded-state prop; the shared accordion
accepts children as content and handles Space/Enter without toggling from nested controls.
Segmented examples use unique option labels and supported props, with aria-pressed state.
Wizard steps have explicit optional-number/description types, render descriptions, expose
current-step state and use valid semantic colors. Legacy navigation receives explicit types
and valid focus styling. Project duplication accepts only the card data it actually uses.

Actual-component rendering/handler tests and icon tests passed; web build passed with the
existing bundle-size warning. These are local checks, not a full browser/screen-reader audit.
No compiler settings, marketing files, production deployments or commits changed.

## Unused-code and form-save follow-up

Reduced diagnostics from 82 to 45 through unused-import and inert-binding cleanup outside
marketing. Compiler settings are unchanged. Twelve remaining diagnostics are in marketing,
pricing and the public providers page, intentionally untouched under repository scope rules.

The review exposed two form-save helpers that needed explicit patient ownership on both
lookup and update. Both now scope by the owner-resolved patient profile, propagate profile
lookup failures and require a returned saved row. A draft update clears a previous signature
instead of retaining an inconsistent signed timestamp. Existing answers still merge with edits.
Actual-module adapter tests cover these cases for both helpers; they do not establish hosted
RLS or concurrent-edit acceptance. Six focused suites and the web build passed.

Functional gaps surfaced by unused declarations remain open: the legacy import dedupe
helper is a pass-through and normalization reports no invalid rows; assistant profile
collection has an unpopulated missing-field list and unused state/callbacks. Do not certify
these paths or hide their diagnostics. Confirm active call paths before implementing or
retiring them. No production deployment, commit or patient-data mutation occurred.

## Active-path audit and retirement

The legacy import orchestrator had no callers, and its entire provider client used
MockFHIRAPI. Removed that unused chain (orchestrator, normalization, pass-through dedupe,
mock client and mock API). This does not validate or alter live import deduplication.
The active assistant uses ProviderRecordConnectionFlow and the current form autofill/chat
modules. Its old profile interview could never start: confirmation was never enabled and
missing fields never populated. Removed that branch, its write-only state and unrendered
quick-action definitions. Retained public optional props for caller compatibility.

Other cleanup removes inert bindings while retaining behavior. The scenario date summary
is now static text because its prior button only changed unused state and opened nothing.
Unused scenario onSave integration remains unsupported; retiring its unused local binding
does not implement a save callback or certify the scenario save flow.

Compiler now reports only 12 TS6133 errors in protected marketing/public-site files.
App and gallery code produced no diagnostics in this run, but the full command still fails.
Five targeted suites passed (mobile provider connection/import, form-save ownership,
form schemas, component contracts), and web build passed with the existing size warning.
No browser/screen-reader acceptance, live import run or production change in this pass.

## Compatible dependency patches

Resolved a candidate lockfile in an isolated temporary workspace, then applied it. The
result matches the candidate exactly. Updated 17 package entries across Babel, js-yaml,
Joi, Nanoid and Undici; npm also deduplicated redundant nested packages. Existing Expo
51.0.39, React Native 0.74.5 and Metro pins remain. No force overrides or manifest changes.
PostCSS remained pinned by its consumers and was not upgraded by this targeted operation.

Fresh omit-dev audit: **84 findings (2 low, 30 moderate, 51 high, 1 critical)**, versus 87.
Babel core, Joi, js-yaml, Nanoid and Undici no longer appear as vulnerable packages.
NativeWind/css-interop appear as inherited findings through Tailwind in the new audit,
although their versions did not change. Counts include meta-vulnerabilities; they do not
measure independent exploits. Critical tar remains in old Expo tooling. See the repository audit snapshot `dependency-audit-2026-10-03.json`.

Web build, normal-entry iOS export, form-save, component-contract and mobile import tests
passed after installation. Full typecheck still reports the same 12 marketing diagnostics.
No native binary rebuild, device acceptance, production deployment or commit occurred.

The remaining native-stack work requires incremental SDK migration, matching dependencies,
native-project updates and release testing, following [Expo's upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).
Do not interpret the successful JS export as native SDK upgrade acceptance.
