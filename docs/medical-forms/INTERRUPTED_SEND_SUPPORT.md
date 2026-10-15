# Interrupted Medical form sends

This is an operator triage procedure, not an automatic retry or resolution tool.
It applies to native requests using `medical_share_requests`. Legacy marker-only
requests cannot be reconciled by the status endpoint.

## Patient-facing response

Ask the patient to use **Check interrupted send**. This checks status without sending
another email. If still pending, explain that the outcome is unconfirmed and support
must investigate. Do not say the email failed or ask them to reinstall/clear storage.
Do not collect medical-form answers or a bearer share URL in a support ticket.

## Read-only investigation

1. Authenticate the support request and establish the account owner through the approved
   support channel. A supplied email address alone is not proof of account ownership.
2. Ask for the **Support reference** shown after an interrupted send or in Medical forms
   → Share history. The native implementation is local and awaits release/device acceptance.
   The patient can select and copy this request UUID. It is not proof of account ownership
   and grants no access. Older marker-only requests cannot display a reference.
3. Read the claim by **both owner_id and request_id**. Inspect creation time and whether
   a receipt exists. This private table is service-only; never grant client access.
4. If a valid receipt exists, have the patient run Check interrupted send again. Acceptance
   means the provider accepted the message, not that it reached an inbox.
5. For the correlation-enabled handler, inspect `share_event_id` on the claim and verify
   the event belongs to the same owner. The ID is reserved before uploads, so the event may
   not exist after an early failure. `email_attempt_started_at` means dispatch was about to
   start, not that the provider accepted it. `provider_accepted_at` records observed HTTP
   acceptance; optional `provider_message_id` identifies the recipient email in Resend.
   Neither proves inbox delivery. An absent message ID does not prove rejection.
   These fields are deployed in preview v52 with migration `20261003210000_medical_share_correlation.sql`;
   production and older/legacy claims do not have this evidence. Never infer a relationship
   from timestamps alone or manufacture a recovery receipt.
6. If the patient wants access stopped and the specific share can be identified, use the
   normal authorized revocation flow. Verify the persisted revoked record. Revocation does
   not determine whether an email was sent or automatically resolve the pending claim.

## Do not do these things

- Delete/expire the claim or clear the local marker solely because it is old.
- Retry with a new request UUID while the first outcome is unknown.
- Treat absent logs, absent events or a network timeout as proof of non-delivery.
- Mark delivery accepted without provider evidence or manually copy private links into tickets.
- Claim full recovery tooling is complete: unresolved cases currently remain blocked.

## Required before automated support resolution

Deploy the correlation migration before its handler. Preview v52 has both. Local isolated-adapter tests
cover pre-upload correlation, pre-dispatch evidence, acceptance followed by receipt failure,
and missing/failed tracking writes. Live seeded replay/privacy and owner-deletion cascade acceptance passed. First-send
correlation still requires live acceptance with an isolated email sink.

Then add an authorized operator action with an audit trail and release/verify the native
patient-visible diagnostic reference. Only then design a bounded resolution path; preserve current
no-resend behavior meanwhile. Provider evidence is private and the status endpoint returns
only the existing minimal receipt. The claim and correlation are deleted by the existing
owner-deletion cascade. No new recipient, form answers, or bearer links are stored.

Provider ID contract: [Resend Send Email response](https://resend.com/docs/api-reference/emails/send-email).
A lost or malformed response body must not turn observed HTTP acceptance into rejection.
