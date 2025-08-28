-- Add image_url column to battles table
ALTER TABLE battles ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment explaining the new field
COMMENT ON COLUMN battles.image_url IS 'URL to the battle image uploaded by the user';
