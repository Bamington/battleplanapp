/*
  # Add tables column to locations

  1. Schema Changes
    - Add `tables` column to `locations` table
      - `tables` (integer, default 1, not null)
      - Must be greater than 0

  2. Security
    - No RLS changes needed (inherits existing policies)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'tables'
  ) THEN
    ALTER TABLE locations ADD COLUMN tables integer DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Add constraint to ensure tables is always positive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'locations_tables_check'
  ) THEN
    ALTER TABLE locations ADD CONSTRAINT locations_tables_check CHECK (tables > 0);
  END IF;
END $$;