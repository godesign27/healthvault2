/*
  # Create Profile Images Storage Bucket

  1. New Storage Bucket
    - `profile-images` bucket for storing user profile photos
    - Public access enabled for reading images
    - File size limit: 5MB
    - Allowed file types: image/jpeg, image/png, image/gif
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
