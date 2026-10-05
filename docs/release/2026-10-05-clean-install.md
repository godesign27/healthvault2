# Clean candidate install — 2026-10-05

Source: curated insurance release candidate through33983da. Isolated directory: `/tmp/hv-clean-install.N2r5ha`.

- Node24.15.0 / npm11.12.1 (packageManager declares npm10.9.2; that exact npm version was not tested).
- `npm ci --no-audit --no-fund`: pass;1681 packages installed; compatibility postinstall succeeded.
- Lockfile unchanged; SHA256 `6a1c27d04e8c7568696ef9c37377c10b3a9c1b84fc13a74fed07160b9d102255`.
-21 focused suites pass. Full typecheck remains blocked by12 marketing-only diagnostics.
- Vite build passes with existing chunk-size warning. Build is validation only, without deployment environment credentials.
- No deployment, database changes or native-device acceptance performed.

## Dependency audit

`npm audit --omit=dev --json` reports 89 affected packages:3 low,30 moderate,55 high,1 critical. Counts include inherited dependency findings and mobile tooling declared under workspace dependencies; they are not89 confirmed production exploits. Critical package:tar. Many suggested resolutions require major Expo/React Native upgrades incompatible with the pinned SDK51 baseline. No automatic fixes applied.

Next: triage dependency paths and runtime exposure, choose compatible upgrades in isolation, and rerun clean-install and native checks. Physical VoiceOver/TalkBack, large-text and final browser acceptance remain open.

## 2026-10-05 — Critical tar dependency triage
Traced tar6.2.1 to Expo51 CLI0.18.31 and cacache18.0.4. Evaluated exact7.5.22 override only in disposable clean candidate. npm11 retained the old resolution; pinned npm10.9.2 resolved7.5.22. Runtime reproduction forcing Expo JS extraction fallback fails: tar7 sets __esModule with no default export, but Expo calls default.extract. Override rejected and original package/lock restored. Workspace dependencies and deployed app unchanged. This is a tooling dependency finding, not evidence of browser runtime exploitation. Critical advisory remains open pending tested tooling migration or maintained compatibility patch; do not mark audit passed.

## 2026-10-05 — Tested tar7 compatibility fix
Pinned tar7.5.22 with a version-guarded Expo CLI0.18.31 named-export patch for both npm and fallback archive extraction. Pinned npm10.9.2 clean install applies postinstall successfully. Synthetic archive extraction tests exercise both actual Expo utilities;21 focused suites and build pass. Audit falls89 to85 affected packages, critical1 to0 and tar absent;52 high remain. Applied bounded package/lock diff preserving existing workspace lockfile changes. No deployment/native-device build;12 marketing TypeScript diagnostics remain. Scripts provide reproducible compatibility checks; patch intentionally rejects unknown Expo CLI versions.

## 2026-10-05 — Compatible dependency patch batch
Updated brace-expansion, browserslist, fast-uri, joi, js-yaml, nanoid and undici within existing ranges using npm10.9.2; Expo/RN pins unchanged. Isolated npm ci/postinstall, Expo archive regression,21 focused suites, web build and public Expo config pass. Full typecheck remains12 marketing diagnostics. Audit79 affected packages (46 high,30 moderate,3 low,0 critical), down85/52 high. Preserved unrelated dirty lock entries; advanced existing nanoid3.3.19 workspace entry to tested3.3.20. No deployment or native binary build performed.

## 2026-10-05 — PostCSS security compatibility batch
Pinned PostCSS8.5.29 (direct and override) and resolved compatible XML/YAML updates in isolated candidate. Clean npm10 install, Expo tar tests,21 focused suites, Metro CSS transform and web build pass.12 marketing diagnostics remain. PostCSS advisory removed; audit80 affected packages/47 high/0 critical, with newly attributed NativeWind/CSS Interop transitive findings. Counts do not represent confirmed exploitable app paths. Workspace lock changes preserved. No deployment or native device acceptance.

## 2026-10-05 — Expo plist XML parser fix
Scoped @expo/plist override to @xmldom/xmldom0.8.15; existing plist dependency retains0.9.12. Clean npm10 install, actual Expo plist round-trip/nested-value/XML text escaping tests, tar extraction tests,21 focused suites and build pass. Test initially used wrong default-export access; corrected harness before acceptance. Audit78 affected packages (46 high,29 moderate,3 low,0 critical); XML advisory absent. Image-size1 requires major-version compatibility review; not changed. No deployment/native binary build.12 marketing TypeScript diagnostics remain.

## 2026-10-05 — Metro image parser compatibility
Pinned image-size2.0.4 with version-guarded Metro0.80.12 named-export postinstall patch. Actual Metro PNG/SVG dimensions, non-image handling, empty/malformed input rejection pass. Clean npm10 install, plist/tar regressions,21 focused suites and web build pass. Audit75 affected packages/43 high/0 critical, image-size absent. Native candidate lacks Pods; Xcode workspace inspection failed with invalid workspace and unavailable CoreSimulator service, so native binary/device acceptance remains unverified. No deployment.12 marketing typecheck diagnostics remain.

## 2026-10-05 — Native simulator compilation
Prepared isolated iOS Pods; original deployment-mode install failed on missing EXSplashScreen and hoisted dependency paths. Regenerated candidate lock and confirmed pod install --deployment passes. Xcode27 rejects saved iOS13.4 target. Diagnostic unsigned Debug simulator build with invocation-only IPHONEOS_DEPLOYMENT_TARGET=15.0 succeeded (both arm64/x86_64). An intermediate run overlapped Pods re-verification and reported missing glog headers; uncontested final run succeeded. No saved OS target change, signing, device install or deployment. Debug native compilation is not JS runtime/device/accessibility acceptance. Candidate lock saved under docs/release/native-candidate; existing dirty workspace Podfile.lock preserved.
