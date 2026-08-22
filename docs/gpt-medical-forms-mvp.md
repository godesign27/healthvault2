# GPT Medical Forms MVP

## Implemented slice

The first production-oriented form workflow supports the **Medical History** template:

1. `list_medical_forms` lists supported forms and draft status.
2. `get_medical_form` returns the current private draft, missing fields, and clearly unconfirmed suggestions from existing Health Vault data.
3. `propose_form_answers` validates typed answers and creates a private, expiring review proposal without changing the form.
4. `confirm_form_answers` saves the exact reviewed answers as an incomplete draft after explicit confirmation.
5. The secure handoff opens Medical Forms and the requested form in the authenticated web app.

Draft saving never completes, signs, or shares a form. Legal consent, signatures, SSNs, payments, uploads, and unsupported fields remain in the secure web experience.

## Security properties

- Form responses and answer proposals use the authenticated user's token and row-level security.
- Broad demo read/update policies are removed by the new migration.
- Proposals are user-owned, expire after 30 minutes, and record the expected response timestamp.
- Confirmation rejects stale proposals so newer draft answers cannot be overwritten.
- Repeating a successful confirmation returns the existing draft and does not create another response.

## Release steps

1. Apply `20260822000003_secure_gpt_medical_form_proposals.sql` to the connected Supabase project.
2. Deploy only the updated `health-vault-mcp` Edge Function.
3. Refresh or reinstall the development ChatGPT app so the four form tools and two templates are rediscovered.
4. Test with two accounts to verify one member cannot list, open, propose, or confirm another member's form data.

## Deferred

- Completing, signing, or sharing a form from ChatGPT.
- Additional templates beyond Medical History.
- File uploads and complex/repeating form fields.
- Atomic server-side confirmation RPC if stronger transactional guarantees are required beyond the MVP's idempotent upsert and concurrency check.
