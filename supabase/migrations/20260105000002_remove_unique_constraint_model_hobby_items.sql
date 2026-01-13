/*
  # Remove Unique Constraint from Model Hobby Items

  1. Schema Changes
    - Drop the unique constraint on (model_id, hobby_item_id)
    - This allows the same hobby item to be added multiple times to a model
    - Useful for when the same paint/item is used on different sections

  2. Notes
    - Users can now add the same hobby item multiple times with different sections
    - For example: "Abaddon Black" used on both "Armor" and "Weapon"
*/

-- Drop the unique constraint that prevents duplicate model + hobby item combinations
DROP INDEX IF EXISTS "unique_model_hobby_item";
