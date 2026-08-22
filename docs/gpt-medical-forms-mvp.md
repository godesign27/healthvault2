# GPT Medical Forms MVP

## Implemented slice

The production-oriented form workflow now starts with discovery instead of immediately asking for a file:

1. `list_medical_forms` lists the user's common reusable forms, draft/completion status, and secure upload option.
2. `get_medical_form` returns the current private draft, missing fields, and clearly unconfirmed suggestions from existing Health Vault data.
3. `propose_form_answers` validates typed answers and creates a private, expiring review proposal without changing the form.
4. `confirm_form_answers` saves the exact reviewed answers as an incomplete draft after explicit confirmation.
5. The secure handoff opens Medical Forms and the requested form in the authenticated web app.
6. A provider-specific PDF, PNG, or JPEG can be uploaded to a private per-user bucket from the authenticated Medical Forms page.

The ChatGPT-editable templates are Medical History, Medical ID Information, Emergency Contact Information, Current Medications, and Allergy Information. Patient Registration is also shown in discovery but remains in the secure web experience because it contains broader identity fields.

Draft saving never completes, signs, or shares a form. Legal consent, signatures, SSNs, payments, provider-file uploads, and unsupported fields remain in the secure web experience.

## Security properties

- Form responses and answer proposals use the authenticated user's token and row-level security.
- Broad demo read/update policies are removed by the new migration.
- Proposals are user-owned, expire after 30 minutes, and record the expected response timestamp.
- Confirmation rejects stale proposals so newer draft answers cannot be overwritten.
- Repeating a successful confirmation returns the existing draft and does not create another response.
- Provider-form files use a private bucket, a user-id path prefix, MIME/size limits, and owner-only row/storage policies.

## Release steps

1. Apply `20260822000003_secure_gpt_medical_form_proposals.sql` and `20260822000004_secure_medical_form_uploads.sql` to the connected Supabase project.
2. Deploy only the updated `health-vault-mcp` Edge Function.
3. Publish the web application so the authenticated upload route is available.
4. Refresh or reinstall the development ChatGPT app so the updated form discovery metadata is rediscovered.
5. Test with two accounts to verify one member cannot list, open, propose, confirm, upload, read, or delete another member's form data.

## Deferred

- Completing, signing, or sharing a form from ChatGPT.
- Extracting answers from uploaded provider files and mapping them into a reusable form draft.
- Complex/repeating form fields in ChatGPT.
- Atomic server-side confirmation RPC if stronger transactional guarantees are required beyond the MVP's idempotent upsert and concurrency check.
