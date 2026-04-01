/*
  # Update profile-images bucket policies for logo upload

  1. Changes
    - Add policy to allow public read access to logo files
    - Add policy to allow authenticated users to upload files
    
  2. Security
    - Public read access for all files in the bucket (needed for email logo)
    - Only authenticated users can upload files
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile images" ON storage.objects;

-- Allow public read access to all files in profile-images bucket
CREATE POLICY "Public read access for profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images')
  WITH CHECK (bucket_id = 'profile-images');
