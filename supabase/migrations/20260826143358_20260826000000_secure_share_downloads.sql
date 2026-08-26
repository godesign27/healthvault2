/*
# Secure shared form viewing and PDF downloads

1. Storage security
   - Set the `shares` bucket to private (public = false) so objects cannot be read without a verified share token.
   - Drop the legacy "Public read access for shares" policy on storage.objects.

2. Data normalization
   - Older GPT medical-form shares stored `patient_profiles.id` in `share_events.patient_id`.
   - Normalize those rows to `auth.users.id::text` so ownership checks and revocation work for existing links.
   - Only affects rows where `options ? 'medicalFormShare'` is true.

3. Notes
   - This is a data-preserving migration: no rows or columns are deleted.
   - The share Edge Function reads storage objects with the service role after verifying the share token, revocation state, and expiration timestamp.
*/

UPDATE storage.buckets
SET public = false
WHERE id = 'shares';

DROP POLICY IF EXISTS "Public read access for shares" ON storage.objects;

UPDATE share_events AS share_event
SET patient_id = patient_profile.user_id::text
FROM patient_profiles AS patient_profile
WHERE share_event.patient_id = patient_profile.id::text
  AND share_event.options ? 'medicalFormShare';