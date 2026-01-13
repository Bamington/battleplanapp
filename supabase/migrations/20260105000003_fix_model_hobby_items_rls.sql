/*
  # Fix Model Hobby Items RLS Policies

  1. Changes
    - Drop existing RLS policies that may be causing hangs
    - Recreate with optimized policies that don't cause deadlocks
    - Ensure policies check model ownership correctly

  2. Notes
    - The EXISTS subquery was potentially causing performance issues
    - New policies are simpler and more efficient
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view hobby items on their own models" ON "public"."model_hobby_items";
DROP POLICY IF EXISTS "Users can add hobby items to their own models" ON "public"."model_hobby_items";
DROP POLICY IF EXISTS "Users can remove hobby items from their own models" ON "public"."model_hobby_items";
DROP POLICY IF EXISTS "Admins have full access to model hobby items" ON "public"."model_hobby_items";

-- Create new optimized policies
CREATE POLICY "Users can view hobby items on their own models"
  ON "public"."model_hobby_items"
  FOR SELECT
  USING (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add hobby items to their own models"
  ON "public"."model_hobby_items"
  FOR INSERT
  WITH CHECK (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove hobby items from their own models"
  ON "public"."model_hobby_items"
  FOR DELETE
  USING (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

-- Admin policy for full access
CREATE POLICY "Admins have full access to model hobby items"
  ON "public"."model_hobby_items"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM "public"."users"
      WHERE is_admin = true
    )
  );
