# Isolated iOS candidate — October 5, 2026

Dependency candidate: `/tmp/hv-clean-install.N2r5ha`.

The original locked Pods install failed because EXSplashScreen was missing and four dependency paths pointed to non-hoisted installations. Regenerated Pods locally; deployment-mode installation then passed. The saved candidate lock retains React Native0.74.5. It is evidence for review, not promoted over the workspace's existing uncommitted iOS lockfile.

Xcode 27 rejects an iOS 13.4 minimum. On October 6 the workspace minimum was set to 15.0, and an unsigned Debug simulator build succeeded without a command-line override. The built app reports minimum OS 15.0.

Native device accessibility and runtime acceptance remain separate checks.

Result: **BUILD SUCCEEDED** for unsigned Debug iOS Simulator (arm64 and x86_64), using invocation-only iOS15 target. Build artifact: `/tmp/hv-native-derived/Build/Products/Debug-iphonesimulator/HealthVault.app`. This does not prove JavaScript bundling, runtime flows or accessibility.

JavaScript follow-up: preview-configured `expo export --platform ios` now passes after shared-token watch-folder and image parser file-input fixes:999 modules,21 assets,3.6MB Hermes bundle. Output `/tmp/hv-ios-bundle`, log `/tmp/hv-ios-bundle.log`.

## Simulator runtime — 2026-10-05

Installed the unsigned Debug app on the existing Health Vault SDK52 QA simulator (iPhone 16 Pro, iOS 18.6). Metro ran from the isolated candidate on `127.0.0.1:8093` with the preview Supabase host `roeudwddxvniazwufdqf.supabase.co`. Production configuration was not used. The dev client loaded `index.js` (1085 modules) and showed the sign-in screen: logo, “AI Medical Assistant,” email, password, Forgot password, Sign In, and the footer “Your data is encrypted and HIPAA-compliant.”

A system “Open in Health Vault?” dialog blocked the first URL open. This Xcode 27 install has no Simulator.app, and HID events acknowledged by SimulatorKit did not change the screen. After a simulator reboot, the dev client opened its saved preview Metro URL without that dialog.

Largest text size (`accessibility-extra-extra-extra-large`) scales and wraps the sign-in copy. The Sign In control is clipped at the bottom of the screen, Forgot password wraps onto two lines, and the password placeholder collides with the visibility icon. Increase Contrast was enabled during that large-text state; the screen stayed readable, and no contrast ratio was measured. Content size was restored to `large` and Increase Contrast was turned back off.

With the simulator window visible, clicks and typing reach the sign-in screen. Submitting with an empty password shows “Please enter your email and password.” At the default text size, the Sign In control measures about 51 points tall and 305 points wide.

Not verified in that first pass: authentication, session reload, Dashboard, Records, Forms, Care, Insurance, Medical Profile, sign-out, VoiceOver focus order, and reduced motion.

## Signed-in screens — 2026-10-05

The preview Gmail account signed in on the same QA simulator and preview Metro. Sign-out and sign-in back to the Dashboard was confirmed in the running app. Production was not used.

Visible on the candidate:

- Records: Connect Provider, Request Manually, Last Synced Never, 0 connected providers, an imaging notice from Dr. Bodhi McGuire, and Epic Sandbox import cards. The Health Records count of 12 matches this account’s preview `health_records` rows.
- Vitals: “Latest 100 readings” with saved measurements, including heart rate, oxygen saturation, and respiratory rate. This account has 74 preview `vital_measurements` rows, which is every row in that preview table.
- Care: Lab Results 0, Encounters 6, Medications 13, Claims 2, no upcoming appointments, and an Epic Sandbox medication list.
- Insurance: saved-information disclaimer, Aetna Premier Class marked Primary with a masked member ID ending 5678 and group G12345, and UnitedHealthcare marked Member ID needed.
- Medical Profile: Timothy McGuire, date of birth Oct 12, 1967, listed allergies and a coronary-risk condition, organ donor No, then Conditions 15, Medications 13, Allergies 10, and Immunizations 12.

The candidate Medical Forms screen is still the sample catalog: `mockStats` is 4 completed, 14 incomplete, 22%, and 15 recipients, with Patient Registration and Medical ID marked complete. Those counts are not this account’s saved forms. Dashboard Appointments and Medications are literal zeros in the candidate, so they disagree with Care and Medical Profile. The assistant button covers rows on Records, Care, Insurance, Medical Profile, and Vitals.

Still open after the signed-in screen pass: VoiceOver focus order, reduced motion, full touch-target acceptance, a cold relaunch after the Vitals screen patch, physical device, and Android. The cold relaunch and the two accessibility checks are recorded in the follow-up below.

