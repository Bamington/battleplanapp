/*
  # Create storage bucket for game assets

  1. Storage
    - Create `game-assets` bucket for storing game images and icons
    - Enable public access for reading assets
    - Set up RLS policies for authenticated users to upload

  2. Security
    - Public read access for all users
    - Authenticated users can upload assets
    - File size limit and type restrictions
*/

-- Create the storage bucket for game assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'game-assets',
  'game-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to game assets
CREATE POLICY "Public read access for game assets"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'game-assets');

-- Allow authenticated users to upload game assets
CREATE POLICY "Authenticated users can upload game assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'game-assets');

-- Allow authenticated users to update game assets
CREATE POLICY "Authenticated users can update game assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'game-assets');

-- Allow authenticated users to delete game assets
CREATE POLICY "Authenticated users can delete game assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'game-assets');