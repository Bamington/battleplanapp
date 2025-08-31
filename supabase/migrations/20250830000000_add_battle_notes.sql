/*
  # Add battle_notes column to battles table

  1. Changes
    - Add `battle_notes` column to `battles` table
    - Column is nullable text type with default null value
    - Allows users to add custom notes about their battles with markdown support

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'battles' AND column_name = 'battle_notes'
  ) THEN
    ALTER TABLE battles ADD COLUMN battle_notes text DEFAULT NULL;
  END IF;
END $$;

-- Add comment explaining the new field
COMMENT ON COLUMN battles.battle_notes IS 'Optional notes about the battle with markdown support';
