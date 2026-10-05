# Isolated iOS candidate — October 5, 2026

Dependency candidate: `/tmp/hv-clean-install.N2r5ha`.

The original locked Pods install failed because EXSplashScreen was missing and four dependency paths pointed to non-hoisted installations. Regenerated Pods locally; deployment-mode installation then passed. The saved candidate lock retains React Native0.74.5. It is evidence for review, not promoted over the workspace's existing uncommitted iOS lockfile.

Xcode27 rejects the committed iOS13.4 minimum. A diagnostic simulator build uses `IPHONEOS_DEPLOYMENT_TARGET=15.0` on the command only; no supported-OS policy was changed. No signing, device installation or production deployment performed.

Native device accessibility and runtime acceptance remain separate checks.

Result: **BUILD SUCCEEDED** for unsigned Debug iOS Simulator (arm64 and x86_64), using invocation-only iOS15 target. Build artifact: `/tmp/hv-native-derived/Build/Products/Debug-iphonesimulator/HealthVault.app`. This does not prove JavaScript bundling, runtime flows or accessibility.
