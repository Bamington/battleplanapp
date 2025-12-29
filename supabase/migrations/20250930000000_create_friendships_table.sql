-- Create friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Prevent self-friending
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),

  -- Prevent duplicate friendships (unique combination of users regardless of order)
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON public.friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_status ON public.friendships(friend_id, status);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships

-- Users can view friendships where they are either user_id or friend_id
CREATE POLICY "Users can view their own friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Users can create friendship requests (as user_id)
CREATE POLICY "Users can create friend requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update friendships where they are friend_id (to accept/decline)
-- Or where they are user_id (to cancel their own request)
CREATE POLICY "Users can update their friendships"
  ON public.friendships
  FOR UPDATE
  USING (
    auth.uid() = friend_id OR auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = friend_id OR auth.uid() = user_id
  );

-- Users can delete friendships where they are involved (unfriend/remove request)
CREATE POLICY "Users can delete their friendships"
  ON public.friendships
  FOR DELETE
  USING (
    auth.uid() = user_id OR auth.uid() = friend_id
  );

-- Grant permissions
GRANT ALL ON public.friendships TO authenticated;
GRANT SELECT ON public.friendships TO anon;