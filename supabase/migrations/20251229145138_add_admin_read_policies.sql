/*
  # Add Admin Read Access Policies for Activity Dashboard

  1. Schema Changes
    - Add RLS policies to allow admin users to read all data from:
      - models table
      - battles table
      - lists table
      - games table (for user-created custom games)

  2. Security
    - Admins can view all user data for activity monitoring
    - Uses same pattern as boxes admin policies
    - Maintains existing user-isolated policies

  3. Notes
    - Admin status is determined by `is_admin` column in users table
    - These policies enable admin activity dashboard functionality
*/

-- Policy to allow admins to read all models
CREATE POLICY "Admins can read all models"
  ON models
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy to allow admins to read all battles
CREATE POLICY "Admins can read all battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy to allow admins to read all lists
CREATE POLICY "Admins can read all lists"
  ON lists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy to allow admins to read all games (including custom games)
CREATE POLICY "Admins can read all games"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Add comments explaining the policies
COMMENT ON POLICY "Admins can read all models" ON models IS 
'Allows admins to view all models for activity monitoring and user analytics';

COMMENT ON POLICY "Admins can read all battles" ON battles IS 
'Allows admins to view all battles for activity monitoring and user analytics';

COMMENT ON POLICY "Admins can read all lists" ON lists IS 
'Allows admins to view all lists for activity monitoring and user analytics';

COMMENT ON POLICY "Admins can read all games" ON games IS 
'Allows admins to view all games (including custom games) for activity monitoring and user analytics';

