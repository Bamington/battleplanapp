/*
  # Add Admin RLS Policy for Users Table

  1. Security Function
    - Create `is_admin_user` function with SECURITY DEFINER
    - This function bypasses RLS to check admin status safely
    - Prevents infinite recursion by running with elevated privileges

  2. RLS Policy
    - Add policy for admins to read all user data
    - Uses the security definer function to avoid recursion
    - Allows admins to view UUIDs, names, and email addresses

  3. Permissions
    - Grant EXECUTE permission to authenticated users
    - Ensures the function can be called by the application
*/

-- Create a SECURITY DEFINER function to check if a user is an admin
-- This function runs with elevated privileges and bypasses RLS
CREATE OR REPLACE FUNCTION public.is_admin_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the user exists and is an admin
  -- This query bypasses RLS because of SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = p_user_id 
    AND is_admin = true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;

-- Add RLS policy for admins to read all user data
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user(auth.uid()));