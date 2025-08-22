/*
  # Add Image and Icon fields to Games table

  1. Changes
    - Add `image` field to `games` table (text, nullable)
    - Add `icon` field to `games` table (text, nullable)
    - Both fields will store URLs to uploaded assets

  2. Notes
    - Fields are nullable to allow existing games without images/icons
    - Can store URLs to Supabase storage or external image URLs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'image'
  ) THEN
    ALTER TABLE games ADD COLUMN image text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'icon'
  ) THEN
    ALTER TABLE games ADD COLUMN icon text;
  END IF;
END $$;