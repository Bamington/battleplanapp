/*
  # Add Recipe Description and Item Ordering

  1. Schema Changes
    - Add `description` column to `recipes` table
    - Add `display_order` column to `recipe_items` table for drag-and-drop ordering

  2. Notes
    - Description is optional and allows users to add notes about the recipe
    - Display order defaults to 0 and can be reordered by users
*/

-- Add description column to recipes table
ALTER TABLE "public"."recipes"
ADD COLUMN IF NOT EXISTS "description" text;

-- Add display_order column to recipe_items table
ALTER TABLE "public"."recipe_items"
ADD COLUMN IF NOT EXISTS "display_order" integer DEFAULT 0 NOT NULL;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS "idx_recipe_items_display_order" ON "public"."recipe_items" ("recipe_id", "display_order");
