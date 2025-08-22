/*
  # Fix Users Table RLS Infinite Recursion

  This migration completely resolves the infinite recursion issue in the users table RLS policies.
  
  1. Security Changes
    - Drop all existing policies that could cause recursion
    - Create simple, non-recursive policies
    - Ensure policies use only auth.uid() without subqueries to users table
  
  2. Policy Structure
    - Users can read their own data (simple auth.uid() = id check)
    - Users can update their own data (simple auth.uid() = id check)
    - Users can insert their own data (simple auth.uid() = id check)
    - Remove admin-specific policies that cause recursion
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Admins can read all user details" ON users;
DROP POLICY IF EXISTS "Admins can read user details" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- For admin functionality, we'll handle this at the application level
-- rather than in RLS policies to avoid recursion