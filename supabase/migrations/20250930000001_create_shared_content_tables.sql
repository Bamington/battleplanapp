-- Create shared_models table
CREATE TABLE IF NOT EXISTS public.shared_models (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,

  -- Ensure unique sharing per model-user pair
  CONSTRAINT unique_model_share UNIQUE (model_id, shared_with_user_id)
);

-- Create shared_boxes table
CREATE TABLE IF NOT EXISTS public.shared_boxes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  box_id uuid NOT NULL REFERENCES public.boxes(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,

  -- Ensure unique sharing per box-user pair
  CONSTRAINT unique_box_share UNIQUE (box_id, shared_with_user_id)
);

-- Create shared_battles table
CREATE TABLE IF NOT EXISTS public.shared_battles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id integer NOT NULL REFERENCES public.battles(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,

  -- Ensure unique sharing per battle-user pair
  CONSTRAINT unique_battle_share UNIQUE (battle_id, shared_with_user_id)
);

-- Create shared_bookings table
CREATE TABLE IF NOT EXISTS public.shared_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz,

  -- Ensure unique sharing per booking-user pair
  CONSTRAINT unique_booking_share UNIQUE (booking_id, shared_with_user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_models_model_id ON public.shared_models(model_id);
CREATE INDEX IF NOT EXISTS idx_shared_models_owner_id ON public.shared_models(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_models_shared_with ON public.shared_models(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_shared_boxes_box_id ON public.shared_boxes(box_id);
CREATE INDEX IF NOT EXISTS idx_shared_boxes_owner_id ON public.shared_boxes(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_boxes_shared_with ON public.shared_boxes(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_shared_battles_battle_id ON public.shared_battles(battle_id);
CREATE INDEX IF NOT EXISTS idx_shared_battles_owner_id ON public.shared_battles(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_battles_shared_with ON public.shared_battles(shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_shared_bookings_booking_id ON public.shared_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_shared_bookings_owner_id ON public.shared_bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_bookings_shared_with ON public.shared_bookings(shared_with_user_id);

-- Enable Row Level Security
ALTER TABLE public.shared_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shared_models

-- Owners can see all shares of their content
CREATE POLICY "Owners can view their model shares"
  ON public.shared_models
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Users can see content shared with them (not expired)
CREATE POLICY "Users can view models shared with them"
  ON public.shared_models
  FOR SELECT
  USING (
    auth.uid() = shared_with_user_id AND
    (expires_at IS NULL OR expires_at > now())
  );

-- Owners can create shares
CREATE POLICY "Owners can share their models"
  ON public.shared_models
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Owners can update their shares
CREATE POLICY "Owners can update their model shares"
  ON public.shared_models
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Owners can delete their shares
CREATE POLICY "Owners can delete their model shares"
  ON public.shared_models
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for shared_boxes (same pattern)

CREATE POLICY "Owners can view their box shares"
  ON public.shared_boxes
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view boxes shared with them"
  ON public.shared_boxes
  FOR SELECT
  USING (
    auth.uid() = shared_with_user_id AND
    (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Owners can share their boxes"
  ON public.shared_boxes
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their box shares"
  ON public.shared_boxes
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their box shares"
  ON public.shared_boxes
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for shared_battles (same pattern)

CREATE POLICY "Owners can view their battle shares"
  ON public.shared_battles
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view battles shared with them"
  ON public.shared_battles
  FOR SELECT
  USING (
    auth.uid() = shared_with_user_id AND
    (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Owners can share their battles"
  ON public.shared_battles
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their battle shares"
  ON public.shared_battles
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their battle shares"
  ON public.shared_battles
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for shared_bookings (same pattern)

CREATE POLICY "Owners can view their booking shares"
  ON public.shared_bookings
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view bookings shared with them"
  ON public.shared_bookings
  FOR SELECT
  USING (
    auth.uid() = shared_with_user_id AND
    (expires_at IS NULL OR expires_at > now())
  );

CREATE POLICY "Owners can share their bookings"
  ON public.shared_bookings
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their booking shares"
  ON public.shared_bookings
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their booking shares"
  ON public.shared_bookings
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Grant permissions
GRANT ALL ON public.shared_models TO authenticated;
GRANT ALL ON public.shared_boxes TO authenticated;
GRANT ALL ON public.shared_battles TO authenticated;
GRANT ALL ON public.shared_bookings TO authenticated;