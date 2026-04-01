/*
  # Add image field to projects table

  1. Changes
    - Add image_url column to projects table to store project images
    - Column is nullable since images are optional

  2. Notes
    - Stores the URL/path to the uploaded image
*/

ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url text;
