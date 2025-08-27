-- Fix version table RLS policies
-- Run this in your Supabase Dashboard > SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read version" ON version;
DROP POLICY IF EXISTS "Allow admins to insert version" ON version;
DROP POLICY IF EXISTS "Allow admins to update version" ON version;

-- Policy: Allow public read access to version info (for everyone, including anon)
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

-- Verify the fix by checking current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'version';
