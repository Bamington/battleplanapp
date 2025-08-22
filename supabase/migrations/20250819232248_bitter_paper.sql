/*
  # Fix Storage Bucket RLS Policies

  1. Storage Policy Updates
    - Update location-assets bucket policies to allow admin uploads
    - Update game-assets bucket policies to allow admin uploads  
    - Update model-images bucket policies to allow authenticated user uploads
    - Fix RLS policy conditions to properly check admin status

  2. Security
    - Maintain public read access for all buckets
    - Allow admin users to upload/manage location and game assets
    - Allow authenticated users to upload model images
*/

-- Fix location-assets bucket policies
DROP POLICY IF EXISTS "Allow authenticated users to upload location assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update location assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete location assets" ON storage.objects;

CREATE POLICY "Allow admin users to upload location assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'location-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Allow admin users to update location assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'location-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Allow admin users to delete location assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'location-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fix game-assets bucket policies
DROP POLICY IF EXISTS "Allow authenticated users to upload game assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update game assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete game assets" ON storage.objects;

CREATE POLICY "Allow admin users to upload game assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'game-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Allow admin users to update game assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'game-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Allow admin users to delete game assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'game-assets' AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fix model-images bucket policies to allow authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to upload model images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update model images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete model images" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload model images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'model-images');

CREATE POLICY "Allow authenticated users to update model images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'model-images');

CREATE POLICY "Allow authenticated users to delete model images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'model-images');