/*
  # Migrate godesigngo@gmail.com data from placeholder IDs to real auth UUID

  ## Summary
  Profile and health data was stored under 'demo-user' and '00000000-0000-0000-0000-000000000000'
  before real authentication was wired up. This migration copies all meaningful data into
  the real user's record (4252cf49-3054-42b8-9344-bdc6273d667d) and removes the placeholders.

  ## Steps
  1. Merge user_profiles: copy real data from demo-user into the real UUID row, delete demo-user
  2. Migrate user_preferences: reassign from demo-user to real UUID
  3. Migrate insurance_policies: reassign from demo-user to real UUID
  4. Migrate projects: reassign from demo-user to real UUID
  5. Migrate text-user_id tables using nil UUID string
  6. Migrate UUID-typed tables using nil UUID
*/

-- 1. Copy real profile data into the authenticated user's row, then delete the placeholder
UPDATE user_profiles
SET
  first_name         = 'James',
  last_name          = 'McGuire',
  email              = 'godesigngo@gmail.com',
  profile_photo_url  = 'https://sgwekxjlvadvdosyudgj.supabase.co/storage/v1/object/public/profile-images/avatars/1ih5saxk1ce-1762994851203.png',
  onboarding_complete = true,
  date_of_birth      = '1967-10-12',
  phone              = '7737240473',
  address_line1      = '201 Yerba Buena Ave, Los Altos CA 94022',
  city               = 'Los Altos',
  state              = 'CA',
  postal_code        = '94022-2275'
WHERE user_id = '4252cf49-3054-42b8-9344-bdc6273d667d';

DELETE FROM user_profiles WHERE user_id = 'demo-user';

-- 2. Migrate user_preferences
UPDATE user_preferences
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = 'demo-user';

-- 3. Migrate insurance_policies
UPDATE insurance_policies
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = 'demo-user';

-- 4. Migrate projects
UPDATE projects
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = 'demo-user';

-- 5. Migrate text user_id tables using nil UUID string
UPDATE health_records
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = '00000000-0000-0000-0000-000000000000';

UPDATE health_record_requests
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 6. Migrate UUID-typed tables using nil UUID
UPDATE insurance_coverages
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = '00000000-0000-0000-0000-000000000000';

UPDATE providers
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = '00000000-0000-0000-0000-000000000000';

UPDATE pharmacies
  SET user_id = '4252cf49-3054-42b8-9344-bdc6273d667d'
  WHERE user_id = '00000000-0000-0000-0000-000000000000';
