-- Add box_images junction table for multi-image support in collections
CREATE TABLE public.box_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    box_id uuid NOT NULL REFERENCES public.boxes(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_box_images_box_id ON public.box_images(box_id);
CREATE INDEX idx_box_images_user_id ON public.box_images(user_id);
CREATE INDEX idx_box_images_display_order ON public.box_images(box_id, display_order);
CREATE INDEX idx_box_images_is_primary ON public.box_images(box_id, is_primary);

-- Add RLS policies for box_images
ALTER TABLE public.box_images ENABLE ROW LEVEL SECURITY;

-- Users can only see box images for boxes they own or are public
CREATE POLICY "Users can view box images for their own boxes or public boxes"
ON public.box_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.boxes
    WHERE boxes.id = box_images.box_id
    AND (boxes.user_id = auth.uid() OR boxes.public = true)
  )
);

-- Users can only insert box images for boxes they own
CREATE POLICY "Users can insert box images for their own boxes"
ON public.box_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.boxes
    WHERE boxes.id = box_images.box_id
    AND boxes.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Users can only update box images they created for boxes they own
CREATE POLICY "Users can update their own box images for their own boxes"
ON public.box_images FOR UPDATE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.boxes
    WHERE boxes.id = box_images.box_id
    AND boxes.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.boxes
    WHERE boxes.id = box_images.box_id
    AND boxes.user_id = auth.uid()
  )
);

-- Users can only delete box images they created for boxes they own
CREATE POLICY "Users can delete their own box images for their own boxes"
ON public.box_images FOR DELETE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.boxes
    WHERE boxes.id = box_images.box_id
    AND boxes.user_id = auth.uid()
  )
);

-- Create a function to ensure only one primary image per box
CREATE OR REPLACE FUNCTION public.ensure_single_primary_box_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If this image is being set as primary, unset all other primary images for this box
    IF NEW.is_primary = true THEN
        UPDATE public.box_images
        SET is_primary = false
        WHERE box_id = NEW.box_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single primary image constraint
CREATE TRIGGER trigger_ensure_single_primary_box_image
    BEFORE INSERT OR UPDATE ON public.box_images
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_primary_box_image();