-- Fix RLS policies for battle-images bucket
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own battle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view battle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own battle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own battle images" ON storage.objects;

-- Create more permissive policies for battle-images bucket
-- Allow any authenticated user to upload to battle-images bucket
CREATE POLICY "Allow authenticated uploads to battle-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'battle-images' AND
    auth.role() = 'authenticated'
  );

-- Allow any authenticated user to view battle images
CREATE POLICY "Allow authenticated view of battle-images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'battle-images' AND
    auth.role() = 'authenticated'
  );

-- Allow any authenticated user to update battle images
CREATE POLICY "Allow authenticated updates to battle-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'battle-images' AND
    auth.role() = 'authenticated'
  );

-- Allow any authenticated user to delete battle images
CREATE POLICY "Allow authenticated deletes from battle-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'battle-images' AND
    auth.role() = 'authenticated'
  );
