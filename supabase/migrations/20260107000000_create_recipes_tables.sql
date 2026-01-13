/*
  # Create Recipes Tables

  1. Schema Changes
    - Create `recipes` table to store hobby item recipes
    - Create `recipe_items` junction table to link recipes with hobby items
    - Create `model_recipes` junction table to link models with recipes
    - Includes description field for model-specific notes about where recipe was used

  2. Security
    - Enable RLS on all tables
    - Users can only access their own recipes
    - Users can only link recipes to their own models
    - Admins have full access

  3. Notes
    - Recipes are not game-specific and can be reused across models
    - When a recipe is updated, all models using it see the changes
    - A model cannot use the same recipe twice
    - Description field on model_recipes is optional and model-specific
*/

-- Create recipes table
CREATE TABLE IF NOT EXISTS "public"."recipes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "owner" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "recipes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recipes_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- Create recipe_items junction table (links recipes to hobby items)
CREATE TABLE IF NOT EXISTS "public"."recipe_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "recipe_id" uuid NOT NULL,
  "hobby_item_id" bigint NOT NULL,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE,
  CONSTRAINT "recipe_items_hobby_item_id_fkey" FOREIGN KEY ("hobby_item_id") REFERENCES "public"."hobby_items"("id") ON DELETE CASCADE
);

-- Create model_recipes junction table (links models to recipes with optional description)
CREATE TABLE IF NOT EXISTS "public"."model_recipes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "model_id" uuid NOT NULL,
  "recipe_id" uuid NOT NULL,
  "description" text,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "model_recipes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "model_recipes_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE,
  CONSTRAINT "model_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE,
  CONSTRAINT "unique_model_recipe" UNIQUE ("model_id", "recipe_id")
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_recipes_owner" ON "public"."recipes" ("owner");
CREATE INDEX IF NOT EXISTS "idx_recipe_items_recipe_id" ON "public"."recipe_items" ("recipe_id");
CREATE INDEX IF NOT EXISTS "idx_recipe_items_hobby_item_id" ON "public"."recipe_items" ("hobby_item_id");
CREATE INDEX IF NOT EXISTS "idx_model_recipes_model_id" ON "public"."model_recipes" ("model_id");
CREATE INDEX IF NOT EXISTS "idx_model_recipes_recipe_id" ON "public"."model_recipes" ("recipe_id");

-- Enable Row Level Security
ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."recipe_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."model_recipes" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipes table
CREATE POLICY "Users can view their own recipes"
  ON "public"."recipes"
  FOR SELECT
  USING (owner = auth.uid());

CREATE POLICY "Users can create their own recipes"
  ON "public"."recipes"
  FOR INSERT
  WITH CHECK (owner = auth.uid());

CREATE POLICY "Users can update their own recipes"
  ON "public"."recipes"
  FOR UPDATE
  USING (owner = auth.uid());

CREATE POLICY "Users can delete their own recipes"
  ON "public"."recipes"
  FOR DELETE
  USING (owner = auth.uid());

-- RLS Policies for recipe_items table
CREATE POLICY "Users can view items in their own recipes"
  ON "public"."recipe_items"
  FOR SELECT
  USING (
    recipe_id IN (
      SELECT id FROM "public"."recipes"
      WHERE owner = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their own recipes"
  ON "public"."recipe_items"
  FOR INSERT
  WITH CHECK (
    recipe_id IN (
      SELECT id FROM "public"."recipes"
      WHERE owner = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own recipes"
  ON "public"."recipe_items"
  FOR UPDATE
  USING (
    recipe_id IN (
      SELECT id FROM "public"."recipes"
      WHERE owner = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from their own recipes"
  ON "public"."recipe_items"
  FOR DELETE
  USING (
    recipe_id IN (
      SELECT id FROM "public"."recipes"
      WHERE owner = auth.uid()
    )
  );

-- RLS Policies for model_recipes table
CREATE POLICY "Users can view recipes on their own models"
  ON "public"."model_recipes"
  FOR SELECT
  USING (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add recipes to their own models"
  ON "public"."model_recipes"
  FOR INSERT
  WITH CHECK (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipes on their own models"
  ON "public"."model_recipes"
  FOR UPDATE
  USING (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove recipes from their own models"
  ON "public"."model_recipes"
  FOR DELETE
  USING (
    model_id IN (
      SELECT id FROM "public"."models"
      WHERE user_id = auth.uid()
    )
  );

-- Admin policies for full access
CREATE POLICY "Admins have full access to recipes"
  ON "public"."recipes"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM "public"."users"
      WHERE is_admin = true
    )
  );

CREATE POLICY "Admins have full access to recipe items"
  ON "public"."recipe_items"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM "public"."users"
      WHERE is_admin = true
    )
  );

CREATE POLICY "Admins have full access to model recipes"
  ON "public"."model_recipes"
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM "public"."users"
      WHERE is_admin = true
    )
  );

-- Grant permissions
GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";

GRANT ALL ON TABLE "public"."recipe_items" TO "anon";
GRANT ALL ON TABLE "public"."recipe_items" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_items" TO "service_role";

GRANT ALL ON TABLE "public"."model_recipes" TO "anon";
GRANT ALL ON TABLE "public"."model_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."model_recipes" TO "service_role";
