-- Migration: Rename events table to campaigns
-- This migration renames the events table and all related references to use "campaigns" terminology

-- First, rename the table
ALTER TABLE events RENAME TO campaigns;

-- Rename user_id to created_by in campaigns table
ALTER TABLE campaigns RENAME COLUMN user_id TO created_by;

-- Update the battles table foreign key column name
ALTER TABLE battles RENAME COLUMN event_id TO campaign_id;

-- Drop existing foreign key constraint and recreate with new name
ALTER TABLE battles DROP CONSTRAINT IF EXISTS battles_event_id_fkey;
ALTER TABLE battles ADD CONSTRAINT battles_campaign_id_fkey
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "Users can view their own events" ON campaigns;
DROP POLICY IF EXISTS "Users can insert their own events" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own events" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own events" ON campaigns;

CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = created_by);

-- Update indexes
DROP INDEX IF EXISTS idx_events_created_by;
DROP INDEX IF EXISTS idx_battles_event_id;

CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX idx_battles_campaign_id ON battles(campaign_id);

-- Update triggers (rename function and trigger)
DROP TRIGGER IF EXISTS set_updated_at_events ON campaigns;
DROP FUNCTION IF EXISTS update_updated_at_events();

CREATE OR REPLACE FUNCTION update_updated_at_campaigns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_campaigns();

-- Add helpful comment
COMMENT ON TABLE campaigns IS 'User-created campaigns that can contain multiple battles';