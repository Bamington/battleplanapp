/*
  # Add public sharing functionality for models

  1. Security Changes
    - Add policy to allow public read access to models when accessed via share link
    - Add policy to allow public read access to related game and box data
  
  2. Notes
    - Models can be shared publicly via direct ID access
    - Only read access is granted to anonymous users
    - Users still need to be authenticated to manage their own models
*/

-- Allow anonymous users to read individual models by ID (for sharing)
CREATE POLICY "Allow public read access to shared models"
  ON models
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read games data (needed for shared model display)
CREATE POLICY "Allow public read access to games for sharing"
  ON games
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read boxes data (needed for shared model display)
CREATE POLICY "Allow public read access to boxes for sharing"
  ON boxes
  FOR SELECT
  TO anon
  USING (true);