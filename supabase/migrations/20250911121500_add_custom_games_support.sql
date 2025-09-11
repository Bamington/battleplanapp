-- Add support for custom games by adding created_by and supported fields to games table

-- Add created_by column to track who created custom games
ALTER TABLE games 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add supported column to distinguish between official and custom games
ALTER TABLE games 
ADD COLUMN supported boolean DEFAULT true;

-- Update existing games to be supported by default (these are official games)
UPDATE games SET supported = true WHERE supported IS NULL;

-- Add index for performance on custom games queries
CREATE INDEX idx_games_created_by ON games(created_by);
CREATE INDEX idx_games_supported ON games(supported);

-- Update RLS policies to allow users to see both supported games and their own custom games
DROP POLICY IF EXISTS "Users can view games" ON games;
CREATE POLICY "Users can view games" ON games
  FOR SELECT USING (
    supported = true OR created_by = auth.uid()
  );

-- Allow users to insert their own custom games
CREATE POLICY "Users can create custom games" ON games
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND supported = false
  );

-- Allow users to update their own custom games
CREATE POLICY "Users can update their own custom games" ON games
  FOR UPDATE USING (
    created_by = auth.uid()
  );

-- Allow users to delete their own custom games
CREATE POLICY "Users can delete their own custom games" ON games
  FOR DELETE USING (
    created_by = auth.uid()
  );