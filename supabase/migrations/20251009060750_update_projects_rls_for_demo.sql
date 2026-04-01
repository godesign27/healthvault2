/*
  # Update Projects RLS Policies for Demo Access

  1. Changes
    - Drop existing restrictive RLS policies that require authenticated users
    - Add new permissive policies that allow public access for demo purposes
    - This enables project creation without authentication

  2. Security Note
    - These policies are permissive for demo purposes
    - In production, you would want to add authentication back
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Create new permissive policies for demo access
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete access to projects"
  ON projects FOR DELETE
  USING (true);
