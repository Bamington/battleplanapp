-- Add store email field to locations table for booking notifications
ALTER TABLE locations ADD COLUMN IF NOT EXISTS store_email text;

-- Add comment to document the field purpose
COMMENT ON COLUMN locations.store_email IS 'Email address to notify when bookings are made at this location';

-- Create index for efficient email lookups
CREATE INDEX IF NOT EXISTS idx_locations_store_email ON locations(store_email) WHERE store_email IS NOT NULL;