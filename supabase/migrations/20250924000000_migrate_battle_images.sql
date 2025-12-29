-- Migrate all existing battle images from image_url to battle_images junction table
-- This migration moves legacy battle images to the new multi-image system

-- Create a function to migrate battle images
CREATE OR REPLACE FUNCTION migrate_battle_images()
RETURNS void AS $$
DECLARE
  battle_record RECORD;
  image_count INTEGER;
BEGIN
  -- Loop through all battles that have an image_url
  FOR battle_record IN
    SELECT id, image_url, user_id
    FROM public.battles
    WHERE image_url IS NOT NULL
    AND image_url != ''
    AND image_url != 'null'
  LOOP
    -- Check if this battle already has images in the junction table
    SELECT COUNT(*) INTO image_count
    FROM public.battle_images
    WHERE battle_id = battle_record.id;

    -- Only migrate if there are no existing images in junction table
    IF image_count = 0 THEN
      -- Insert the legacy image into battle_images table
      INSERT INTO public.battle_images (
        battle_id,
        image_url,
        display_order,
        is_primary,
        user_id,
        created_at
      ) VALUES (
        battle_record.id,
        battle_record.image_url,
        0,  -- First/primary image gets display_order 0
        true,  -- Set as primary image
        battle_record.user_id,
        NOW()
      );

      -- Clear the legacy image_url field
      UPDATE public.battles
      SET image_url = NULL
      WHERE id = battle_record.id;

      -- Log the migration
      RAISE NOTICE 'Migrated image for battle ID %: %', battle_record.id, battle_record.image_url;
    ELSE
      RAISE NOTICE 'Skipping battle ID % - already has % images in junction table', battle_record.id, image_count;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_battle_images();

-- Drop the temporary function
DROP FUNCTION migrate_battle_images();

-- Add a comment to track when this migration was run
COMMENT ON TABLE public.battle_images IS 'Migration completed: All legacy battle images moved from battles.image_url to battle_images junction table';