# SDK 52 migration candidate — not approved for adoption

Prepared 2026-10-03 in `/tmp/hv-sdk52-candidate-6mk95lor`. Main workspace remains SDK 51.
Files here are review artifacts, not active package-manager configuration.

## Candidate

Expo 52.0.49, React Native 0.76.9, React 18.3.1, Reanimated 3.16.7, Router 4,
and SDK-matched Expo modules. Shared React override requires admin React alignment too.
Removed old root Metro overrides in the candidate. React Navigation range is ^7.0.14.
iOS minimum is 15.1; new architecture stays disabled for the first migration step.
The current css-interop/dev-menu patch script was applied and still requires native review.

The patch captures manifest, iOS target, Podfile and guarded fmt backport edits. The lockfiles preserve exact resolutions.
Apply only in a separate copy of the matching source baseline. Regenerating from broad
manifest ranges can change unrelated dependencies; review the lockfile before adoption.
No environment files or credentials were copied.

## Passed

- Clean npm installation and top-level native dependency tree.
- Expo offline install check: dependencies up to date (offline validation has limits).
- iOS JavaScript/Hermes export and web production build.
- Provider connection, import and upload module regression suites in the candidate.
- CocoaPods installation: 93 pods, using `EXPO_UNSTABLE_CORE_AUTOLINKING=1 pod install`
  and a fresh candidate pod lock. Prior CLI autolinking and SDK 51 fmt lock failed.
- Full TypeScript check has the same 12 existing public-site unused-code errors.

## Native compatibility work

The original Xcode 27.0 (27A266a) failure was fmt 11.0.2's FMT_STRING consteval path.
Backported upstream fmt PR #4612 into this candidate only. The macro uses the literal
when consteval is enabled; compile-time validation remains enabled. The Podfile invokes
the version/shape-guarded, idempotent patch after installation. No compiler check is disabled.
`test-fmt-backport.py <candidate>/apps/mobile/ios/Pods` verifies valid formatting and
compile-time rejection of invalid specifiers under both C++17 and C++20. All four pass.
Separate checks confirm idempotence and rejection of an unexpected fmt version.

The candidate Podfile defaults to Expo autolinking and raises old pod deployment targets
to 15.1 without lowering higher targets. App targets are also 15.1. Pod regeneration passes.
CocoaPods still reports expo-dev-menu DEFINES_MODULE merge warnings.

## Remaining

Full unsigned arm64 Debug simulator build **passed** on Xcode 27.0 after pod regeneration,
without a command-line deployment-target override. Build output:
`/tmp/hv-sdk52-derived/Build/Products/Debug-iphonesimulator/HealthVault.app`.
Build log: `/tmp/hv-sdk52-xcodebuild-fmt.log` (`BUILD SUCCEEDED`).
Installed and launched in a fresh iPhone 16 Pro / iOS 18.6 simulator. See runtime-smoke.md for bounded local-fixture checks and remaining gaps.

Candidate audit: 58 findings (17 moderate, 40 high, 1 critical), versus 84 on SDK 51.
This intermediate SDK does not close the dependency release gate. No physical-device testing, Android build, native Release build or production deployment.

Next: install and launch the candidate in an isolated simulator, then test runtime flows
before the next incremental SDK step. Debug compilation is not release/runtime acceptance.

## Primary references

- [Expo SDK 52 release notes](https://expo.dev/changelog/2024-11-12-sdk-52)
- [Expo incremental upgrade guide](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Upstream fmt 11.0.2/modern Clang issue](https://github.com/fmtlib/fmt/issues/4247)
- [React Native Xcode fmt issue](https://github.com/react/react-native/issues/55601)

## Reproduce native compilation

In the isolated candidate's `apps/mobile/ios` directory:

```sh
pod install
xcodebuild -workspace HealthVault.xcworkspace -scheme HealthVault \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/hv-sdk52-derived CODE_SIGNING_ALLOWED=NO ARCHS=arm64 build
```

- [Upstream fmt backport](https://github.com/fmtlib/fmt/pull/4612)
