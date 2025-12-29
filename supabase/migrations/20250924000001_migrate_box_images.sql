-- Migrate all existing box images from image_url to box_images junction table
-- This migration moves legacy collection images to the new multi-image system

-- Create a function to migrate box images
CREATE OR REPLACE FUNCTION migrate_box_images()
RETURNS void AS $$
DECLARE
  box_record RECORD;
  image_count INTEGER;
BEGIN
  -- Loop through all boxes that have an image_url
  FOR box_record IN
    SELECT id, image_url, user_id
    FROM public.boxes
    WHERE image_url IS NOT NULL
    AND image_url != ''
    AND image_url != 'null'
  LOOP
    -- Check if this box already has images in the junction table
    SELECT COUNT(*) INTO image_count
    FROM public.box_images
    WHERE box_id = box_record.id;

    -- Only migrate if there are no existing images in junction table
    IF image_count = 0 THEN
      -- Insert the legacy image into box_images table
      INSERT INTO public.box_images (
        box_id,
        image_url,
        display_order,
        is_primary,
        user_id,
        created_at
      ) VALUES (
        box_record.id,
        box_record.image_url,
        0,  -- First/primary image gets display_order 0
        true,  -- Set as primary image
        box_record.user_id,
        NOW()
      );

      -- Clear the legacy image_url field
      UPDATE public.boxes
      SET image_url = NULL
      WHERE id = box_record.id;

      -- Log the migration
      RAISE NOTICE 'Migrated image for box ID %: %', box_record.id, box_record.image_url;
    ELSE
      RAISE NOTICE 'Skipping box ID % - already has % images in junction table', box_record.id, image_count;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_box_images();

-- Drop the temporary function
DROP FUNCTION migrate_box_images();

-- Add a comment to track when this migration was run
COMMENT ON TABLE public.box_images IS 'Migration completed: All legacy box images moved from boxes.image_url to box_images junction table';