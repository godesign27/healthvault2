# Support email forwarding

Owner-approved route: team@healthvault.me → godesigngo@gmail.com.
Operator: GO Design, Inc., an Illinois corporation.
Business mailing address: 26027 W. Brandt Rd, Barrington, IL 60010, USA (owner confirmed).

## Current status

Configured October 2, 2026. Endpoint, ledger, enabled Resend webhook and signing secret are installed. Live signed-event acceptance (200 ignored) and unsigned rejection (401) verified. End-to-end plain-text delivery verified with owner-approved test HV-20261002-01: received in godesigngo@gmail.com Inbox (Updates) at 2026-10-02 19:47:42 UTC. SPF, DKIM and DMARC passed; original sender preserved in Reply-To. Receiving API access and outbound send both succeeded. Attachments and Gmail send-as were not tested/configured.

## Activation

- Resend email.received subscription: https://sgwekxjlvadvdosyudgj.supabase.co/functions/v1/support-email-forward
- Owner approved the account-wide received-event metadata subscription. Only exact team@healthvault.me recipients are fetched/forwarded.
- Enabled webhook: https://resend.com/webhooks/67c7a649-992d-4606-8572-461fccf0496c
- Store generated signing secret as RESEND_SUPPORT_WEBHOOK_SECRET in Supabase secrets, never source or logs.
- Existing RESEND_API_KEY must permit receiving-email reads and outbound sends. Verify rather than assume.
- Send a non-sensitive test to team@healthvault.me and verify Gmail delivery, attachment handling and Reply-To. Gmail replies use the Gmail sender unless a separate send-as setup is configured.

## Behavior

Signature verification covers raw body and timestamp. POST only; 256 KiB event limit.
Fetched MIME message limit is 20 MiB. Original Reply-To (or original From), content and attachments are retained. Outbound sender is Health Vault Support <team@healthvault.me>.
Domain-level Resend tracking settings still apply.

Receipt table contains only inbound/outbound IDs and timestamps, with no anon/authenticated access. No email bodies or attachments are stored in the Vault database.
Retries use a stable Resend idempotency key. Completed messages cannot forward again. Unresolved attempts older than 23 hours stop for manual review to avoid duplicating a send after the provider's 24-hour idempotency window.

## Operations

Monitor failed webhook attempts in Resend. A 503 requests retry; not_configured means a required secret is absent. Oversized MIME messages and old ambiguous deliveries require manual handling in Resend. No failure-alert automation has been installed.

Before retrying an old unresolved receipt, reconcile outbound delivery in Resend and record the verified outbound ID/timestamp. Do not delete receipts to force a resend.
Disable the Resend webhook to pause new forwarding. Existing mail remains subject to Resend/Gmail retention; no historical backfill is performed automatically.

## Acceptance evidence

- Inbound Resend ID: 35fe775a-884e-4cc2-8911-3f15f8a801db
- Outbound Resend ID: 01a0fe28-788d-7768-9c4e-d13bc496c7de
- Gmail received ID: 1a0fe28808dcc0a6 (INBOX, CATEGORY_UPDATES).
- Test used no health information. Successful receipt recorded; no historical mail backfill.

## Gmail send-as preparation — October 2, 2026

Owner requested sending as team@healthvault.me. Gmail godesigngo@gmail.com still offers Add another email address. Prepared sender Health Vault <team@healthvault.me>, alias enabled, SMTP smtp.resend.com, username resend, port 587 with TLS. No password entered or alias submitted.

Prepared Resend API-key form: health-vault-gmail-smtp, Sending access, healthvault.me only. Key not created. User handoff is required to create the credential, copy it into Gmail's SMTP password field, and submit Add Account. Verification and outbound test remain pending. Do not reuse the backend full-access key in Gmail.

Google's current notice says third-party Send as ends January 2027 and new configuration will be restricted before then. This route is temporary; a durable mailbox choice remains needed. Source: https://support.google.com/mail/answer/17101213 . SMTP source: https://resend.com/docs/send-with-smtp .

Update: user completed SMTP credential entry. Gmail confirms credentials accepted; its send-as confirmation email reached godesigngo@gmail.com Inbox through the forwarding route. Final email-link authorization remains pending with user; outbound send-as not yet verified.

Update: user completed confirmation. Gmail Accounts and Import now lists Health Vault <team@healthvault.me> with smtp.resend.com, port 587/TLS, and normal make-default/edit/delete controls (no pending verification). Original Gmail address remains default; reply-from-same-address is selected. Because forwarded messages are addressed to godesigngo@gmail.com, select team@healthvault.me explicitly in the From menu when replying to support mail. A separate outbound SMTP send test has not been performed.

## Outbound SMTP acceptance — October 2, 2026

Owner authorized continuing with outbound verification. Plain-text test HV-SMTP-20261002-01 sent via Gmail using the verified Health Vault alias. The received SMTP copy (Gmail ID 1a0fe3857130a877) arrived in INBOX/CATEGORY_PERSONAL at 20:05 UTC from Resend's Amazon SES transport over TLS 1.3. From: Health Vault <team@healthvault.me>; Reply-To: team@healthvault.me. SPF, aligned DKIM and DMARC all passed. No health data used. Gmail also retains its API-submission sent copy; only one send command was issued.

Both inbound forwarding and outbound SMTP now have successful delivery evidence. Inbox placement for these tests does not guarantee placement for every future recipient/message.
