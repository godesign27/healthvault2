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
