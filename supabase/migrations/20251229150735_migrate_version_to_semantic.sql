/*
  # Migrate version table to use semantic versioning (text format)

  1. Schema Changes
    - Change `ver_number` column from `numeric` to `text` to support semantic versioning (e.g., "1.0.0")
    - Migrate existing numeric values to semantic format:
      - 1.0 → "1.0.0"
      - 1.1 → "1.1.0"
      - 1.2 → "1.2.0"
      - etc.

  2. Data Migration
    - Convert all existing numeric version numbers to semantic format
    - Ensure all versions follow MAJOR.MINOR.PATCH format
*/

-- Step 1: Add a temporary column to store the text version
ALTER TABLE version ADD COLUMN IF NOT EXISTS ver_number_text text;

-- Step 2: Migrate existing numeric values to semantic format
-- Convert numeric to text and ensure it has 3 parts (MAJOR.MINOR.PATCH)
UPDATE version 
SET ver_number_text = CASE
  -- If version is already in semantic format (has 2 decimal points), use as-is
  WHEN ver_number::text LIKE '%.%.%' THEN ver_number::text
  -- If version has 1 decimal point (e.g., 1.0, 1.1), add .0 for patch
  WHEN ver_number::text LIKE '%.%' THEN ver_number::text || '.0'
  -- If version is whole number (e.g., 1, 2), add .0.0
  ELSE ver_number::text || '.0.0'
END;

-- Step 3: Drop the old numeric column
ALTER TABLE version DROP COLUMN IF EXISTS ver_number;

-- Step 4: Rename the new column to ver_number
ALTER TABLE version RENAME COLUMN ver_number_text TO ver_number;

-- Step 5: Add NOT NULL constraint and default
ALTER TABLE version ALTER COLUMN ver_number SET NOT NULL;
ALTER TABLE version ALTER COLUMN ver_number SET DEFAULT '1.0.0';

-- Step 6: Add a check constraint to ensure semantic versioning format
ALTER TABLE version ADD CONSTRAINT version_ver_number_format 
  CHECK (ver_number ~ '^\d+\.\d+\.\d+$');

-- Step 7: Add comment to document the format
COMMENT ON COLUMN version.ver_number IS 'Semantic version number in MAJOR.MINOR.PATCH format (e.g., "1.0.0", "1.2.3")';

