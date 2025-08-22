/*
  # Add direct game relationship to models

  1. Schema Changes
    - Add `game_id` column to `models` table as foreign key to `games`
    - Allow models to be associated directly with games
    - Maintain existing box relationship as primary, with direct game as fallback

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

-- Add game_id column to models table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'game_id'
  ) THEN
    ALTER TABLE models ADD COLUMN game_id uuid REFERENCES games(id) ON DELETE SET NULL;
  END IF;
END $$;