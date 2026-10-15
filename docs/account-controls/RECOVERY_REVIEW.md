# Recovery evidence and remaining work

Checked October 2, 2026. Read-only inspection; no restore, paid add-on or new project created.

## Observed production configuration

Project sgwekxjlvadvdosyudgj, us-east-1. Supabase backups list reports eight completed physical backups dated September 25 through October 2, 2026. Latest completed backup: October 2 at 07:16:20.494 UTC. PITR disabled; physical WAL-G backup support enabled.

This is evidence of currently listed restore points, not a contractual retention or erasure guarantee, and not proof of successful recovery. A restore rehearsal has not been run.

Supabase states database backups exclude Storage object bytes (they contain object metadata only). Uploaded documents/images therefore require a separately verified backup/restore process. No file backup process is established by this inspection.
Source: https://supabase.com/docs/guides/platform/backups

## Isolated test environment candidate

Existing preview branch cursor/chatgpt-patient-reg-interview-90ea, project roeudwddxvniazwufdqf, was reported ACTIVE_HEALTHY / FUNCTIONS_DEPLOYED, created August 24 with with_data=false. This does not prove it contains no current data or is available for destructive testing. Inspect its owners, current contents, schema and access before selecting it for synthetic export/concurrency tests. Do not restore production patient data into it merely because it is a preview.

The branch service reports main MIGRATIONS_FAILED from April 7 while the main project remains ACTIVE_HEALTHY. This historical branch status requires reconciliation with the already documented migration drift; it is not evidence that today's runtime is offline.

## Rehearsal acceptance criteria

1. Choose an isolated authorized destination and establish its access controls and cost before provisioning or overwriting it.
2. Use synthetic records/files to exercise backup restoration and verify ownership, record counts, file content hashes and authenticated access.
3. Disable outbound email, scheduled jobs and external side effects in the recovery target before exercise.
4. Measure recovery time and data gap, record actual evidence, and verify revoked/deleted access cannot reappear when old data is restored.
5. Test uploaded-file recovery independently; database metadata alone is insufficient.
6. Approve backup/retention wording only after confirming operational deletion handling and vendor retention, including mail held in Resend/Gmail.

Do not mark recovery passed solely because backups are listed. Do not use a production restore as a test.

## October 2 follow-up: preview suitability

Read-only inspection found zero Auth users and zero Storage objects in the preview,
but only 43 public tables. It lacks account_deletion_requests, vital_measurements,
connected_health_records, wellness_check_ins, wellness_insights,
wellness_insight_feedback, wellness_partner_enrollments, patient_clinical_records
and provider_access_grants required by the current export. Existing reference or
other table data has not been certified disposable. No preview schema was changed.
Owner choice of using/updating this preview is pending; do not overwrite it or claim
authenticated end-to-end export passed against this stale schema.

## Authorized preview update and acceptance

Owner subsequently authorized the preview update. Scoped schema-only bootstrap and
two-user HTTP export/deletion-request acceptance completed; see PREVIEW_ACCEPTANCE.md.
Reference data was preserved, all test users/rows cleaned up, no production data copied.
This does not establish full preview/production parity or pass the recovery rehearsal.
