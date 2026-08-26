/*
  Require a validated, unexpired share token for form packet downloads.

  The share Edge Function reads these objects with the service role after it
  verifies the share token, revocation state, and expiration timestamp.
*/

UPDATE storage.buckets
SET public = false
WHERE id = 'shares';

DROP POLICY IF EXISTS "Public read access for shares" ON storage.objects;

-- Older GPT medical-form shares used patient_profiles.id here. Normalize them
-- to auth.users.id so ownership checks and revocation work for existing links.
UPDATE share_events AS share_event
SET patient_id = patient_profile.user_id
FROM patient_profiles AS patient_profile
WHERE share_event.patient_id = patient_profile.id
  AND share_event.options ? 'medicalFormShare';
