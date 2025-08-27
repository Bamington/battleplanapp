/*
  # Create version table with proper structure and policies

  1. Schema Changes
    - Create `version` table if it doesn't exist
    - Add proper columns: id, ver_number, created_at, ver_notes
    - Set up auto-incrementing id

  2. Security
    - Enable RLS
    - Allow all authenticated users to read version info
    - Allow only admins to insert/update versions
*/

-- Create version table if it doesn't exist
CREATE TABLE IF NOT EXISTS version (
  id SERIAL PRIMARY KEY,
  ver_number numeric NOT NULL DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  ver_notes text
);

-- Enable RLS
ALTER TABLE version ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read version info
CREATE POLICY "Allow authenticated users to read version" ON version
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow only admins to insert versions
CREATE POLICY "Allow admins to insert version" ON version
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policy: Allow only admins to update versions
CREATE POLICY "Allow admins to update version" ON version
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Insert initial version if table is empty
INSERT INTO version (ver_number, created_at, ver_notes)
SELECT 1.0, now(), 'Initial version'
WHERE NOT EXISTS (SELECT 1 FROM version);
