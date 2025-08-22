/*
  # Add Partially Painted Status

  1. Schema Changes
    - Update models table status constraint to include 'Partially Painted'
    - Add new status option between 'Primed' and 'Painted'

  2. Security
    - No RLS changes needed (existing policies remain)

  3. Notes
    - Existing data remains unchanged
    - New status will be available for future updates
*/

-- Drop the existing constraint
ALTER TABLE models DROP CONSTRAINT IF EXISTS models_status_check;

-- Add the new constraint with 'Partially Painted' option
ALTER TABLE models ADD CONSTRAINT models_status_check 
  CHECK (status = ANY (ARRAY['None'::text, 'Assembled'::text, 'Primed'::text, 'Partially Painted'::text, 'Painted'::text]));