Largest text size was rechecked on the current sign-in screen. The form scrolls. After scrolling, Sign In is fully visible, Forgot password wraps to two lines, and the password placeholder wraps below the visibility icon instead of colliding with it. Content size was restored to large. This is not release acceptance.

The Vault Assistant control now sits at the right of the top bar, with the profile avatar immediately to its left. On the signed-in dashboard, tapping the sparkles button opens Vault Assistant, and the medication card is no longer covered by a floating button. Records, Care, and Vitals were not rechecked after this move.

Cold relaunch on 2026-10-05: terminating and launching `com.healthvault.app` returned to the signed-in dashboard. Timothy McGuire, October 12, 1967, Health Records 12, and the top-bar assistant control were visible. Content size stayed `large`.

VoiceOver is not offered under Vision in this simulator’s Accessibility settings. The visible sections are Display & Text Size, Motion, Spoken Content, Face ID & Attention, Control Nearby Devices, Subtitles & Captioning, Live Speech, Vocal Shortcuts, and Keyboards & Typing. Focus order and speech were not tested.

Reduce Motion was turned on again on 2026-10-06. Opening the menu no longer fades. A 30fps capture of the backdrop goes from full brightness to the final dim overlay in one frame. The toggle was turned back off. The assistant sheet uses the same switch and was not opened in this pass.

Touch targets, same simulator, 2026-10-05: at content size `large`, the menu, profile avatar, and assistant buttons each measure 48 by 48 points. The selected menu row is 49 points tall, and the other menu rows are about 53 points apart. At `accessibility-extra-extra-extra-large` those three buttons stay 48 by 48. The Dashboard menu row grows to about 203 points, Insurance and Records remain reachable by scrolling, and their row centers are about 117 points apart. The close control stays about 48 points. Content size was restored to `large`.

At the largest size on 2026-10-06, the dashboard title and the menu label “Dashboard” each stay one word. “Medical Profile” breaks between words. The menu profile name stays whole, and the email wraps onto a second line with the full address visible. Allergies stack under their label instead of being cut off at the card edge; the value still previews two lines. Health Records and Medical Forms use the full card width. Content size was restored to large.

Hosted recovery, same simulator, 2026-10-05: signed out and requested a reset for the preview Gmail account. The screen showed “If an account exists for this email, you will receive a recovery link.” Gmail received “Reset Your Password” from `noreply@mail.app.supabase.io`, sent by the preview project. The running bundle contains `healthvault://auth/recovery` and does not contain `healthvault27.com`. The delivered link’s redirect is `https://healthvault27.com`, so this phone will not receive the recovery fragment. The link was not opened and the password was not changed. The simulator remains signed out on the reset form.

Preview Auth URL update, same day: project `roeudwddxvniazwufdqf` now has site URL `https://healthvault.me`. Its redirect allow list no longer includes `healthvault27.com`. It keeps `https://chatgpt.com/connector/oauth/**` and includes `https://healthvault.me` and `https://healthvault.me/**`. A second read matched. Checked email settings were unchanged. Production project `sgwekxjlvadvdosyudgj` was not modified.

A new reset was sent on 2026-10-06. Gmail received “Reset Your Password” from `noreply@mail.app.supabase.io`. The message redirect is `https://healthvault.me` and does not use `healthvault27.com`. The link was not opened and the password was not changed.

Physical iPhone, October 6: an iPhone 16e running iOS 18.4.1 is paired with Developer Mode on. This Apple team cannot register `com.healthvault.app`, so the installed Debug app uses `com.timothymcguire.healthvault.deviceqa`. The project bundle id was not changed. After the developer certificate and local-network permission were allowed, the phone loaded the preview Metro server and showed Sign in, with the logo, “AI Medical Assistant,” email, password, Forgot password, and Sign In. The signed-in dashboard then showed Timothy McGuire, October 12, 1967, Health Records 12, “0 connected · Last sync Never,” the assistant at the right of the top bar, and the avatar immediately to its left. The title was truncated to “Dashbo...”. Screen names now render in the page instead. A later capture shows the full “Dashboard” heading and welcome line. The top bar shows the Health Vault mark between the menu and the avatar, with the assistant at the right. The allergy value is still cut at “STRAWBERRY E...” until tapped. The expanded text and VoiceOver were not tested on the phone. Later the same day, after Records was opened, tapping the Health Vault mark returned to the dashboard. That capture shows the full word “Dashboard,” Timothy McGuire, and October 12, 1967. The allergy line ends at “PENICILLIN G, S...”. The first tap did nothing. The limited value is now always pressable, and a later tap on the phone expands it. `adb` is not installed, so Android was not started either.
