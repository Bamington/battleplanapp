/*
  # Add purchase_date to models table

  1. New Columns
    - `models.purchase_date` (date) - stores the purchase date for the model

  2. Changes
    - Add purchase_date column to models table with default null
    - Allow models to have their own purchase date independent of boxes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'purchase_date'
  ) THEN
    ALTER TABLE models ADD COLUMN purchase_date date;
  END IF;
END $$;