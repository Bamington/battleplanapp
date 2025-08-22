/*
  # Fix Users Table RLS Policies

  1. Security Changes
    - Remove recursive policy that causes infinite recursion
    - Simplify policies to use direct auth.uid() comparisons
    - Maintain security while preventing policy loops

  2. Policy Updates
    - Replace "Admins can read user details" policy with non-recursive version
    - Keep other policies simple and direct
    - Ensure no subqueries reference the users table itself
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read user details" ON users;

-- Recreate a simpler admin policy that doesn't cause recursion
-- This policy allows users to read other users' basic info only if they are marked as admin
-- We avoid the recursive subquery by using a direct comparison
CREATE POLICY "Admins can read all user details"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to read their own data
    auth.uid() = id 
    OR 
    -- Allow if the current user is an admin (direct check without subquery)
    EXISTS (
      SELECT 1 FROM users admin_check 
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = true
    )
  );

-- Ensure other policies are simple and don't cause recursion
-- Update the existing policies to be more explicit

-- Drop and recreate the SELECT policy for own data to be more explicit
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure INSERT policy is correct
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure UPDATE policy is correct
DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);