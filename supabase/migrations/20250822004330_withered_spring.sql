/*
  # Add Location Admin Delete Booking Policy

  1. Security
    - Add policy for location admins to delete bookings at their locations
    - Uses existing is_admin_user function to check if user is admin
    - Adds location-specific admin check using array contains operator

  2. Changes
    - New DELETE policy: "Location admins can delete bookings at their locations"
    - Allows deletion if user is either:
      - A full admin (existing behavior)
      - A location admin for the specific location of the booking
*/

-- Add policy for location admins to delete bookings at their locations
CREATE POLICY "Location admins can delete bookings at their locations"
  ON bookings
  FOR DELETE
  TO authenticated
  USING (
    -- Allow if user is a full admin
    is_admin_user(auth.uid()) 
    OR 
    -- Allow if user is admin of the location where this booking is made
    EXISTS (
      SELECT 1 
      FROM locations 
      WHERE locations.id = bookings.location_id 
      AND auth.uid() = ANY(locations.admins)
    )
  );