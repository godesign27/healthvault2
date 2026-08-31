# Proposals and confirmations

Read this file before any write, correction, or removal.

## Proposal

Use the matching proposal capability. Present:

- the action being proposed;
- important extracted fields;
- uncertainty or assumptions;
- source type and confirmation state;
- what will change, including before/after meaning for corrections;
- the fact that nothing has been saved yet.

Ask one minimum clarifying question when the target or meaning is ambiguous. Do not create several competing proposals when one clarification will resolve the target.

In the member-facing preview, lead with the corrected or proposed information. State once that it has not been saved, then end with the exact confirmation or correction the member can provide next.

## Confirmation

Confirmation must be explicit and refer to the current server-issued `proposal_id`. A changed medication, dosage, allergy, target, date, or other material field requires a new proposal. Silence, an unrelated “okay,” or continuing the conversation is not confirmation.

Call the matching confirmation capability once. Do not automatically retry after a timeout or ambiguous result. Retrieve proposal status or explain that the outcome is unknown.

## Decline, cancellation, and expiry

If the member declines, cancels, changes the subject, or lets the proposal expire, leave persisted data unchanged. Say so plainly. Never phrase a proposal as saved or a failed mutation as successful.

