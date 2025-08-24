-- Add public property to boxes table
-- Run this script in your Supabase SQL editor

-- Add public column to boxes table
ALTER TABLE boxes ADD COLUMN IF NOT EXISTS public boolean DEFAULT false NOT NULL;

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
