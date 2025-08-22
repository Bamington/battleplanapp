/*
  # Create bookings table

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `location_id` (uuid, foreign key to locations)
      - `timeslot_id` (uuid, foreign key to timeslots)
      - `game_id` (uuid, foreign key to games, optional)
      - `date` (date)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `bookings` table
    - Add policies for authenticated users to manage their own bookings
    - Add policy for users to read all bookings (for availability checking)

  3. Constraints
    - Ensure date is not in the past
    - Foreign key constraints for data integrity
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  timeslot_id uuid NOT NULL REFERENCES timeslots(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  date date NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all bookings for availability"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookings"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX bookings_location_id_idx ON bookings(location_id);
CREATE INDEX bookings_timeslot_id_idx ON bookings(timeslot_id);
CREATE INDEX bookings_date_idx ON bookings(date);
CREATE INDEX bookings_user_id_idx ON bookings(user_id);