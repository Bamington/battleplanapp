/*
  # Create Lists Feature Tables

  1. New Tables
    - `lists` - User army/squad lists
    - `units` - Units within a list
    - `unit_models` - Junction table linking units to models

  2. Security
    - Enable RLS on all tables
    - Users can only manage their own lists

  3. Features
    - Track army lists with points/cost
    - Associate units with physical models
    - Organize units by type and order
*/

-- Create lists table
CREATE TABLE IF NOT EXISTS lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  points_total integer DEFAULT 0,
  points_limit integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text,
  model_count integer NOT NULL DEFAULT 1,
  cost integer DEFAULT 0,
  notes text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create unit_models junction table
CREATE TABLE IF NOT EXISTS unit_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(unit_id, model_id)
);

-- Enable RLS
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_models ENABLE ROW LEVEL SECURITY;

-- Lists policies
CREATE POLICY "Users can view own lists"
  ON lists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lists"
  ON lists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lists"
  ON lists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lists"
  ON lists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Units policies (via list ownership)
CREATE POLICY "Users can view units in own lists"
  ON units
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = units.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert units in own lists"
  ON units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = units.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update units in own lists"
  ON units
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = units.list_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete units in own lists"
  ON units
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lists
      WHERE lists.id = units.list_id
      AND lists.user_id = auth.uid()
    )
  );

-- Unit models policies
CREATE POLICY "Users can view unit_models in own lists"
  ON unit_models
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN lists ON lists.id = units.list_id
      WHERE units.id = unit_models.unit_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert unit_models in own lists"
  ON unit_models
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM units
      JOIN lists ON lists.id = units.list_id
      WHERE units.id = unit_models.unit_id
      AND lists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete unit_models in own lists"
  ON unit_models
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN lists ON lists.id = units.list_id
      WHERE units.id = unit_models.unit_id
      AND lists.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX lists_user_id_idx ON lists(user_id);
CREATE INDEX lists_game_id_idx ON lists(game_id);
CREATE INDEX lists_created_at_idx ON lists(created_at);

CREATE INDEX units_list_id_idx ON units(list_id);
CREATE INDEX units_display_order_idx ON units(display_order);

CREATE INDEX unit_models_unit_id_idx ON unit_models(unit_id);
CREATE INDEX unit_models_model_id_idx ON unit_models(model_id);

-- Trigger to auto-update lists.updated_at
CREATE TRIGGER update_lists_updated_at
  BEFORE UPDATE ON lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate total points for a list
CREATE OR REPLACE FUNCTION calculate_list_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the list's points_total when units change
  UPDATE lists
  SET points_total = (
    SELECT COALESCE(SUM(cost), 0)
    FROM units
    WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
  )
  WHERE id = COALESCE(NEW.list_id, OLD.list_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers to recalculate points when units are added/updated/deleted
CREATE TRIGGER recalculate_points_on_insert
  AFTER INSERT ON units
  FOR EACH ROW
  EXECUTE FUNCTION calculate_list_points();

CREATE TRIGGER recalculate_points_on_update
  AFTER UPDATE OF cost ON units
  FOR EACH ROW
  EXECUTE FUNCTION calculate_list_points();

CREATE TRIGGER recalculate_points_on_delete
  AFTER DELETE ON units
  FOR EACH ROW
  EXECUTE FUNCTION calculate_list_points();
