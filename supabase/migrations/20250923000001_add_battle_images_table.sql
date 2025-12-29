-- Add battle_images junction table for multi-image support in battles
CREATE TABLE public.battle_images (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    battle_id integer NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    display_order integer NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_battle_images_battle_id ON public.battle_images(battle_id);
CREATE INDEX idx_battle_images_user_id ON public.battle_images(user_id);
CREATE INDEX idx_battle_images_display_order ON public.battle_images(battle_id, display_order);
CREATE INDEX idx_battle_images_is_primary ON public.battle_images(battle_id, is_primary);

-- Add RLS policies for battle_images
ALTER TABLE public.battle_images ENABLE ROW LEVEL SECURITY;

-- Users can only see battle images for battles they own
CREATE POLICY "Users can view battle images for their own battles"
ON public.battle_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.battles
    WHERE battles.id = battle_images.battle_id
    AND battles.user_id = auth.uid()
  )
);

-- Users can only insert battle images for battles they own
CREATE POLICY "Users can insert battle images for their own battles"
ON public.battle_images FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.battles
    WHERE battles.id = battle_images.battle_id
    AND battles.user_id = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Users can only update battle images they created for battles they own
CREATE POLICY "Users can update their own battle images for their own battles"
ON public.battle_images FOR UPDATE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.battles
    WHERE battles.id = battle_images.battle_id
    AND battles.user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.battles
    WHERE battles.id = battle_images.battle_id
    AND battles.user_id = auth.uid()
  )
);

-- Users can only delete battle images they created for battles they own
CREATE POLICY "Users can delete their own battle images for their own battles"
ON public.battle_images FOR DELETE
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.battles
    WHERE battles.id = battle_images.battle_id
    AND battles.user_id = auth.uid()
  )
);

-- Create a function to ensure only one primary image per battle
CREATE OR REPLACE FUNCTION public.ensure_single_primary_battle_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If this image is being set as primary, unset all other primary images for this battle
    IF NEW.is_primary = true THEN
        UPDATE public.battle_images
        SET is_primary = false
        WHERE battle_id = NEW.battle_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain single primary image constraint
CREATE TRIGGER trigger_ensure_single_primary_battle_image
    BEFORE INSERT OR UPDATE ON public.battle_images
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_single_primary_battle_image();