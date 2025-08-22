/*
  # Add notes column to models table

  1. Changes
    - Add `notes` column to `models` table
    - Column is nullable text type with default null value
    - Allows users to add custom notes about their models

  2. Security
    - No RLS changes needed as existing policies cover the new column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'notes'
  ) THEN
    ALTER TABLE models ADD COLUMN notes text DEFAULT NULL;
  END IF;
END $$;