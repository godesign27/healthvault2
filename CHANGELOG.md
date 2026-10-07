# Changelog

## Unreleased — 2026-10-05

### Added

- Isolated iOS release evidence covering dependency installation, CocoaPods deployment-mode validation, unsigned simulator compilation, and JavaScript/Hermes export.
- Metro regression coverage for both buffer-based and file-based image assets.

### Fixed

- Added the shared design-token package to the mobile Metro watch folders so the native theme resolves during bundling.
- Updated the Metro `image-size` compatibility adapter to accept both byte buffers and file paths used by Metro's asset pipeline.

### Verified

- iOS export completed with 999 modules, 21 assets, and a 3.6 MB Hermes bundle.
- Native Debug simulator build completed successfully with the diagnostic iOS 15 deployment-target override.
- Focused regression tests and patch idempotence checks pass.
- The isolated Debug app launches on the iOS 18.6 QA simulator and loads the preview Metro bundle through the sign-in screen.
- Sign-in with an empty password shows “Please enter your email and password.” The default-size Sign In control measures about 51 by 305 points.
- On the preview Gmail account, Dashboard, Records, Care, Insurance, Medical Profile, and Vitals loaded saved preview data. Records showed 12 imported records and Vitals showed saved measurements. Care showed 13 medications; Medical Profile showed Timothy McGuire with conditions, medications, allergies, and immunizations. Insurance showed a saved Aetna plan and a UnitedHealthcare plan missing a member ID.
- The dashboard Medical ID card now reads the signed-in profile. On the simulator it shows Timothy McGuire, October 12, 1967, and the same short allergy summary as Medical Profile.
- At the largest text size, the current sign-in screen scrolls and Sign In is fully visible. The password placeholder wraps below the visibility icon. Text size was restored to large.
- On the signed-in dashboard, the Vault Assistant control is the rightmost top-bar button and the profile avatar sits immediately to its left. Tapping it opens Vault Assistant. The floating button no longer covers the medication card.
- A cold relaunch of the signed-in Debug app returned to the same dashboard, including Timothy McGuire, October 12, 1967, Health Records 12, and the top-bar assistant control.
- At normal text, the menu, profile avatar, and assistant buttons each measure 48 by 48 points. The selected menu row is 49 points tall, and other menu rows are about 53 points apart. At the largest text size those three buttons stay 48 by 48, menu rows grow, and the menu still scrolls. Text size was restored to large.
- Preview Auth for `roeudwddxvniazwufdqf` now uses site URL `https://healthvault.me`. The redirect allow list no longer includes `healthvault27.com`; it keeps the ChatGPT connector entry and includes `https://healthvault.me` and `https://healthvault.me/**`. A follow-up read matched that change, and the email settings that were checked stayed the same.
- VoiceOver on the signed-in simulator dashboard. The cursor landed on the menu, the Health Vault mark, the profile avatar, the assistant, the Dashboard heading, and the welcome sentence, which was heard. A pass through the page ended on “Open Records,” and VoiceOver played the end-of-screen boundary sound. That dashboard pass stands for the shared shell. Records, Care, Insurance, Medical, the menu, and the assistant were not walked separately.
- VoiceOver menu focus on the signed-in simulator. Opening the menu moves the cursor from the menu button onto Close menu. Closing the menu puts the cursor back on the menu button.
- VoiceOver assistant focus on the signed-in simulator. Opening Vault Assistant puts the cursor on Close assistant. Closing the sheet puts the cursor back on the assistant button.
- Reduced motion on the signed-in simulator. With Reduce Motion on, opening the menu cuts straight to the drawer. A 30fps capture shows the backdrop go from full brightness to the final dim overlay in one frame. Opening Vault Assistant also cuts straight to the sheet: the next frame shows “Vault Assistant” and “Context: Dashboard,” with no sliding frame between. The setting was turned back off.
- Large text on the signed-in simulator. Rows that used to share one line now stack. The dashboard title and the menu label “Dashboard” each stay one word. “Medical Profile” breaks between words. The menu profile name stays whole, and the email wraps onto a second line with the full address visible. Allergies sit under their label; the value still previews two lines. Health Records and Medical Forms use the full card width. Text size was restored to large.
- A new preview password reset was sent to the preview Gmail account. The message is from `noreply@mail.app.supabase.io` and its redirect is `https://healthvault.me`. It does not use `healthvault27.com`. The link was not opened and the password was not changed.
- Physical iPhone logo. After Records was opened, tapping the Health Vault mark returned to the dashboard. The screen shows the full word “Dashboard,” Timothy McGuire, and October 12, 1967. The allergy line still ends at “PENICILLIN G, S...”. The first tap did nothing because the line only became pressable after a truncation check that never succeeded. It is now pressable whenever the value is limited, and a later tap on the phone expands it.
- Android device validation. The Android 14 emulator is signed in. The dashboard shows Timothy McGuire, October 12, 1967, Health Records 12, and “0 connected · Last sync Never.” Opening Records and tapping the Health Vault mark returns to the dashboard. Tapping the allergy line expands the full list, ending in “Penicillin, Penicillin.”
- Android Accessibility Suite is installed from the Play Store. With TalkBack on, the menu was read as “Open menu, Button.” Focusing the allergy line spoke “collapsed,” the full allergy list through “Penicillin, Penicillin,” “Button,” and “Shows the full text.” The on-screen value stayed collapsed at “SHELLFISH-DERIVE...”.
- Physical iPhone VoiceOver. VoiceOver was on and the cursor was on the menu button. The user heard the announcements and confirmed they work. The spoken words were not captured on screen.
- Web password recovery. A local `type=recovery` address shows Set new password instead of the vault. A short password shows “Use at least 12 characters.” Mismatched passwords show “The passwords do not match.” Opening the plain home page shows the marketing site. The live recovery email was not opened and the password was not changed.
- Sign In includes Forgot password. It asks for an email and sends the recovery link to https://healthvault.me.

### Remaining

- The hosted site does not have this recovery screen yet. The live recovery email was not opened and the password was not changed.
