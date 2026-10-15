# Import clients — preview contract

October 2, 2026 (October 3 UTC). Backend preview inbound-records v18 only.
Candidate `20261003021633_personal_upload_source.sql` preserves personal-upload
provenance. Shared client code is local; no production deployment or commit.

## Signed-in app uploads

HealthVaultClient.uploadRecord now sends JSON to POST /inbound-records/upload with
the current user JWT. It never requires a personal integration API key. The server
verifies the session and active account, derives the default patient from that
identity, and denies foreign patient selectors. It uses the same durable batch and
slot reservations as root imports, with a distinct personal-upload fingerprint.
Records are marked source=uploaded. Returned UploadedFile has previewUrl=null,
fileAccess=authenticated and importBatchId; retrieve bytes through record-file.

The caller must supply idempotencyKey and retain it with the unchanged logical
upload until its outcome is known. Generate/persist it before the first request,
not in a retry callback. A different payload requires a new key; uncertain outcomes
must reuse the existing key. The client validates nonempty/25 MiB file limits and
40 MiB serialized JSON limits before sending. Base64 conversion uses bounded chunks.

## Integration imports

HealthVaultImportClient is for trusted integration/server processes. Its getApiKey
callback supplies the personal integration credential at request time. Do not
bundle that credential into web/mobile code. importRecords(body, retryKey) calls
the JSON root endpoint and returns structured receipts even for 207/422 partial
results. Callers must inspect success, records and recordErrors.

Both clients preserve retry keys on transport/gateway failures using
ImportRequestError (outcome=unknown). Known rejections use outcome=rejected. Missing
or malformed receipts are never accepted as success. There is no automatic retry
or automatic replacement key. On-token-expired handlers do not replay writes with
new keys; callers may refresh their JWT and resubmit with the original key.

## Evidence

scripts/test-import-client.mjs tests actual bundled client code with controlled
transport responses: JSON route/JWT selection, stable payload/key after a lost
response, partial and malformed receipts, gateway uncertainty, conflict, and
missing-key/sign-in rejection before fetch. Targeted package TypeScript check and
bundle succeed. Runtime tests use Node's Blob/btoa/fetch implementations; native
React Native file-picker/Blob behavior still needs platform acceptance.

scripts/test-upload-client-preview.mjs uses both real client classes against
preview with disposable A/B accounts: actual bytes and protected download,
stable retry IDs, correct uploaded/connected provenance, anonymous/forged/API-key
substitution/foreign-owner denial, structured failures, block enforcement and B
isolation. Five live groups pass and all fixtures are removed.

To run, bundle packages/api-client/src/index.ts with esbuild to
/tmp/hv-client/client.mjs, then run the scripts. The live runner requires a mode-600
HV_PREVIEW_KEYS_FILE belonging to the preview project and cleans its own fixtures.

## Remaining application work

Repository search found no active call sites of the shared client's uploadRecord;
changing it does not wire existing upload screens. The older
src/lib/records/query.ts uploadRecord currently manufactures an in-memory
rec-upload-* result with a timer, and src/lib/ai/health-assistant.ts invokes it.
Replace this path with a real file selection and server receipt before claiming
web upload readiness. No actual file can be uploaded from a filename alone.

Verify existing web/mobile screens, persist retry state appropriately, and test
native file handling. Update clients and database dependencies before production
rollout. Receipt retention, historical imports and legacy file-link migration are
still separate release gates.


## Web file picker acceptance

The local Health Records screen now offers Upload File and saves actual File bytes
through the shared client. Filename-only assistant requests direct the user to this
picker rather than fabricating local records. Lists and detail reads use server rows.
The UI reports success only after reading the saved record back from the server.

Before sending, the web helper persists an opaque UUID in localStorage, indexed by
a SHA-256 digest of owner, file-content hash, filename, category and optional metadata.
It stores no file bytes or filenames. Identical input recovers the same operation
across reloads; changing metadata creates another operation. Clearing browser storage
loses this retry identity; cross-device deduplication is not promised. Storage failure
stops the upload before network transmission.

October 3 UTC acceptance used the actual UploadRecordForm and query helper in the
local harness against a disposable preview account: save produced one server row,
reload retained that ID, and selecting/saving the same file again retained exactly
one row with the same ID. Three retry-key tests, client transport tests, targeted
package typecheck and web build passed. The harness supplies synthetic File bytes;
native OS file-chooser and mobile Blob handling are not covered by this check.
Preview fixtures were cleaned. These frontend changes are not deployed to production.


## Native upload adapter (local, awaiting device acceptance)

RecordsScreen now renders a document picker, category controls, explicit Save file
button and result feedback. Expo DocumentPicker uses copyToCacheDirectory=true;
Expo FileSystem checks existence/nonempty/25 MiB size before reading base64. The
shared uploadRecordBase64 method validates encoded payload bounds and uses the same
JWT route and receipt validation as browser uploads. It does not depend on native
Blob.arrayBuffer or browser crypto globals.

Native retry keys are SHA-256 of version, owner, content hash, name and category.
This recovers the same operation after restart or picker URI changes without storing
file contents in AsyncStorage. Different categories/names intentionally create new
operations. Native and web retry identities are separate; cross-client deduplication
is not promised. The current session owner is checked again before transmission.

Dependencies added: SDK 51 expo-file-system ~17.0.1 and expo-crypto ~13.0.2. Rebuild
the native development client after dependency installation (Expo Go is unsupported).
See Expo's documented cache-copy requirement:
https://docs.expo.dev/versions/latest/sdk/document-picker/

Verified locally: native adapter with real shared transport and stubbed native IO/HTTP,
reselection/lost-response key stability, owner/category separation, empty/missing/
large/directory preflight, absent session and invalid base64 rejection. Shared client
regression tests, package typecheck, RecordsScreen syntax bundle and web build pass.
The syntax bundle externalizes native dependencies and is not a Metro/native build.
No booted simulator was available; native dependencies are absent in this checkout.
Real picker, restart, native hashing, preview server persistence and protected file
opening still require device acceptance before production release.


Follow-up: native dependencies and pods are now installed. A real iOS simulator
Debug build (test-only iOS 15 target override) and native file IO/hash/upload/retry/
restart acceptance passed against preview. See MOBILE_UPLOAD_ACCEPTANCE.md for
scope and outstanding Files picker/UI gates. No production deployment.
