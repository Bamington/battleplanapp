/*
  # Add user_id to battles table for proper user isolation

  This migration adds a user_id field to the battles table to enable proper user-based
  RLS policies. This is the recommended approach for user data isolation.

  Steps:
  1. Add user_id column to battles table
  2. Update existing battles to set user_id (if any exist)
  3. Make user_id NOT NULL
  4. Update RLS policies to use user_id for proper isolation
*/

-- Add user_id column (nullable initially)
ALTER TABLE battles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to use user_id for proper isolation
DROP POLICY IF EXISTS "Users can read all battles" ON battles;
DROP POLICY IF EXISTS "Users can insert battles" ON battles;
DROP POLICY IF EXISTS "Users can update battles" ON battles;
DROP POLICY IF EXISTS "Users can delete battles" ON battles;

-- Enable RLS (in case it's not already enabled)
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Create proper user-isolated policies
CREATE POLICY "Users can read own battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battles"
  ON battles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own battles"
  ON battles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own battles"
  ON battles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for user_id for better performance
CREATE INDEX IF NOT EXISTS battles_user_id_idx ON battles(user_id);

-- Add comment explaining the policy approach
COMMENT ON TABLE battles IS 'Battles table - RLS policies restrict users to their own battles using user_id field';
