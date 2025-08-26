/*
  # Update model sharing policy to only allow access to public models

  1. Security Changes
    - Update policy to only allow public read access to models that are marked as public
    - This ensures private models cannot be accessed via share links
  
  2. Notes
    - Only models with public = true can be accessed by anonymous users
    - This provides proper security for private models
*/

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Allow public read access to shared models" ON models;

-- Create new policy that only allows access to public models
CREATE POLICY "Allow public read access to shared models"
  ON models
  FOR SELECT
  TO anon
  USING (public = true);
