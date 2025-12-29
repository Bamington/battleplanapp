/*
  # Add admin access policies for boxes table

  1. Schema Changes
    - Add RLS policies to allow admin users to read all boxes
    - Add RLS policies to allow admin users to update all boxes

  2. Security
    - Admins can view all collections (boxes) regardless of owner
    - Admins can update all collections (reassign ownership, etc.)
    - Maintains existing policies for regular users

  3. Notes
    - Admin status is determined by `is_admin` column in users table
    - These policies take precedence over existing user-only policies
*/

-- Policy to allow admins to read all boxes
CREATE POLICY "Admins can read all boxes"
  ON boxes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy to allow admins to update all boxes
CREATE POLICY "Admins can update all boxes"
  ON boxes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy to allow admins to insert boxes (for completeness)
CREATE POLICY "Admins can insert boxes"
  ON boxes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy to allow admins to delete boxes (for completeness)
CREATE POLICY "Admins can delete all boxes"
  ON boxes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );