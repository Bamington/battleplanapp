-- Setup RLS policies for opponents table
-- This migration ensures the opponents table has proper Row Level Security policies

-- Enable RLS on opponents table (if not already enabled)
ALTER TABLE opponents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read all opponents" ON opponents;
DROP POLICY IF EXISTS "Users can insert opponents" ON opponents;
DROP POLICY IF EXISTS "Users can update opponents" ON opponents;
DROP POLICY IF EXISTS "Users can delete opponents" ON opponents;

-- Create policies for opponents table
CREATE POLICY "Users can read all opponents"
  ON opponents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert opponents"
  ON opponents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update opponents"
  ON opponents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL)
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete opponents"
  ON opponents
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL);

-- Add index for performance on created_by
CREATE INDEX IF NOT EXISTS opponents_created_by_idx ON opponents(created_by);

-- Add index for performance on opp_name
CREATE INDEX IF NOT EXISTS opponents_opp_name_idx ON opponents(opp_name);

