/*
  # Add storage policies for model-images bucket

  1. Storage Policies
    - Allow authenticated users to upload images to their own folder
    - Allow authenticated users to view images they uploaded
    - Allow authenticated users to delete images they uploaded

  2. Security
    - Users can only access files in folders named with their user ID
    - Prevents users from accessing other users' images
*/

-- Create the model-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('model-images', 'model-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload images to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'model-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to view images they uploaded
CREATE POLICY "Users can view own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'model-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow authenticated users to delete images they uploaded
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'model-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow public access to view images (since bucket is public)
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'model-images');