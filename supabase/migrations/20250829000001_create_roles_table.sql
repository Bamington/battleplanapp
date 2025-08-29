/*
  # Create roles table with proper RLS policies

  1. Schema Changes
    - Create `roles` table if it doesn't exist
    - Add proper columns: id, role_name, booking_limit, created_at, users_assigned
    - Set up auto-incrementing id

  2. Security
    - Enable RLS
    - Allow all authenticated users to read roles (needed for role assignment)
    - Allow only admins to insert/update/delete roles
*/

-- Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  role_name text,
  booking_limit integer,
  created_at timestamp with time zone DEFAULT now(),
  users_assigned text[] DEFAULT ARRAY[]::text[]
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read roles (needed for role assignment)
CREATE POLICY "Allow authenticated users to read roles" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow only admins to insert roles
CREATE POLICY "Allow admins to insert roles" ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policy: Allow only admins to update roles
CREATE POLICY "Allow admins to update roles" ON roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policy: Allow only admins to delete roles
CREATE POLICY "Allow admins to delete roles" ON roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Insert some default roles if the table is empty
INSERT INTO roles (role_name, booking_limit) VALUES 
  ('Player', 2),
  ('Game Master', 5),
  ('Organizer', 10),
  ('Admin', null)
ON CONFLICT DO NOTHING;

-- Add comment explaining the policy approach
COMMENT ON TABLE roles IS 'Roles table - RLS policies allow authenticated users to read roles, admins to manage roles';
