/*
  # Fix WebP support for model-images bucket

  1. Problem
    - model-images bucket was created without allowed_mime_types parameter
    - This causes 400 errors when uploading WebP images
    - battle-images bucket has proper WebP support configured

  2. Solution
    - Update model-images bucket to include WebP in allowed_mime_types
    - Match the configuration used for battle-images bucket
    - Ensure file_size_limit is also properly set

  3. MIME Types Supported
    - image/jpeg
    - image/jpg  
    - image/png
    - image/webp
*/

-- Update model-images bucket to support WebP and set proper file size limit
UPDATE storage.buckets 
SET 
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  file_size_limit = 52428800 -- 50MB in bytes
WHERE id = 'model-images';

-- If the bucket doesn't exist, create it with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'model-images',
  'model-images', 
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit;









