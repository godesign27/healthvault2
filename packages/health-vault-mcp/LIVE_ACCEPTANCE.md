# Remaining live acceptance

Status: pending user-supplied test setup. Baseline: MCP version 127, 73 passing
isolated tests. Database isolation tests used synthetic JWT identities and rolled
back; they do not establish browser OAuth isolation or email inbox delivery.

## Setup

- Identify the approved recipient email, completed form, expiration, and whether a
  patient receipt is wanted. Review the exact share card before confirming it.
- Prefer an existing synthetic test form/account. Creating synthetic health records
  in a personal account is not part of this test without explicit authorization.
- Use separate browser profiles for account A and account B; the user handles sign-in.
  Keep private form content, passwords, OAuth codes, and bearer links out of reports.
- Verify CSP enforcement remains enabled and request fresh cards; do not reconfirm
  historical cards created before durable share receipts were deployed.

## Share confirmation

1. Request a preview for the approved form and recipient. Confirm the rendered form
   title, recipient, scope, expiry, and receipt option match the intended disclosure.
2. Click Confirm & Email once. Verify visible pending state and then a terminal
   success or error message. Incidental host updates must not reset the card.
3. Check the corresponding share record and delivery audit read-only. Record one
   share ID and provider acceptance status; do not include the token in the report.
4. Ask the recipient to confirm inbox receipt and correct form access. Provider
   acceptance alone does not pass inbox-delivery acceptance.
5. Check the patient receipt, if requested, accurately describes delivery status.
   An ambiguous outcome must not prompt another click or automatic resend.
6. Revoke the specific test share only as part of approved cleanup and verify the
   recipient link no longer reveals the form. Expiry/token rejection already have
   isolated tests; live verification must use only the approved test share.

## Two-account OAuth isolation

1. Connect account A to its ChatGPT session and confirm the dashboard identifies A.
2. Connect B in a separate browser profile and confirm the dashboard identifies B.
3. With synthetic fixtures owned by A, attempt owner-only reads and mutations from
   B using the normal authenticated app/tools. Expect denial or no accessible row;
   verify A's fixtures are unchanged. Include form response, proposal, share history,
   and revocation access. Never substitute an admin/service credential.
4. Inspect pending confirmation cards across disconnect/reconnect: an A-specific
   proposal must not be usable while connected as B. Use only authorized fixtures.
5. A recipient bearer link is an intentional disclosure mechanism, not an owner API;
   distinguish its scoped access from the owner-only checks above.

## Evidence and exit criteria

Record app version, browser, CSP setting, scenario, expected/actual result, and
sanitized share/proposal identifiers. Mark unrun steps pending. No broad-release
sign-off until the remaining browser checks pass; other health-write concurrency
and full production/source reconciliation remain separate tracked work.
