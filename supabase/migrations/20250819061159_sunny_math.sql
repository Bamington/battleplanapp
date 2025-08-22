/*
  # Fix broken game icon URLs

  1. Updates
    - Fix malformed URLs in games.icon column
    - Ensure proper Supabase storage URL format
    - Handle various URL format issues

  2. Changes
    - Replace broken URL patterns with correct Supabase storage format
    - Update any URLs that don't follow the proper structure
*/

-- First, let's see what URLs we currently have (for debugging)
-- You can run this separately to check current state:
-- SELECT id, name, icon FROM games WHERE icon IS NOT NULL;

-- Fix URLs that might have incorrect bucket names or malformed paths
UPDATE games 
SET icon = CASE
  -- Fix URLs with game_assets (underscore) to game-assets (hyphen)
  WHEN icon LIKE '%/game_assets/%' THEN 
    REPLACE(icon, '/game_assets/', '/game-assets/')
  
  -- Fix URLs that might be missing the full Supabase path structure
  WHEN icon LIKE 'https://%.supabase.co/%' AND icon NOT LIKE '%/storage/v1/object/public/%' THEN
    REGEXP_REPLACE(icon, 
      'https://([^.]+)\.supabase\.co/(.+)', 
      'https://\1.supabase.co/storage/v1/object/public/game-assets/\2'
    )
  
  -- Fix relative paths or incomplete URLs
  WHEN icon NOT LIKE 'https://%' AND icon IS NOT NULL AND icon != '' THEN
    'https://dthxptbozocrbvmhwvao.supabase.co/storage/v1/object/public/game-assets/' || icon
  
  -- Keep valid URLs as they are
  ELSE icon
END
WHERE icon IS NOT NULL AND icon != '';

-- Clean up any double slashes that might have been created
UPDATE games 
SET icon = REPLACE(icon, '//', '/')
WHERE icon LIKE '%//%' AND icon NOT LIKE 'https://%';

-- Fix the protocol part if it got broken
UPDATE games 
SET icon = REPLACE(icon, 'https:/', 'https://')
WHERE icon LIKE 'https:/%' AND icon NOT LIKE 'https://%';

-- Remove any trailing spaces or invalid characters
UPDATE games 
SET icon = TRIM(icon)
WHERE icon IS NOT NULL;

-- Set to NULL any URLs that are still clearly broken
UPDATE games 
SET icon = NULL 
WHERE icon IS NOT NULL 
  AND icon != '' 
  AND (
    LENGTH(icon) < 10 
    OR icon NOT LIKE 'https://%'
    OR icon LIKE '%undefined%'
    OR icon LIKE '%null%'
  );