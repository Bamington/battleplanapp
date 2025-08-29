-- Quick fix for roles table RLS issue
-- Run this in your Supabase Dashboard > SQL Editor

-- First, check if roles table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'roles'
  ) THEN
    -- Create roles table if it doesn't exist
    CREATE TABLE roles (
      id SERIAL PRIMARY KEY,
      role_name text,
      booking_limit integer,
      created_at timestamp with time zone DEFAULT now(),
      users_assigned text[] DEFAULT ARRAY[]::text[]
    );
    
    -- Insert default roles
    INSERT INTO roles (role_name, booking_limit) VALUES 
      ('Player', 2),
      ('Game Master', 5),
      ('Organizer', 10),
      ('Admin', null);
  END IF;
END $$;

-- Enable RLS on roles table
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON roles;
DROP POLICY IF EXISTS "Allow admins to insert roles" ON roles;
DROP POLICY IF EXISTS "Allow admins to update roles" ON roles;
DROP POLICY IF EXISTS "Allow admins to delete roles" ON roles;

-- Create the essential policy: Allow all authenticated users to read roles
-- This is the most important one for the role dropdown to work
CREATE POLICY "Allow authenticated users to read roles" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: Add admin-only policies for managing roles
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

-- Test the fix
SELECT 'Roles table fixed! Current roles:' as message;
SELECT id, role_name, booking_limit FROM roles ORDER BY id;
