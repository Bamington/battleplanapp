/*
  # Add Public Username Read Policy

  1. Security Changes
    - Create a view that exposes only the user_name_public field
    - Add policy to allow all authenticated users to read from this view
    - This provides a secure way to access public usernames without exposing other data
  
  2. Implementation
    - Create public_usernames view with only id and user_name_public
    - Add RLS policy to allow authenticated users to read from the view
    - Maintains privacy by only exposing the public username field
*/

-- Create a view that only exposes the public username
CREATE OR REPLACE VIEW public.public_usernames AS
SELECT 
  id,
  user_name_public
FROM public.users
WHERE user_name_public IS NOT NULL;

-- Enable RLS on the view
ALTER VIEW public.public_usernames SET (security_invoker = true);

-- Add policy to allow all authenticated users to read from the view
CREATE POLICY "Users can read public usernames"
  ON public.public_usernames
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant access to the view
GRANT SELECT ON public.public_usernames TO authenticated;
