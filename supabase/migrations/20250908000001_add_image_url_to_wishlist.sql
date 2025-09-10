/*
  # Add image_url column to wishlist table

  This migration adds an optional image_url column to the wishlist table
  to support storing images for wishlist items that users can select
  from image search suggestions.

  Changes:
  - Add image_url column to wishlist table (nullable)
  - Add comment for the new column
*/

-- Add image_url column to wishlist table
ALTER TABLE public.wishlist 
ADD COLUMN IF NOT EXISTS image_url text;

-- Add comment for the new column
COMMENT ON COLUMN public.wishlist.image_url IS 'Optional URL of an image representing the wishlist item';