/*
  # Add RLS Policies for Hobby Items

  1. Security
    - Enable RLS on hobby_items table
    - Users can view their own hobby items
    - Users can create their own hobby items
    - Users can update their own hobby items
    - Users can delete their own hobby items
    - Admins have full access

  2. Notes
    - Hobby items are private to each user
    - Only the owner can see and manage their items
*/

-- Enable RLS on hobby_items (if not already enabled)
ALTER TABLE "public"."hobby_items" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own hobby items" ON "public"."hobby_items";
DROP POLICY IF EXISTS "Users can create their own hobby items" ON "public"."hobby_items";
DROP POLICY IF EXISTS "Users can update their own hobby items" ON "public"."hobby_items";
DROP POLICY IF EXISTS "Users can delete their own hobby items" ON "public"."hobby_items";
DROP POLICY IF EXISTS "Admins have full access to hobby items" ON "public"."hobby_items";

-- Users can view their own hobby items
CREATE POLICY "Users can view their own hobby items"
  ON "public"."hobby_items"
  FOR SELECT
  USING (owner = auth.uid());

-- Users can create their own hobby items
CREATE POLICY "Users can create their own hobby items"
  ON "public"."hobby_items"
  FOR INSERT
  WITH CHECK (owner = auth.uid());

-- Users can update their own hobby items
CREATE POLICY "Users can update their own hobby items"
  ON "public"."hobby_items"
  FOR UPDATE
  USING (owner = auth.uid())
  WITH CHECK (owner = auth.uid());

-- Users can delete their own hobby items
CREATE POLICY "Users can delete their own hobby items"
  ON "public"."hobby_items"
  FOR DELETE
  USING (owner = auth.uid());

-- Admins have full access
CREATE POLICY "Admins have full access to hobby items"
  ON "public"."hobby_items"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "public"."users"
      WHERE "users"."id" = auth.uid()
      AND "users"."is_admin" = true
    )
  );
