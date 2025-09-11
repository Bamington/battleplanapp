/*
  # Remove box_id column from models table

  This migration removes the old box_id foreign key column from the models table
  since we now use the many-to-many relationship through the model_boxes junction table.

  1. Prerequisites
    - Ensure all data has been migrated to the model_boxes junction table
    - Verify that the application code has been updated to use the new relationship

  2. Changes
    - Drop the box_id column from the models table
    - This completes the transition to many-to-many relationships

  3. Security
    - No RLS changes needed as we're only removing a column
*/

-- Verify that data has been migrated by checking if any models still have box_id set
-- This query should return 0 if migration was successful
DO $$
DECLARE
  models_with_box_id INTEGER;
BEGIN
  SELECT COUNT(*) INTO models_with_box_id
  FROM models 
  WHERE box_id IS NOT NULL;
  
  IF models_with_box_id > 0 THEN
    RAISE NOTICE 'Warning: % models still have box_id set. Consider running data migration first.', models_with_box_id;
  ELSE
    RAISE NOTICE 'All models have been migrated to many-to-many relationships.';
  END IF;
END $$;

-- Remove the box_id column from models table
-- Note: This is a breaking change - ensure application code is updated first
ALTER TABLE models DROP COLUMN IF EXISTS box_id;