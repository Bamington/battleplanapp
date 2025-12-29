/*
  # Fix WebP and unusual image format support for ALL storage buckets

  Problem:
    - Some buckets may not have webp support
    - .mp.jpg files are getting 400 errors due to MIME type detection issues
    - Inconsistent allowed_mime_types across buckets

  Solution:
    - Update ALL image storage buckets to support common image formats
    - Add support for additional MIME types that might be detected for unusual extensions
*/

-- Update model-images bucket
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/jfif',
    'application/octet-stream'  -- Fallback for unrecognized image files
  ],
  file_size_limit = 52428800 -- 50MB
WHERE id = 'model-images';

-- Update battle-images bucket
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/jfif',
    'application/octet-stream'
  ],
  file_size_limit = 52428800 -- 50MB
WHERE id = 'battle-images';

-- Update game-assets bucket
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/jfif',
    'application/octet-stream'
  ],
  file_size_limit = 52428800 -- 50MB
WHERE id = 'game-assets';

-- Update location-assets bucket
UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/jfif',
    'application/octet-stream'
  ],
  file_size_limit = 52428800 -- 50MB
WHERE id = 'location-assets';

-- Create any missing buckets with proper configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('model-images', 'model-images', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'application/octet-stream']),
  ('battle-images', 'battle-images', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'application/octet-stream']),
  ('game-assets', 'game-assets', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/jfif', 'application/octet-stream']),
  ('location-assets', 'location-assets', true, 52428800, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif', 'application/octet-stream'])
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  file_size_limit = EXCLUDED.file_size_limit,
  public = EXCLUDED.public;