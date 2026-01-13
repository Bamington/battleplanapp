-- Add code column to hobby_items table
-- This column will be used to store SKU or product codes for items
-- Default is null for all existing items

ALTER TABLE hobby_items
ADD COLUMN IF NOT EXISTS code TEXT;

-- Add comment to document the column
COMMENT ON COLUMN hobby_items.code IS 'Product code or SKU for this hobby item (e.g., "21-04" for Citadel Mephiston Red)';
