-- Add sub_brand column to hobby_items table
-- This column will be used to store sub-brand information (e.g., "Layer", "Base", "Air" for Citadel)
-- Default is null for all existing items

ALTER TABLE hobby_items
ADD COLUMN IF NOT EXISTS sub_brand TEXT;

-- Add comment to document the column
COMMENT ON COLUMN hobby_items.sub_brand IS 'Sub-brand or product line within the main brand (e.g., "Layer", "Base", "Air" for Citadel paints)';
