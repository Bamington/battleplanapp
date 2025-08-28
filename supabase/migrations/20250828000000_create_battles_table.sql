/*
  # Create battles table

  1. New Tables
    - `battles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `game_id` (uuid, foreign key to games, optional)
      - `title` (text, required) - Name/description of the battle
      - `date` (date, required) - Date the battle took place
      - `location` (text, optional) - Where the battle took place
      - `opponent` (text, optional) - Name of opponent(s)
      - `result` (text, optional) - Win/Loss/Draw or other result
      - `notes` (text, optional) - Additional notes about the battle
      - `created_at` (timestamp with timezone, default now())
      - `updated_at` (timestamp with timezone, default now())

  2. Security
    - Enable RLS on `battles` table
    - Add policies for authenticated users to manage their own battles
    - Add policy for users to read all battles (for potential sharing features)

  3. Constraints
    - Foreign key constraints for data integrity
    - Check constraint to ensure date is not in the future
*/

CREATE TABLE IF NOT EXISTS battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  title text NOT NULL,
  date date NOT NULL,
  location text,
  opponent text,
  result text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraint to ensure date is not in the future
ALTER TABLE battles ADD CONSTRAINT battles_date_check 
  CHECK (date <= CURRENT_DATE);

-- Enable RLS
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all battles"
  ON battles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own battles"
  ON battles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own battles"
  ON battles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own battles"
  ON battles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX battles_user_id_idx ON battles(user_id);
CREATE INDEX battles_game_id_idx ON battles(game_id);
CREATE INDEX battles_date_idx ON battles(date);
CREATE INDEX battles_created_at_idx ON battles(created_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_battles_updated_at 
    BEFORE UPDATE ON battles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
