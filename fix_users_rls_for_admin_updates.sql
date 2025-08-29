-- Fix users table RLS policies to allow admins to update other users
-- Run this in your Supabase Dashboard > SQL Editor

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create a new policy that allows users to update their own data OR allows admins to update any user
CREATE POLICY "Users can update own data or admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow users to update their own data
    auth.uid() = id 
    OR 
    -- Allow admins to update any user
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  )
  WITH CHECK (
    -- Allow users to update their own data
    auth.uid() = id 
    OR 
    -- Allow admins to update any user
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Test the fix by checking current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'UPDATE';
