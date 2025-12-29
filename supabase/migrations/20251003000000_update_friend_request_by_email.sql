/*
  # Update Friend Request to Use Email (Privacy-First)

  1. New Function
    - Create `send_friend_request_by_email(p_email text)` function
    - Function looks up user by email (case-insensitive)
    - Returns generic success without revealing if user exists
    - If user exists, creates friendship request; if not, silently succeeds

  2. Privacy Features
    - No user search or discovery functionality
    - Generic success response regardless of user existence
    - Prevents enumeration attacks
*/

-- Function to send friend request by email (privacy-preserving)
CREATE OR REPLACE FUNCTION public.send_friend_request_by_email(p_email text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_current_user_id uuid;
  v_existing_friendship_id uuid;
  v_new_friendship_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Check if user is trying to friend themselves
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'You must be logged in to send friend requests');
  END IF;

  -- Look up user by email (case-insensitive)
  SELECT id INTO v_user_id
  FROM public.users
  WHERE LOWER(email) = LOWER(p_email)
  AND id != v_current_user_id;

  -- If user doesn't exist, return generic success (don't reveal existence)
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'If a user with that email exists, they will receive your friend request');
  END IF;

  -- Check if friendship already exists in either direction
  SELECT id INTO v_existing_friendship_id
  FROM public.friendships
  WHERE
    (user_id = v_current_user_id AND friend_id = v_user_id)
    OR (user_id = v_user_id AND friend_id = v_current_user_id);

  -- If friendship exists, return generic success
  IF v_existing_friendship_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'message', 'If a user with that email exists, they will receive your friend request');
  END IF;

  -- Create new friendship request
  INSERT INTO public.friendships (user_id, friend_id, status)
  VALUES (v_current_user_id, v_user_id, 'pending')
  RETURNING id INTO v_new_friendship_id;

  RETURN jsonb_build_object('success', true, 'message', 'If a user with that email exists, they will receive your friend request');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.send_friend_request_by_email(text) TO authenticated;


