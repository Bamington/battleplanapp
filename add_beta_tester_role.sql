-- Add Beta Tester role to the roles table
-- Run this in your Supabase Dashboard > SQL Editor

-- First, add a unique constraint on role_name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'roles_role_name_key'
  ) THEN
    ALTER TABLE roles ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);
  END IF;
END $$;

-- Insert Beta Tester role if it doesn't exist
INSERT INTO roles (role_name, booking_limit) VALUES 
  ('Beta Tester', null)
ON CONFLICT (role_name) DO NOTHING;

-- Verify the role was added
SELECT * FROM roles WHERE role_name = 'Beta Tester';
