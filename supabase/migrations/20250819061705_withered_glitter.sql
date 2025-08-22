/*
  # Update Game Assets from Supabase Storage

  This migration automatically matches files in the 'game-assets' bucket to games in the database
  and updates the 'image' and 'icon' fields with the correct Supabase storage URLs.

  1. File Matching Logic
     - Main image: Exact match with game name
     - Icon image: Game name + ' icon' suffix
  2. URL Generation
     - Uses proper Supabase storage public URL format
     - Handles special characters and spaces in filenames
  3. Updates
     - Sets 'image' field for main game images
     - Sets 'icon' field for game icons
*/

-- First, let's create a function to generate the proper Supabase storage URL
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name text, file_path text)
RETURNS text AS $$
BEGIN
  -- Replace this with your actual Supabase project URL
  RETURN 'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/' || bucket_name || '/' || file_path;
END;
$$ LANGUAGE plpgsql;

-- Update games with matching image files
UPDATE games 
SET image = get_storage_url('game-assets', name || '.png')
WHERE EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'game-assets' 
  AND name = games.name || '.png'
);

-- Also try with .jpg extension for images
UPDATE games 
SET image = get_storage_url('game-assets', name || '.jpg')
WHERE image IS NULL 
AND EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'game-assets' 
  AND name = games.name || '.jpg'
);

-- Also try with .jpeg extension for images
UPDATE games 
SET image = get_storage_url('game-assets', name || '.jpeg')
WHERE image IS NULL 
AND EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'game-assets' 
  AND name = games.name || '.jpeg'
);

-- Update games with matching icon files (name + ' icon')
UPDATE games 
SET icon = get_storage_url('game-assets', name || ' icon.png')
WHERE EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'game-assets' 
  AND name = games.name || ' icon.png'
);

-- Also try with .jpg extension for icons
UPDATE games 
SET icon = get_storage_url('game-assets', name || ' icon.jpg')
WHERE icon IS NULL 
AND EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'game-assets' 
  AND name = games.name || ' icon.jpg'
);

-- Also try with .jpeg extension for icons
UPDATE games 
SET icon = get_storage_url('game-assets', name || ' icon.jpeg')
WHERE icon IS NULL 
AND EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'game-assets' 
  AND name = games.name || ' icon.jpeg'
);

-- Clean up the helper function
DROP FUNCTION get_storage_url(text, text);

-- Show results
SELECT 
  name,
  CASE WHEN image IS NOT NULL THEN 'Found' ELSE 'Missing' END as image_status,
  CASE WHEN icon IS NOT NULL THEN 'Found' ELSE 'Missing' END as icon_status,
  image,
  icon
FROM games 
ORDER BY name;