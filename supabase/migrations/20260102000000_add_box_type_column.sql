/*
  # Add collection type to boxes

  - Adds a `type` text column to `boxes` so collections can be tagged as
    "Collection" (default) or "Box"
  - Uses a text column to allow future expansion of collection types
*/

-- Add the column only if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'boxes'
      AND table_schema = 'public'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.boxes
    ADD COLUMN type text NOT NULL DEFAULT 'Collection';
  END IF;
END $$;

-- Backfill any existing rows (in case default doesn't apply to older rows)
UPDATE public.boxes
SET type = 'Collection'
WHERE type IS NULL;

COMMENT ON COLUMN public.boxes.type IS 'Collection type, e.g., Collection or Box';
