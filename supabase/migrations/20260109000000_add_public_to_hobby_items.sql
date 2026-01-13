-- Add public column to hobby_items table
-- This column will be used to determine if an item shows up in user searches
-- Default is false for all existing and new items

ALTER TABLE hobby_items
ADD COLUMN IF NOT EXISTS public BOOLEAN NOT NULL DEFAULT false;

-- Set all existing items to not public
UPDATE hobby_items
SET public = false
WHERE public IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN hobby_items.public IS 'When true, this item will appear in user searches. Admin-only items have this set to false.';
