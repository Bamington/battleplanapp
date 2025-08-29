/*
  # Fix Users Table RLS for Admin Updates

  This migration fixes the RLS policies on the users table to allow admins to update other users' data.
  This is needed for the role assignment functionality in the admin interface.

  1. Problem
    - Current RLS policy only allows users to update their own data
    - Admins cannot assign roles to other users because they're blocked by RLS
    - Role assignment functionality is broken

  2. Solution
    - Update the UPDATE policy to allow admins to update any user
    - Maintain security by only allowing admins to update other users
    - Keep existing policy for users updating their own data
*/

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

-- Add comment explaining the policy approach
COMMENT ON POLICY "Users can update own data or admins can update any user" ON users IS 
'Allows users to update their own data and admins to update any user data. Required for role assignment functionality.';
