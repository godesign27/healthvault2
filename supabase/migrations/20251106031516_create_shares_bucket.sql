/*
  # Create shares storage bucket

  1. New Bucket
    - Create 'shares' bucket for storing shared form PDFs and FHIR bundles
    
  2. Security
    - Public bucket for access via secure share links
    - Read-only access for public
    - Only authenticated users can upload files
*/

-- Create the shares bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('shares', 'shares', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to all files in shares bucket
CREATE POLICY "Public read access for shares"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'shares');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload shares"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shares');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated users can update shares"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'shares')
  WITH CHECK (bucket_id = 'shares');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete shares"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'shares');
