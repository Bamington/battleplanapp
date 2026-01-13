-- Add type_secondary column to hobby_items table
-- This column will be used to store a secondary type classification for hobby items
-- Default is null for all existing items

ALTER TABLE hobby_items
ADD COLUMN IF NOT EXISTS type_secondary TEXT;

-- Add comment to document the column
COMMENT ON COLUMN hobby_items.type_secondary IS 'Secondary type classification for this hobby item (e.g., "Metallic", "Wash", "Technical" for paints)';
