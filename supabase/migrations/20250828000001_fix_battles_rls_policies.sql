/*
  # Fix battles table RLS policies

  This migration updates the RLS policies for the battles table to match the actual schema:
  - id (number, primary key)
  - battle_name (text)
  - date_played (text)
  - game_name (text)
  - game_uid (text)
  - opp_name (text)
  - opp_id (text[])
  - result (text)
  - created_at (text)

  The original migration was created for a different schema, so we need to update the policies
  to work with the actual table structure.
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read all battles" ON battles;
DROP POLICY IF EXISTS "Users can insert own battles" ON battles;
DROP POLICY IF EXISTS "Users can update own battles" ON battles;
DROP POLICY IF EXISTS "Users can delete own battles" ON battles;

-- Enable RLS (in case it's not already enabled)
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Create new policies for the actual battles table structure
-- Since the actual table doesn't have user_id, we'll allow all authenticated users to read all battles
-- and allow insert/update/delete for all authenticated users (since there's no user_id to restrict by)

-- Policy for reading battles (allow all authenticated users to read all battles)
CREATE POLICY "Users can read all battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for inserting battles (allow all authenticated users to insert)
-- Note: Since there's no user_id field, we can't restrict by user
CREATE POLICY "Users can insert battles"
  ON battles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for updating battles (allow all authenticated users to update)
-- Note: Since there's no user_id field, we can't restrict by user
CREATE POLICY "Users can update battles"
  ON battles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for deleting battles (allow all authenticated users to delete)
-- Note: Since there's no user_id field, we can't restrict by user
CREATE POLICY "Users can delete battles"
  ON battles
  FOR DELETE
  TO authenticated
  USING (true);

-- Add comment explaining the policy approach
COMMENT ON TABLE battles IS 'Battles table - RLS policies allow all authenticated users full access since there is no user_id field to restrict by user';
