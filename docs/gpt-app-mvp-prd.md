# Health Vault GPT App MVP PRD

## Goal

Let an authenticated Health Vault member safely review and maintain a concise personal health overview from ChatGPT without exposing another member's data or performing a write without informed confirmation.

## MVP experience

1. Connect Health Vault through OAuth.
2. New members complete account, email, identity, insurance, and assistant-preference onboarding.
3. Returning members see a private dashboard with a direct link to `/dashboard` on the Health Vault site.
4. The assistant can read conditions, medications, allergies, records, appointments, and onboarding status.
5. The assistant previews every proposed write, asks for explicit confirmation, saves only after confirmation, and returns a refreshed dashboard highlighting the change.
6. Duplicate condition, medication, allergy, and record entries are blocked at creation and collapsed in dashboard summaries.
7. A member can preview and create a revocable, expiring share containing only explicitly selected health-data categories.

## Confirmation-gated writes

- Add an appointment.
- Cancel a scheduled appointment.
- Add a condition.
- Add a medication.
- Add an allergy.
- Add structured health-record information.

Each flow must follow `preview → explicit confirmation → write → refreshed dashboard`. A first request, ambiguous approval, or inferred consent is insufficient.

## Secure sharing

The member chooses:

- named recipient and optional organization;
- exact categories: conditions, medications, allergies, records, appointments, and/or Medical ID;
- expiration between 1 and 30 days;
- optional note.

Before creation, ChatGPT must show the recipient, categories, and expiration and request explicit confirmation. The resulting link:

- always includes the patient's display name so the recipient can identify the share;
- contains a snapshot captured at consent time;
- exposes no unselected categories;
- expires automatically;
- can be revoked;
- records creation and opening events;
- is returned to the member but is not sent automatically.

## Privacy and security requirements

- All application reads and writes use the authenticated user's token and database row-level security.
- Medical ID remains concealed by default in the dashboard.
- Share-event rows are visible and mutable only by their owner.
- Public share access requires the exact unguessable token and returns `Cache-Control: no-store`.
- Secret or service-role credentials never enter browser bundles, tool output, logs, or ChatGPT context.
- Tool errors must not echo tokens, credentials, or full sensitive payloads.

## Acceptance tests

- A new user can connect, onboard, and reach an empty-state dashboard.
- `/dashboard?source=chatgpt` opens the signed-in dashboard or login and then returns to it.
- Every write tool refuses to save before confirmation.
- A confirmed write appears immediately in the returned dashboard.
- Repeating the same write produces a duplicate warning and no new row.
- A share exposes only selected categories and stops working after revocation or expiration.
- User A cannot read, modify, or revoke User B's share events.

## Next after MVP

- Edit existing conditions, medications, allergies, records, and appointments.
- Upload and attach source documents to structured records.
- Recipient email delivery after a second, explicit send confirmation.
- Fine-grained item selection within a category.
- Patient-visible share history and access audit export.
- Provider acknowledgement and FHIR delivery receipts.
