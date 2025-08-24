/*
  # Add public property to boxes table

  1. Schema Changes
    - Add `public` column to `boxes` table
      - `public` (boolean, default false, not null)
    - Add index for efficient public box queries

  2. Security
    - Update RLS policies to allow public read access to public boxes
    - Maintain existing policies for private boxes

  3. Notes
    - Public boxes can be viewed by anyone without authentication
    - Private boxes remain restricted to their owners
*/

-- Add public column to boxes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'boxes' AND column_name = 'public'
  ) THEN
    ALTER TABLE boxes ADD COLUMN public boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for efficient public box queries
CREATE INDEX IF NOT EXISTS boxes_public_idx ON boxes(public) WHERE public = true;

-- Update RLS policies to allow public read access to public boxes
-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Allow public read access to boxes for sharing" ON boxes;

-- Create new policy that allows public read access only to public boxes
CREATE POLICY "Allow public read access to public boxes"
  ON boxes
  FOR SELECT
  TO anon
  USING (public = true);

-- Ensure authenticated users can still read their own boxes (public or private)
CREATE POLICY "Users can read own boxes"
  ON boxes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure authenticated users can update their own boxes
CREATE POLICY "Users can update own boxes"
  ON boxes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
