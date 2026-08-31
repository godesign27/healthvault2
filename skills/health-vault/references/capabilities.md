# Capability routing

Read this file before invoking any Health Vault capability. Capability results are the source of truth. Names below are the target canonical contracts; production integration is currently deferred.

## Read capabilities

- `get_health_snapshot`: concise confirmed snapshot with provenance and missing-data indicators.
- `get_profile_memory`: member-approved profile memory and confirmation state.
- `create_appointment_prep`: informational brief from authorized confirmed information; it does not diagnose or save clinical conclusions.
- `get_nourished_rebel_state`: enrollment, resumable check-in progress, and the latest authoritative stored insight.

## Preview and confirm capabilities

- `propose_health_fact` → `confirm_health_fact`
- `propose_medication` → `confirm_medication`
- `propose_allergy` → `confirm_allergy`
- `propose_correction` → `confirm_correction`
- `propose_removal` → `confirm_removal`
- `propose_life_signal` → `confirm_life_signal`

Every proposal returns a tamper-resistant `proposal_id`, important extracted fields, uncertainty, provenance, expiry, and proposed action. Never substitute conversational content for a proposal identifier.

## Nourished Rebel capabilities

- `get_nourished_rebel_state`: retrieve the same persisted state used by GPT and cloud.
- `enroll_nourished_rebel`: requires explicit opt-in and the approved consent version.
- `save_nourished_rebel_answer`: saves one answer or skip and returns authoritative progress.
- `generate_nourished_rebel_insight`: returns the persisted insight; generation remains server-controlled and idempotent.
- `submit_nourished_rebel_feedback`: requires explicit feedback intent.
- `get_nourished_rebel_partner_link`: returns only the approved public URL and non-PHI attribution metadata.

Never generate a separate wellness assessment in Claude. Never append member information to the partner URL.

## Availability states

Treat every capability as one of:

- `available`: approved transport and runtime are connected.
- `mock_only`: synthetic evaluation use only.
- `disabled`: kill switch or launch control is off.
- `unsupported`: no approved capability exists.

For this initial Skill scaffold, all capabilities are `mock_only`. Explain the boundary during development tests; never imply that production data was accessed.

## Outcome envelope

Expect a canonical result containing `request_id`, `capability`, `outcome`, `authorization_state`, `confirmation_state`, sanitized `data`, `provenance`, and `error`. Do not infer success from HTTP status or prose alone; require `outcome: "succeeded"`.

