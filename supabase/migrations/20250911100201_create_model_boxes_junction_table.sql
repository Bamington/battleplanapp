/*
  # Create many-to-many relationship between models and boxes (collections)

  1. New Tables
    - `model_boxes` - Junction table for many-to-many relationship
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key to models)
      - `box_id` (uuid, foreign key to boxes)
      - `added_at` (timestamp)
      - Unique constraint on (model_id, box_id)

  2. Data Migration
    - Migrate existing box_id relationships from models table to junction table
    - Preserve all existing model-box associations

  3. Security
    - Enable RLS on model_boxes table
    - Add policies for authenticated users to manage their own model-box relationships
    - Inherit access control from parent models and boxes
*/

-- Create the junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS model_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  box_id uuid NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  
  -- Ensure a model can only be added to a box once
  UNIQUE(model_id, box_id)
);

-- Enable Row Level Security
ALTER TABLE model_boxes ENABLE ROW LEVEL SECURITY;

-- Migrate existing relationships from models.box_id to junction table
INSERT INTO model_boxes (model_id, box_id, added_at)
SELECT 
  m.id as model_id,
  m.box_id as box_id,
  m.created_at as added_at
FROM models m
WHERE m.box_id IS NOT NULL
ON CONFLICT (model_id, box_id) DO NOTHING;

-- Create RLS policies for model_boxes table

-- Users can read model-box relationships for their own models and boxes
CREATE POLICY "Users can read own model-box relationships"
  ON model_boxes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM models m 
      WHERE m.id = model_boxes.model_id 
      AND m.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM boxes b 
      WHERE b.id = model_boxes.box_id 
      AND b.user_id = auth.uid()
    )
  );

-- Users can insert model-box relationships for their own models and boxes
CREATE POLICY "Users can insert own model-box relationships"
  ON model_boxes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM models m 
      WHERE m.id = model_boxes.model_id 
      AND m.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM boxes b 
      WHERE b.id = model_boxes.box_id 
      AND b.user_id = auth.uid()
    )
  );

-- Users can delete model-box relationships for their own models and boxes
CREATE POLICY "Users can delete own model-box relationships"
  ON model_boxes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM models m 
      WHERE m.id = model_boxes.model_id 
      AND m.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM boxes b 
      WHERE b.id = model_boxes.box_id 
      AND b.user_id = auth.uid()
    )
  );

-- Allow public read access to model-box relationships for public models/boxes
CREATE POLICY "Allow public read access to public model-box relationships"
  ON model_boxes
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM models m 
      WHERE m.id = model_boxes.model_id 
      AND m.public = true
    )
    OR
    EXISTS (
      SELECT 1 FROM boxes b 
      WHERE b.id = model_boxes.box_id 
      AND b.public = true
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_model_boxes_model_id ON model_boxes(model_id);
CREATE INDEX IF NOT EXISTS idx_model_boxes_box_id ON model_boxes(box_id);
CREATE INDEX IF NOT EXISTS idx_model_boxes_added_at ON model_boxes(added_at);