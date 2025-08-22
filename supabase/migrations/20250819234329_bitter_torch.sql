/*
  # Create timeslots table

  1. New Tables
    - `timeslots`
      - `id` (uuid, primary key)
      - `name` (text, required) - Name/description of the timeslot
      - `start_time` (time, required) - Time of day the timeslot begins
      - `end_time` (time, required) - Time of day the timeslot ends
      - `location_id` (uuid, required) - Foreign key to locations table
      - `availability` (text array) - Days of week this timeslot is available
      - `created_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `timeslots` table
    - Add policy for public read access (for viewing available timeslots)
    - Add policy for authenticated users to manage timeslots

  3. Constraints
    - Foreign key constraint to locations table
    - Check constraint to ensure end_time is after start_time
    - Check constraint to validate availability days
*/

CREATE TABLE IF NOT EXISTS timeslots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  availability text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz DEFAULT now()
);

-- Add constraint to ensure end time is after start time
ALTER TABLE timeslots ADD CONSTRAINT timeslots_time_order_check 
  CHECK (end_time > start_time);

-- Add constraint to validate availability days
ALTER TABLE timeslots ADD CONSTRAINT timeslots_availability_check 
  CHECK (
    availability <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']::text[]
  );

-- Enable Row Level Security
ALTER TABLE timeslots ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (anyone can view available timeslots)
CREATE POLICY "Anyone can read timeslots"
  ON timeslots
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy for authenticated users to manage timeslots
CREATE POLICY "Authenticated users can manage timeslots"
  ON timeslots
  FOR ALL
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS timeslots_location_id_idx ON timeslots(location_id);
CREATE INDEX IF NOT EXISTS timeslots_availability_idx ON timeslots USING GIN(availability);