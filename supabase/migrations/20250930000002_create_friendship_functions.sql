-- Function to get all accepted friends for a user
CREATE OR REPLACE FUNCTION public.get_friends(p_user_id uuid)
RETURNS TABLE (
  friend_user_id uuid,
  friend_email text,
  friend_name text,
  friendship_id uuid,
  friendship_created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END as friend_user_id,
    u.email as friend_email,
    u.user_name_public as friend_name,
    f.id as friendship_id,
    f.created_at as friendship_created_at
  FROM public.friendships f
  JOIN public.users u ON (
    CASE
      WHEN f.user_id = p_user_id THEN f.friend_id
      ELSE f.user_id
    END = u.id
  )
  WHERE
    (f.user_id = p_user_id OR f.friend_id = p_user_id)
    AND f.status = 'accepted'
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests (incoming and outgoing)
CREATE OR REPLACE FUNCTION public.get_pending_requests(p_user_id uuid)
RETURNS TABLE (
  request_id uuid,
  requester_id uuid,
  requester_email text,
  requester_name text,
  recipient_id uuid,
  direction text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id as request_id,
    f.user_id as requester_id,
    u.email as requester_email,
    u.user_name_public as requester_name,
    f.friend_id as recipient_id,
    CASE
      WHEN f.friend_id = p_user_id THEN 'incoming'
      ELSE 'outgoing'
    END as direction,
    f.created_at
  FROM public.friendships f
  JOIN public.users u ON f.user_id = u.id
  WHERE
    (f.user_id = p_user_id OR f.friend_id = p_user_id)
    AND f.status = 'pending'
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check friendship status between two users
CREATE OR REPLACE FUNCTION public.check_friendship_status(p_user_id uuid, p_friend_id uuid)
RETURNS TABLE (
  status text,
  friendship_id uuid,
  requester_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.status,
    f.id as friendship_id,
    f.user_id as requester_id
  FROM public.friendships f
  WHERE
    (f.user_id = p_user_id AND f.friend_id = p_friend_id)
    OR (f.user_id = p_friend_id AND f.friend_id = p_user_id)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get count of shared content for a user
CREATE OR REPLACE FUNCTION public.get_shared_content_count(p_user_id uuid)
RETURNS TABLE (
  models_shared_with_me bigint,
  boxes_shared_with_me bigint,
  battles_shared_with_me bigint,
  bookings_shared_with_me bigint,
  models_i_shared bigint,
  boxes_i_shared bigint,
  battles_i_shared bigint,
  bookings_i_shared bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.shared_models WHERE shared_with_user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())) as models_shared_with_me,
    (SELECT COUNT(*) FROM public.shared_boxes WHERE shared_with_user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())) as boxes_shared_with_me,
    (SELECT COUNT(*) FROM public.shared_battles WHERE shared_with_user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())) as battles_shared_with_me,
    (SELECT COUNT(*) FROM public.shared_bookings WHERE shared_with_user_id = p_user_id AND (expires_at IS NULL OR expires_at > now())) as bookings_shared_with_me,
    (SELECT COUNT(*) FROM public.shared_models WHERE owner_id = p_user_id) as models_i_shared,
    (SELECT COUNT(*) FROM public.shared_boxes WHERE owner_id = p_user_id) as boxes_i_shared,
    (SELECT COUNT(*) FROM public.shared_battles WHERE owner_id = p_user_id) as battles_i_shared,
    (SELECT COUNT(*) FROM public.shared_bookings WHERE owner_id = p_user_id) as bookings_i_shared;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users are friends (accepted friendship)
CREATE OR REPLACE FUNCTION public.are_friends(p_user_id uuid, p_friend_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.friendships f
    WHERE
      ((f.user_id = p_user_id AND f.friend_id = p_friend_id)
       OR (f.user_id = p_friend_id AND f.friend_id = p_user_id))
      AND f.status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely send friend request (prevents duplicates and checks for existing relationships)
CREATE OR REPLACE FUNCTION public.send_friend_request(p_friend_id uuid)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_existing_friendship_id uuid;
  v_new_friendship_id uuid;
BEGIN
  v_user_id := auth.uid();

  -- Check if user is trying to friend themselves
  IF v_user_id = p_friend_id THEN
    RAISE EXCEPTION 'Cannot send friend request to yourself';
  END IF;

  -- Check if friendship already exists in either direction
  SELECT id INTO v_existing_friendship_id
  FROM public.friendships
  WHERE
    (user_id = v_user_id AND friend_id = p_friend_id)
    OR (user_id = p_friend_id AND friend_id = v_user_id);

  -- If friendship exists, return existing ID or error based on status
  IF v_existing_friendship_id IS NOT NULL THEN
    RETURN v_existing_friendship_id;
  END IF;

  -- Create new friendship request
  INSERT INTO public.friendships (user_id, friend_id, status)
  VALUES (v_user_id, p_friend_id, 'pending')
  RETURNING id INTO v_new_friendship_id;

  RETURN v_new_friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_friends(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_friendship_status(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_content_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.are_friends(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid) TO authenticated;