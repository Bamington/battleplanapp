/*
  # Add Section Field to Model Hobby Items

  1. Schema Changes
    - Add `section` column to `model_hobby_items` table
      - Allows users to specify where on the model the item was used
      - Optional text field

  2. Notes
    - This is specific to the model + item combination
    - For example: "Armor", "Face", "Weapon", etc.
*/

-- Add section column to model_hobby_items table
ALTER TABLE "public"."model_hobby_items"
  ADD COLUMN IF NOT EXISTS "section" text;

-- Add comment to document the field
COMMENT ON COLUMN "public"."model_hobby_items"."section" IS 'Where on the model this hobby item was used (e.g., Armor, Face, Weapon)';
