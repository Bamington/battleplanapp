/*
  # Add published column to version table

  1. Schema Changes
    - Add `published` boolean column to version table
    - Set default value to true for existing versions
    - Add NOT NULL constraint after setting defaults

  2. Purpose
    - Allow versions to be saved as drafts without being published
    - Only published versions should be considered as the "current version"
    - Admins can work on version notes before making them live
*/

-- Add published column with default true for existing records
ALTER TABLE version ADD COLUMN published boolean DEFAULT true;

-- Update any existing NULL values to true (shouldn't be any, but just in case)
UPDATE version SET published = true WHERE published IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE version ALTER COLUMN published SET NOT NULL;

-- Add index for better query performance when filtering by published status
CREATE INDEX IF NOT EXISTS idx_version_published ON version(published);

-- Add index for querying published versions by creation date
CREATE INDEX IF NOT EXISTS idx_version_published_created_at ON version(published, created_at DESC);

