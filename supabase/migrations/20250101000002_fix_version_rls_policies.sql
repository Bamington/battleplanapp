/*
  # Fix version table RLS policies

  1. Problem
    - Service role can insert/update versions
    - But anon key can't read the versions due to RLS policies
    - Need to allow public read access to version table

  2. Solution
    - Drop existing restrictive policies
    - Create new policies that allow public read access
    - Keep admin-only policies for insert/update
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read version" ON version;
DROP POLICY IF EXISTS "Allow admins to insert version" ON version;
DROP POLICY IF EXISTS "Allow admins to update version" ON version;

-- Policy: Allow public read access to version info (for everyone)
CREATE POLICY "Allow public read access to version" ON version
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow only admins to insert versions
CREATE POLICY "Allow admins to insert version" ON version
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policy: Allow only admins to update versions
CREATE POLICY "Allow admins to update version" ON version
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Insert initial version if table is empty
INSERT INTO version (ver_number, created_at, ver_notes)
SELECT 1.0, now(), 'Initial version'
WHERE NOT EXISTS (SELECT 1 FROM version);
