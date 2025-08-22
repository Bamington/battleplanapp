/*
  # Create users table for admin functionality

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `is_admin` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for authenticated users to insert their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);