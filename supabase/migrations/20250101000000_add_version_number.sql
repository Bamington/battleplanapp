/*
  # Add version number column to version table

  1. Schema Changes
    - Add `ver_number` column to `version` table
      - `ver_number` (numeric, not null)
      - Will store version numbers like 1.0, 1.1, 1.2, etc.

  2. Initial Data
    - Insert initial version 1.0 if table is empty
*/

-- Add ver_number column to version table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'version' AND column_name = 'ver_number'
  ) THEN
    ALTER TABLE version ADD COLUMN ver_number numeric NOT NULL DEFAULT 1.0;
  END IF;
END $$;

-- Insert initial version if table is empty
INSERT INTO version (ver_number, created_at)
SELECT 1.0, now()
WHERE NOT EXISTS (SELECT 1 FROM version);
