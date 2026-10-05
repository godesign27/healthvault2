# Isolated iOS candidate — October 5, 2026

Dependency candidate: `/tmp/hv-clean-install.N2r5ha`.

The original locked Pods install failed because EXSplashScreen was missing and four dependency paths pointed to non-hoisted installations. Regenerated Pods locally; deployment-mode installation then passed. The saved candidate lock retains React Native0.74.5. It is evidence for review, not promoted over the workspace's existing uncommitted iOS lockfile.

Xcode27 rejects the committed iOS13.4 minimum. A diagnostic simulator build uses `IPHONEOS_DEPLOYMENT_TARGET=15.0` on the command only; no supported-OS policy was changed. No signing, device installation or production deployment performed.

Native device accessibility and runtime acceptance remain separate checks.

Result: **BUILD SUCCEEDED** for unsigned Debug iOS Simulator (arm64 and x86_64), using invocation-only iOS15 target. Build artifact: `/tmp/hv-native-derived/Build/Products/Debug-iphonesimulator/HealthVault.app`. This does not prove JavaScript bundling, runtime flows or accessibility.

JavaScript follow-up: preview-configured `expo export --platform ios` now passes after shared-token watch-folder and image parser file-input fixes:999 modules,21 assets,3.6MB Hermes bundle. Output `/tmp/hv-ios-bundle`, log `/tmp/hv-ios-bundle.log`.

## Simulator runtime — 2026-10-05

Installed the unsigned Debug app on the existing Health Vault SDK52 QA simulator (iPhone 16 Pro, iOS 18.6). Metro ran from the isolated candidate on `127.0.0.1:8093` with the preview Supabase host `roeudwddxvniazwufdqf.supabase.co`. Production configuration was not used. The dev client loaded `index.js` (1085 modules) and showed the sign-in screen: logo, “AI Medical Assistant,” email, password, Forgot password, Sign In, and the footer “Your data is encrypted and HIPAA-compliant.”

A system “Open in Health Vault?” dialog blocked the first URL open. This Xcode 27 install has no Simulator.app, and HID events acknowledged by SimulatorKit did not change the screen. After a simulator reboot, the dev client opened its saved preview Metro URL without that dialog.

Largest text size (`accessibility-extra-extra-extra-large`) scales and wraps the sign-in copy. The Sign In control is clipped at the bottom of the screen, Forgot password wraps onto two lines, and the password placeholder collides with the visibility icon. Increase Contrast was enabled during that large-text state; the screen stayed readable, and no contrast ratio was measured. Content size was restored to `large` and Increase Contrast was turned back off.

Not verified: authentication, session reload, Dashboard, Records, Forms, Care, Insurance, Medical Profile, sign-out, VoiceOver focus order, reduced motion, and touch-target behavior. No preview account was created and no credentials were recorded. This is not runtime or accessibility acceptance.
