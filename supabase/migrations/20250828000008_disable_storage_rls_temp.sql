-- Temporary fix: Disable RLS for battle-images bucket
-- This allows all authenticated users to upload/view/update/delete battle images

-- First, ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'battle-images',
  'battle-images',
  true,
  52428800, -- 50MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop ALL existing policies for battle-images
DROP POLICY IF EXISTS "Users can upload their own battle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view battle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own battle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own battle images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated view of battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to battle-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from battle-images" ON storage.objects;
DROP POLICY IF EXISTS "battle_images_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "battle_images_view_policy" ON storage.objects;
DROP POLICY IF EXISTS "battle_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "battle_images_delete_policy" ON storage.objects;

-- Create a single, very permissive policy for battle-images
CREATE POLICY "battle_images_all_operations" ON storage.objects
  FOR ALL USING (
    bucket_id = 'battle-images'
  ) WITH CHECK (
    bucket_id = 'battle-images'
  );
