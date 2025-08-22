-- Update game icons from Supabase storage bucket
-- This query matches game names to icon file paths and updates the icon field

-- First, let's see what games we have (for reference)
-- SELECT id, name, icon FROM games ORDER BY name;

-- Update games with matching icons from the game-assets storage bucket
-- You'll need to customize this with the actual file paths from your storage bucket

UPDATE games 
SET icon = CASE 
  WHEN LOWER(name) LIKE '%blood bowl%' THEN 
    'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Blood Bowl Icon.png'
  WHEN LOWER(name) LIKE '%age of fantasy quest%' THEN 
    'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Age of Fantasy Quest Icon.png'
  WHEN LOWER(name) LIKE '%age of fantasy%' AND LOWER(name) NOT LIKE '%quest%' THEN 
    'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Age of Fantasy Icon.png'
  WHEN LOWER(name) LIKE '%aeronautica%' THEN 
    'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Aeronautica Icon.png'
  -- Add more games as needed following this pattern:
  -- WHEN LOWER(name) LIKE '%game name%' THEN 
  --   'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Game Icon.png'
  ELSE icon -- Keep existing icon if no match
END
WHERE icon IS NULL OR icon = ''; -- Only update games that don't already have icons

-- Alternative approach: If you want to see which games would be updated first
-- SELECT 
--   id,
--   name,
--   icon as current_icon,
--   CASE 
--     WHEN LOWER(name) LIKE '%blood bowl%' THEN 
--       'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Blood Bowl Icon.png'
--     WHEN LOWER(name) LIKE '%age of fantasy quest%' THEN 
--       'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Age of Fantasy Quest Icon.png'
--     WHEN LOWER(name) LIKE '%age of fantasy%' AND LOWER(name) NOT LIKE '%quest%' THEN 
--       'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Age of Fantasy Icon.png'
--     WHEN LOWER(name) LIKE '%aeronautica%' THEN 
--       'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/Aeronautica Icon.png'
--     ELSE 'No match found'
--   END as new_icon
-- FROM games
-- ORDER BY name;

-- To get a list of all files in your storage bucket (run this in Supabase dashboard):
-- SELECT name FROM storage.objects WHERE bucket_id = 'game-assets' ORDER BY name;