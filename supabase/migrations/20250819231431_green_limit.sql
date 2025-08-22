/*
  # Create locations table

  1. New Tables
    - `locations`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `address` (text, required)
      - `icon` (text, optional - stores image URL)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `locations` table
    - Add policy for public read access
    - Add policy for authenticated users to manage locations
*/

CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  icon text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read locations (needed for booking system)
CREATE POLICY "Anyone can read locations"
  ON locations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow authenticated users to manage locations (admins will be handled by app logic)
CREATE POLICY "Authenticated users can manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (true);

-- Insert the default location
INSERT INTO locations (name, address) VALUES ('Guf Werribee', '123 Main Street, Werribee VIC 3030');