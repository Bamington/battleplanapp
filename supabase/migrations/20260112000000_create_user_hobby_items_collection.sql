-- Create user_hobby_items table for tracking user's collection
CREATE TABLE IF NOT EXISTS public.user_hobby_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hobby_item_id INTEGER NOT NULL REFERENCES public.hobby_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, hobby_item_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_hobby_items_user_id ON public.user_hobby_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hobby_items_hobby_item_id ON public.user_hobby_items(hobby_item_id);

-- Enable RLS
ALTER TABLE public.user_hobby_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own collection
CREATE POLICY "Users can view their own collection"
  ON public.user_hobby_items
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add items to their own collection
CREATE POLICY "Users can add to their own collection"
  ON public.user_hobby_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove items from their own collection
CREATE POLICY "Users can remove from their own collection"
  ON public.user_hobby_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.user_hobby_items TO authenticated;
