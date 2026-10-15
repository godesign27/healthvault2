# Native upload acceptance

Use the disposable preview project `roeudwddxvniazwufdqf`; never use a real patient
account for acceptance uploads. SDK 51 requires a rebuilt development client;
Expo Go is unsupported.

## Build verification

From the repository root, install declared packages with `npm install --ignore-scripts`
and run `node scripts/patch-react-native-css-interop.cjs`. From `apps/mobile/ios`,
run `pod install`. The crypto module must be present in the resulting Podfile.lock.

From `apps/mobile`, export the iOS bundle using preview environment variables:
`CI=1 EXPO_NO_DOTENV=1 npx expo export --platform ios --output-dir /tmp/hv-mobile-export`.
A placeholder anon key suffices for compilation only, never live acceptance.

The installed Xcode 27 toolchain rejects an iOS 13.4 target. On October 6 the
project minimum was set to 15.0, and a simulator build passed without a
command-line override.

## Device gates (must record actual results)

1. Sign into a disposable preview account and open Health Records.
2. Choose a synthetic document using the native Files picker. Cancel once and confirm
   nothing is saved. Pick again and verify filename/category before pressing Save.
3. Save and verify the success message and actual server record ID/count.
4. Terminate/relaunch the app. Reselect the same bytes/name/category, Save and verify
   the same record ID and count. Cache URI changes must not change retry identity.
5. Interrupt connectivity after submission; restore it and retry unchanged input.
   Verify there is one record and one committed receipt, not a duplicate.
6. Reject zero-byte/over-25-MiB files before transmission. Sign-out/account change
   between selection and submission must not upload to the former account.
7. Verify the protected file bytes with the owner and denial for a second account.
8. Remove only acceptance fixtures and temporary credentials; retain sanitized evidence.

Passing a Node adapter test or Metro export alone does not satisfy these device gates.

## October 3, 2026 observed results

- npm dependencies installed; CocoaPods installed 83 pods including ExpoCrypto 13.0.2.
- Actual Metro/Hermes iOS export passed. Native Debug simulator build passed with
  the iOS 15 command-line override; installed on iPhone 16 Pro / iOS 18.6.
- A temporary native harness exercised the real Expo FileSystem, Expo Crypto,
  uploadPickedRecord and shared client against a disposable preview account. It
  wrote/read a synthetic document, uploaded twice, and checked the server count/ID.
  One row remained. After terminating/relaunching the app, the test again returned
  the same record ID and count=1. Native runtime UI displayed PASS on both runs.
- Evidence: /tmp/hv-native-upload-pass.png. Build log: /tmp/hv-mobile-xcode.log.
- Normal index.js restored byte-for-byte; harness and credentials removed, preview
  account/record/object/receipts cleaned, Metro stopped and test simulator shut down.
- This harness bypassed the Files picker UI. Picker/cancellation, interrupted network
  UI handling and protected native document viewing are NOT certified by this run.
- Xcode 27 requires an iOS target of at least 15.0. The project minimum is now 15.0.


## 2026-10-02 (Denver) — Actual iOS document picker acceptance

Used the iPhone 16 Pro / iOS 18.6 development client with the actual UploadRecordForm
and ProviderConnectionForm in a temporary isolated screen. No valid account or API key
was supplied. Observed: Files picker opens; Cancel returns with Save disabled and Choose
file usable; a 45-byte synthetic text file saved locally through the iOS share sheet can
be selected through Files; its filename appears, categories become available, selecting
Lab results updates the checked category, and Save displays Working/Saving with controls
disabled. Authentication refusal then shows an error and restores enabled controls
while retaining the file and category. Empty provider search displays the expected
2–100-character validation. No provider authorization was attempted.

This verifies picker wiring, selection and failure recovery, not an authenticated
upload receipt or interruption after server commit. Those combined native acceptance
cases remain open, as does live provider OAuth. The earlier transport tests remain
separate evidence and must not be conflated with this UI run.

Restored normal index.js byte-for-byte, stopped Metro, shut down simulator and removed
all three files named hv-picker-synthetic.txt from this test simulator's containers
(source cache, Files copy and picker cache). No production changes or emails.


## 2026-10-02 (Denver) — Authenticated native picker upload recovery

In the iPhone 16 Pro / iOS 18.6 development client, exercised the real UploadRecordForm,
Expo Files picker, file IO/hash and upload transport against one disposable preview
account. A temporary wrapper waited for session initialization and injected one lost
HTTP reply after reading the server response. Selected a synthetic text file through
Files, chose Lab results, and observed disabled controls with Saving/Working. After
the injected loss, the UI correctly reported an unknown outcome and retained selection.
Independent server read found one lab record. Pressing Save again showed Saved, cleared
the selection and displayed server count 1; an independent read confirmed the exact
same record ID. No duplicate was created.

Changed upload feedback to replace internal batch/key terminology with same-file/category
retry guidance. Also separated list-refresh failure from upload failure: a confirmed
save remains reported as saved if its onSaved callback fails. These follow-up edits
have build verification; the observed native interaction preceded the copy change.

Restored normal entry byte-for-byte before the component edit, stopped Metro, removed
temporary credentials/wrapper/session and local synthetic files, and shut down the
simulator. Fixture cleanup deleted storage, record, attempts, batches and Auth user;
independent inventory returned zero fixture users/records. No production changes,
provider authorization or emails. This is an injected lost-response test, not an
OS-wide network interruption or app-kill test.

Remaining: live provider authorization/return and native import review; upload recovery
through an app restart with real picker reselection still has only separate harness
coverage from the earlier native transport test.
