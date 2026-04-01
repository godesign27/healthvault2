/*
  # Allow anonymous upload of logo file

  1. Changes
    - Add temporary policy to allow anon role to upload logo file
    
  2. Security
    - Restricted to specific filename only (hv_logo-light.png)
*/

-- Allow anon to upload the logo file specifically
CREATE POLICY "Allow anon to upload logo"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'profile-images' 
    AND name = 'hv_logo-light.png'
  );
