-- Add opponent_id to battles table and migrate existing data
-- This migration adds a foreign key relationship to the opponents table

-- First, add the opponent_id column to battles table
ALTER TABLE battles ADD COLUMN opponent_id INTEGER REFERENCES opponents(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX battles_opponent_id_idx ON battles(opponent_id);

-- Migrate existing opponent data
-- This will create opponents for existing opp_name values and link them
INSERT INTO opponents (opp_name, created_by)
SELECT DISTINCT 
  opp_name,
  user_id
FROM battles 
WHERE opp_name IS NOT NULL 
  AND opp_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM opponents 
    WHERE opponents.opp_name = battles.opp_name
  );

-- Update battles to reference the opponents table
UPDATE battles 
SET opponent_id = opponents.id
FROM opponents 
WHERE battles.opp_name = opponents.opp_name
  AND battles.opp_name IS NOT NULL
  AND battles.opp_name != '';

-- Add comment to document the change
COMMENT ON COLUMN battles.opponent_id IS 'Foreign key reference to opponents table. Replaces direct opp_name storage for better data integrity.';

