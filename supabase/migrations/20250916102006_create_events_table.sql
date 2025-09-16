-- Create events table for grouping battles
CREATE TABLE events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  location text,
  description text,
  start_date date,
  end_date date,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add event_id to battles table
ALTER TABLE battles
ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_battles_event_id ON battles(event_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for events table
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
-- Users can view their own events
CREATE POLICY "Users can view their own events" ON events
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own events
CREATE POLICY "Users can create events" ON events
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own events
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own events
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (user_id = auth.uid());

-- Update existing battles RLS policy to allow viewing battles with events
-- First drop existing policy and recreate with event access
DROP POLICY IF EXISTS "Users can view their own battles" ON battles;
CREATE POLICY "Users can view their own battles" ON battles
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = battles.event_id
      AND events.user_id = auth.uid()
    )
  );