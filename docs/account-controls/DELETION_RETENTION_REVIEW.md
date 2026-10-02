# Deletion and retention procedure — draft for operator review

Prepared October 2, 2026 for GO Design, Inc., operator of Health Vault.
Owner: Timothy McGuire. Status: proposed operational procedure, not a published
retention promise or an executable erasure implementation.

## Proposed handling targets

- Review the deletion queue and team@healthvault.me inbox each business day.
- Acknowledge a request within two business days and identify the reviewer.
- Aim to resolve routine requests within 30 calendar days. Track applicable deadlines
  separately; this proposed service target does not determine legal obligations.
- If a request cannot be completed, explain the outstanding scope and next update
  date before the target is missed. Never mark a partially fulfilled request complete.

These targets require Timothy's acceptance and an operational queue reminder or alert.
Neither reminders nor automated deletion are currently installed.

## Data scope and treatment

| Category | Proposed treatment | Evidence still needed |
| --- | --- | --- |
| Personal Vault records, profiles, forms, wellness and insurance | Erase approved account-owned data from active systems after verification and any documented exception review. | Full live schema/foreign-key inventory and synthetic erasure rehearsal. The export allowlist is a starting point, not a complete deletion inventory. |
| Uploaded records, form uploads, request files, generated PDFs and images | Inventory exact bucket/object ownership before removing parent rows; remove owned bytes and metadata, and verify absence. | Inspect all upload paths, derived copies and access URLs. `record-request` uses the `record-request-files` bucket and `record_request_files` metadata. |
| Shares and incoming record requests | Revoke both `shares` and `share_events` access paths and outstanding record-request tokens before erasure; prevent late uploads/replays. | Exercise each token endpoint, including previously issued download URLs. |
| Provider access, connections and consent | Revoke access and stop sync; separate user-owned copies from provider-managed records. Retain only specifically justified evidence with a defined expiry and access restriction. | Review `provider_access_grants`, consent receipts, integration credentials and provider-managed ownership. No indefinite blanket retention approved. |
| Draft proposals and confirmation receipts | Invalidate pending confirmations and inspect stored proposal payloads for account data; erase or minimize according to approved scope. | Include form proposals, share confirmation receipts and all other mutation proposals absent from the personal export. |
| Authentication and sessions | Disable access and revoke supported sessions/grants before final Auth removal; verify old sessions cannot read or write during token lifetime. | Test actual JWT, OAuth, refresh-token and queued-job behavior. Auth deletion alone is insufficient proof. |
| Deletion receipt, security and operational logs | Keep only justified minimum evidence of handling, with restricted access and an approved expiry. Avoid health details in the case record. | Specify retention duration and purge mechanism; current request rows can remain with null user_id after Auth deletion. |
| Backups | Remove from active systems first; disclose verified backup handling and prevent deleted data from being reactivated by a restore. | Confirm vendor retention and rehearse deletion reapplication before reopening a restored system. Eight observed restore points do not establish an eight-day guarantee. |
| Support email and recipient copies | Review support messages in Resend/Gmail separately. Explain that previously delivered third-party copies cannot be recalled by revoking a link. | Agree mailbox/log retention and disposal; identify what is under the operator's control. |

No category above has a verified automatic purge schedule. Do not publish numerical
retention periods until the implementation and vendor behavior support them.

## Per-request execution checklist

1. Open a restricted case containing request ID, reviewer, verification method,
   received date, target date and next update date. Do not store passwords or copies
   of medical records in the case. Use the authenticated request and established
   account contact to verify identity without collecting unnecessary identity data.
2. Confirm the requested scope, explain export options and disclose any specific
   retained category, reason and planned expiry. Record disputed or unresolved scope.
3. Produce a read-only inventory of owned rows, indirect relationships, storage
   objects and external copies. Record counts/object identifiers securely. Review
   a dry run that demonstrates another account will remain untouched.
4. Use a tested account-level access/write block and revoke shares, sessions, grants,
   tokens and pending confirmations. Stop imports and queued work that could recreate
   data. This block still needs implementation/validation; it is not provided by the
   request queue.
5. Execute only the reviewed account-specific erasure plan, with foreign-key order
   and object cleanup established in the isolated rehearsal. Do not use a generic
   cascade or run destructive SQL against a real account as a test.
6. Verify active rows and owned objects are absent, old URLs/tokens fail, late jobs
   cannot recreate data and the other synthetic account is unchanged. Record failed
   steps and retry safely; distinguish missing objects from storage/API failures.
7. Record backup exceptions and restoration safeguards. Mark completed only after
   the agreed scope is fulfilled and verified; send an accurate outcome through the
   agreed contact channel. A future deleted account may no longer access its receipt.

## Required rehearsal and release evidence

Use two authorized disposable synthetic identities in an isolated environment.
Create a record, uploaded file, completed form, active share, pending proposal and
provider-access fixture for each. Delete only one account through the reviewed
procedure. Prove isolation, revoked access, object cleanup, safe retries after a
partial failure and prevention of data reappearing after recovery. Capture counts
and pass/fail evidence without real patient data or secrets.

Dependencies: OPERATIONS.md, RECOVERY_REVIEW.md, account-export/export.ts,
record-request/index.ts, share/index.ts and the live schema. Repository inspection
identified the categories above; it is not a completed live-schema audit.

## Decisions required before implementation is treated as ready

- Operator accepts review cadence and response targets.
- Approve retention durations and exceptions for minimal receipts, consent evidence,
  logs and support email after confirming obligations and vendor capabilities.
- Select and verify an isolated test destination; implement and test the access block,
  erasure plan, queue monitoring and restore safeguards.
- Review final public wording against measured behavior before publication.
