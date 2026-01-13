/*
  # Create Model Hobby Items Junction Table

  1. Schema Changes
    - Create `model_hobby_items` junction table to link models with hobby items (paints, washes, etc.)
    - Includes foreign keys to both models and hobby_items tables
    - Tracks when the item was added to the model

  2. Security
    - Enable RLS
    - Users can only see/manage hobby items on their own models
    - Admins have full access

  3. Notes
    - Allows tracking which paints, washes, etc. were used on each model
    - Multiple hobby items can be associated with a single model
    - Same hobby item can be used across multiple models
*/

-- Create the junction table
CREATE TABLE IF NOT EXISTS "public"."model_hobby_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "model_id" uuid NOT NULL,
  "hobby_item_id" bigint NOT NULL,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "model_hobby_items_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "public"."model_hobby_items"
  ADD CONSTRAINT "model_hobby_items_model_id_fkey"
  FOREIGN KEY ("model_id")
  REFERENCES "public"."models"("id")
  ON DELETE CASCADE;

ALTER TABLE "public"."model_hobby_items"
  ADD CONSTRAINT "model_hobby_items_hobby_item_id_fkey"
  FOREIGN KEY ("hobby_item_id")
  REFERENCES "public"."hobby_items"("id")
  ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_model_hobby_items_model_id" ON "public"."model_hobby_items" ("model_id");
CREATE INDEX IF NOT EXISTS "idx_model_hobby_items_hobby_item_id" ON "public"."model_hobby_items" ("hobby_item_id");

-- Prevent duplicate entries (same hobby item on same model)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_model_hobby_item" ON "public"."model_hobby_items" ("model_id", "hobby_item_id");

-- Enable Row Level Security
ALTER TABLE "public"."model_hobby_items" ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage hobby items on their own models
CREATE POLICY "Users can view hobby items on their own models"
  ON "public"."model_hobby_items"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "public"."models"
      WHERE "models"."id" = "model_hobby_items"."model_id"
      AND "models"."user_id" = auth.uid()
    )
  );

CREATE POLICY "Users can add hobby items to their own models"
  ON "public"."model_hobby_items"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."models"
      WHERE "models"."id" = "model_hobby_items"."model_id"
      AND "models"."user_id" = auth.uid()
    )
  );

CREATE POLICY "Users can remove hobby items from their own models"
  ON "public"."model_hobby_items"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "public"."models"
      WHERE "models"."id" = "model_hobby_items"."model_id"
      AND "models"."user_id" = auth.uid()
    )
  );

-- Admin policy for full access
CREATE POLICY "Admins have full access to model hobby items"
  ON "public"."model_hobby_items"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "public"."users"
      WHERE "users"."id" = auth.uid()
      AND "users"."is_admin" = true
    )
  );

-- Grant permissions
GRANT ALL ON TABLE "public"."model_hobby_items" TO "anon";
GRANT ALL ON TABLE "public"."model_hobby_items" TO "authenticated";
GRANT ALL ON TABLE "public"."model_hobby_items" TO "service_role";
