/*
  # Fix OAuth User Creation Issue

  This migration adds a trigger to automatically create user records in the users table
  when new users sign up through OAuth or any other authentication method.

  1. Problem
    - When users sign up through Google OAuth, no record is created in the users table
    - The app tries to fetch user profile but user doesn't exist
    - RLS policies prevent user from creating their own record because they don't exist yet

  2. Solution
    - Create a trigger function that automatically creates user records
    - Trigger fires when new users are created in auth.users
    - Ensures user records exist before the app tries to access them

  3. Changes
    - Add user_name_public column to users table (if not exists)
    - Create trigger function to handle new user creation
    - Create trigger on auth.users table
*/

-- Add user_name_public column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_name_public'
  ) THEN
    ALTER TABLE users ADD COLUMN user_name_public text;
  END IF;
END $$;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, user_name_public, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.created_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users who might not have records
INSERT INTO public.users (id, email, user_name_public, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'full_name'),
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
