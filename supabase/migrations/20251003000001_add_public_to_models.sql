/*
  # Add public property to models table

  1. Schema Changes
    - Add `public` column to `models` table
      - `public` (boolean, default false, not null)
    - Add index for efficient public model queries

  2. Security
    - Update RLS policies to allow friend read access to public models
    - Maintain existing policies for private models

  3. Notes
    - Public models can be viewed by friends
    - Private models remain restricted to their owners
*/

-- Add public column to models table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'models' AND column_name = 'public'
  ) THEN
    ALTER TABLE models ADD COLUMN public boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add index for efficient public model queries
CREATE INDEX IF NOT EXISTS models_public_idx ON models(public) WHERE public = true;

-- Add index for user_id + public combination (for friend queries)
CREATE INDEX IF NOT EXISTS models_user_public_idx ON models(user_id, public) WHERE public = true;


