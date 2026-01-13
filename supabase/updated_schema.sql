

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_list_points"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update the list's points_total when units change
  UPDATE lists
  SET points_total = (
    SELECT COALESCE(SUM(cost), 0)
    FROM units
    WHERE list_id = COALESCE(NEW.list_id, OLD.list_id)
  )
  WHERE id = COALESCE(NEW.list_id, OLD.list_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."calculate_list_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") RETURNS TABLE("status" "text", "friendship_id" "uuid", "requester_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_primary_battle_image"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_single_primary_battle_image"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_primary_box_image"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_single_primary_box_image"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_friends"("p_user_id" "uuid") RETURNS TABLE("friend_user_id" "uuid", "friend_email" "text", "friend_name" "text", "friendship_id" "uuid", "friendship_created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_friends"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") RETURNS TABLE("request_id" "uuid", "requester_id" "uuid", "requester_email" "text", "requester_name" "text", "recipient_id" "uuid", "direction" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_shared_content_count"("p_user_id" "uuid") RETURNS TABLE("models_shared_with_me" bigint, "boxes_shared_with_me" bigint, "battles_shared_with_me" bigint, "bookings_shared_with_me" bigint, "models_i_shared" bigint, "boxes_i_shared" bigint, "battles_i_shared" bigint, "bookings_i_shared" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_shared_content_count"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, user_name_public, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.created_at
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if the user exists and is an admin
  -- This query bypasses RLS because of SECURITY DEFINER
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = p_user_id 
    AND is_admin = true
  );
END;
$$;


ALTER FUNCTION "public"."is_admin_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_campaigns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_campaigns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."battle_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "battle_id" integer NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."battle_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."battle_images" IS 'Migration completed: All legacy battle images moved from battles.image_url to battle_images junction table';



CREATE TABLE IF NOT EXISTS "public"."battles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "battle_name" "text",
    "date_played" "date",
    "opp_name" "text",
    "opp_id" "uuid"[],
    "result" "text",
    "game_name" "text",
    "game_uid" "uuid",
    "user_id" "uuid",
    "image_url" "text",
    "battle_notes" "text",
    "location" "text",
    "custom_game" "text",
    "opponent_id" integer,
    "campaign_id" "uuid"
);


ALTER TABLE "public"."battles" OWNER TO "postgres";


COMMENT ON TABLE "public"."battles" IS 'Battles table - RLS policies restrict users to their own battles using user_id field';



COMMENT ON COLUMN "public"."battles"."opponent_id" IS 'Foreign key reference to opponents table. Replaces direct opp_name storage for better data integrity.';



ALTER TABLE "public"."battles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."battles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."blocked_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "blocked_tables" numeric,
    CONSTRAINT "blocked_dates_future_date_check" CHECK (("date" >= CURRENT_DATE))
);


ALTER TABLE "public"."blocked_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid" NOT NULL,
    "timeslot_id" "uuid" NOT NULL,
    "game_id" "uuid",
    "date" "date" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_email" "text",
    "user_name" "text"
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."box_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "box_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."box_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."box_images" IS 'Migration completed: All legacy box images moved from boxes.image_url to box_images junction table';



CREATE TABLE IF NOT EXISTS "public"."boxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "game_id" "uuid",
    "purchase_date" "date" DEFAULT CURRENT_DATE,
    "user_id" "uuid",
    "image_url" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean,
    "custom_game" "text",
    "includes_string" "text",
    "show_carousel" boolean,
    "type" "text" DEFAULT 'Collection'::"text" NOT NULL
);


ALTER TABLE "public"."boxes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."boxes"."type" IS 'Collection type, e.g., Collection or Box';



CREATE TABLE IF NOT EXISTS "public"."boxes_staging" (
    "user_id" "uuid",
    "name" "text",
    "game_id" "uuid",
    "custom_game" "text",
    "includes_string" "text",
    "purchase_date" "date"
);


ALTER TABLE "public"."boxes_staging" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."campaigns" OWNER TO "postgres";


COMMENT ON TABLE "public"."campaigns" IS 'User-created campaigns that can contain multiple battles';



CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'blocked'::"text"]))),
    CONSTRAINT "no_self_friendship" CHECK (("user_id" <> "friend_id"))
);


ALTER TABLE "public"."friendships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "manufacturer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image" "text",
    "icon" "text",
    "supported" boolean,
    "created_by" "uuid",
    "updated_at" "date",
    "default_theme" "text"
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hobby_items" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text",
    "owner" "uuid",
    "name" "text",
    "swatch" "text",
    "brand" "text"
);


ALTER TABLE "public"."hobby_items" OWNER TO "postgres";


ALTER TABLE "public"."hobby_items" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."hobby_items_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "points_total" integer DEFAULT 0,
    "points_limit" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "icon" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "tables" integer DEFAULT 1 NOT NULL,
    "admins" "uuid"[] DEFAULT ARRAY[]::"uuid"[],
    "store_email" "text",
    CONSTRAINT "locations_tables_check" CHECK (("tables" > 0))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manufacturers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."manufacturers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model_boxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid" NOT NULL,
    "box_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."model_boxes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model_hobby_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid" NOT NULL,
    "hobby_item_id" bigint NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."model_hobby_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."model_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "display_order" integer DEFAULT 0,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "is_progress_photo" boolean
);


ALTER TABLE "public"."model_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "box_id" "uuid",
    "status" "text" DEFAULT 'None'::"text",
    "count" integer DEFAULT 1,
    "user_id" "uuid",
    "image_url" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "game_id" "uuid",
    "purchase_date" "date",
    "notes" "text",
    "painted_date" "date",
    "public" boolean,
    "lore_name" "text",
    "lore_description" "text",
    "painting_notes" "text",
    "custom_game" "text",
    "share_name" "text",
    "share_artist" "text",
    "share_content" boolean[],
    CONSTRAINT "models_count_check" CHECK (("count" > 0)),
    CONSTRAINT "models_status_check" CHECK (("status" = ANY (ARRAY['None'::"text", 'Assembled'::"text", 'Primed'::"text", 'Partially Painted'::"text", 'Painted'::"text"])))
);


ALTER TABLE "public"."models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."opponents" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "opp_name" "text",
    "opp_rel_uuid" "uuid",
    "created_by" "uuid",
    "opp_email" "text"
);


ALTER TABLE "public"."opponents" OWNER TO "postgres";


ALTER TABLE "public"."opponents" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."opponents_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "users_assigned" "uuid"[],
    "role_name" "text",
    "booking_limit" smallint
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."roles"."booking_limit" IS 'How many tables this role can book at any given time.';



ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."shared_battles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "battle_id" integer NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "shared_with_user_id" "uuid",
    "permission_level" "text" DEFAULT 'view'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "shared_battles_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['view'::"text", 'edit'::"text"])))
);


ALTER TABLE "public"."shared_battles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "shared_with_user_id" "uuid",
    "permission_level" "text" DEFAULT 'view'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "shared_bookings_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['view'::"text", 'edit'::"text"])))
);


ALTER TABLE "public"."shared_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_boxes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "box_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "shared_with_user_id" "uuid",
    "permission_level" "text" DEFAULT 'view'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "shared_boxes_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['view'::"text", 'edit'::"text"])))
);


ALTER TABLE "public"."shared_boxes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shared_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "model_id" "uuid" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "shared_with_user_id" "uuid",
    "permission_level" "text" DEFAULT 'view'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    CONSTRAINT "shared_models_permission_level_check" CHECK (("permission_level" = ANY (ARRAY['view'::"text", 'edit'::"text"])))
);


ALTER TABLE "public"."shared_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timeslots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "location_id" "uuid" NOT NULL,
    "availability" "text"[] DEFAULT ARRAY[]::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "timeslots_availability_check" CHECK (("availability" <@ ARRAY['Monday'::"text", 'Tuesday'::"text", 'Wednesday'::"text", 'Thursday'::"text", 'Friday'::"text", 'Saturday'::"text", 'Sunday'::"text"])),
    CONSTRAINT "timeslots_time_order_check" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."timeslots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."unit_models" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "unit_id" "uuid" NOT NULL,
    "model_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."unit_models" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text",
    "model_count" integer DEFAULT 1 NOT NULL,
    "cost" integer DEFAULT 0,
    "notes" "text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."units" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "is_admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_name_public" "text",
    "fav_games" "uuid"[],
    "onboarded" boolean,
    "fav_locations" "uuid"[],
    "user_roles" "uuid"[]
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."version" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ver_notes" "text",
    "ver_title" "text",
    "published" boolean DEFAULT true NOT NULL,
    "ver_number" "text" DEFAULT '1.0.0'::"text" NOT NULL,
    CONSTRAINT "version_ver_number_format" CHECK (("ver_number" ~ '^\d+\.\d+\.\d+$'::"text"))
);


ALTER TABLE "public"."version" OWNER TO "postgres";


COMMENT ON COLUMN "public"."version"."ver_number" IS 'Semantic version number in MAJOR.MINOR.PATCH format (e.g., "1.0.0", "1.2.3")';



ALTER TABLE "public"."version" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."version_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "item_name" "text",
    "user_uid" "uuid" DEFAULT "gen_random_uuid"(),
    "wishlist_category" "text"[],
    "wishlist_game" "uuid"
);


ALTER TABLE "public"."wishlist" OWNER TO "postgres";


COMMENT ON TABLE "public"."wishlist" IS 'User wishlist items for tracking desired purchases';



COMMENT ON COLUMN "public"."wishlist"."item_name" IS 'Name of the item the user wants to purchase';



COMMENT ON COLUMN "public"."wishlist"."user_uid" IS 'ID of the user who owns this wishlist item';



ALTER TABLE "public"."wishlist" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."wishlist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."battle_images"
    ADD CONSTRAINT "battle_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."battles"
    ADD CONSTRAINT "battles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."box_images"
    ADD CONSTRAINT "box_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."boxes"
    ADD CONSTRAINT "boxes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hobby_items"
    ADD CONSTRAINT "hobby_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manufacturers"
    ADD CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_boxes"
    ADD CONSTRAINT "model_boxes_model_id_box_id_key" UNIQUE ("model_id", "box_id");



ALTER TABLE ONLY "public"."model_boxes"
    ADD CONSTRAINT "model_boxes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_hobby_items"
    ADD CONSTRAINT "model_hobby_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."model_images"
    ADD CONSTRAINT "model_images_model_id_image_url_key" UNIQUE ("model_id", "image_url");



ALTER TABLE ONLY "public"."model_images"
    ADD CONSTRAINT "model_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opponents"
    ADD CONSTRAINT "opponents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_battles"
    ADD CONSTRAINT "shared_battles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_bookings"
    ADD CONSTRAINT "shared_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_boxes"
    ADD CONSTRAINT "shared_boxes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_models"
    ADD CONSTRAINT "shared_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timeslots"
    ADD CONSTRAINT "timeslots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shared_battles"
    ADD CONSTRAINT "unique_battle_share" UNIQUE ("battle_id", "shared_with_user_id");



ALTER TABLE ONLY "public"."shared_bookings"
    ADD CONSTRAINT "unique_booking_share" UNIQUE ("booking_id", "shared_with_user_id");



ALTER TABLE ONLY "public"."shared_boxes"
    ADD CONSTRAINT "unique_box_share" UNIQUE ("box_id", "shared_with_user_id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "unique_friendship" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."shared_models"
    ADD CONSTRAINT "unique_model_share" UNIQUE ("model_id", "shared_with_user_id");



ALTER TABLE ONLY "public"."unit_models"
    ADD CONSTRAINT "unit_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."unit_models"
    ADD CONSTRAINT "unit_models_unit_id_model_id_key" UNIQUE ("unit_id", "model_id");



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."version"
    ADD CONSTRAINT "version_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id");



CREATE INDEX "battles_opponent_id_idx" ON "public"."battles" USING "btree" ("opponent_id");



CREATE INDEX "battles_user_id_idx" ON "public"."battles" USING "btree" ("user_id");



CREATE INDEX "blocked_dates_date_idx" ON "public"."blocked_dates" USING "btree" ("date");



CREATE INDEX "blocked_dates_location_date_idx" ON "public"."blocked_dates" USING "btree" ("location_id", "date");



CREATE INDEX "blocked_dates_location_id_idx" ON "public"."blocked_dates" USING "btree" ("location_id");



CREATE INDEX "bookings_date_idx" ON "public"."bookings" USING "btree" ("date");



CREATE INDEX "bookings_location_id_idx" ON "public"."bookings" USING "btree" ("location_id");



CREATE INDEX "bookings_timeslot_id_idx" ON "public"."bookings" USING "btree" ("timeslot_id");



CREATE INDEX "bookings_user_id_idx" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_battle_images_battle_id" ON "public"."battle_images" USING "btree" ("battle_id");



CREATE INDEX "idx_battle_images_display_order" ON "public"."battle_images" USING "btree" ("battle_id", "display_order");



CREATE INDEX "idx_battle_images_is_primary" ON "public"."battle_images" USING "btree" ("battle_id", "is_primary");



CREATE INDEX "idx_battle_images_user_id" ON "public"."battle_images" USING "btree" ("user_id");



CREATE INDEX "idx_battles_campaign_id" ON "public"."battles" USING "btree" ("campaign_id");



CREATE INDEX "idx_box_images_box_id" ON "public"."box_images" USING "btree" ("box_id");



CREATE INDEX "idx_box_images_display_order" ON "public"."box_images" USING "btree" ("box_id", "display_order");



CREATE INDEX "idx_box_images_is_primary" ON "public"."box_images" USING "btree" ("box_id", "is_primary");



CREATE INDEX "idx_box_images_user_id" ON "public"."box_images" USING "btree" ("user_id");



CREATE INDEX "idx_campaigns_created_by" ON "public"."campaigns" USING "btree" ("created_by");



CREATE INDEX "idx_events_start_date" ON "public"."campaigns" USING "btree" ("start_date");



CREATE INDEX "idx_events_user_id" ON "public"."campaigns" USING "btree" ("created_by");



CREATE INDEX "idx_friendships_friend_id" ON "public"."friendships" USING "btree" ("friend_id");



CREATE INDEX "idx_friendships_friend_status" ON "public"."friendships" USING "btree" ("friend_id", "status");



CREATE INDEX "idx_friendships_status" ON "public"."friendships" USING "btree" ("status");



CREATE INDEX "idx_friendships_user_id" ON "public"."friendships" USING "btree" ("user_id");



CREATE INDEX "idx_friendships_user_status" ON "public"."friendships" USING "btree" ("user_id", "status");



CREATE INDEX "idx_games_created_by" ON "public"."games" USING "btree" ("created_by");



CREATE INDEX "idx_games_created_by_supported" ON "public"."games" USING "btree" ("created_by", "supported");



CREATE INDEX "idx_games_supported" ON "public"."games" USING "btree" ("supported");



CREATE INDEX "idx_model_boxes_added_at" ON "public"."model_boxes" USING "btree" ("added_at");



CREATE INDEX "idx_model_boxes_box_id" ON "public"."model_boxes" USING "btree" ("box_id");



CREATE INDEX "idx_model_boxes_model_id" ON "public"."model_boxes" USING "btree" ("model_id");



CREATE INDEX "idx_model_hobby_items_hobby_item_id" ON "public"."model_hobby_items" USING "btree" ("hobby_item_id");



CREATE INDEX "idx_model_hobby_items_model_id" ON "public"."model_hobby_items" USING "btree" ("model_id");



CREATE INDEX "idx_shared_battles_battle_id" ON "public"."shared_battles" USING "btree" ("battle_id");



CREATE INDEX "idx_shared_battles_owner_id" ON "public"."shared_battles" USING "btree" ("owner_id");



CREATE INDEX "idx_shared_battles_shared_with" ON "public"."shared_battles" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_shared_bookings_booking_id" ON "public"."shared_bookings" USING "btree" ("booking_id");



CREATE INDEX "idx_shared_bookings_owner_id" ON "public"."shared_bookings" USING "btree" ("owner_id");



CREATE INDEX "idx_shared_bookings_shared_with" ON "public"."shared_bookings" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_shared_boxes_box_id" ON "public"."shared_boxes" USING "btree" ("box_id");



CREATE INDEX "idx_shared_boxes_owner_id" ON "public"."shared_boxes" USING "btree" ("owner_id");



CREATE INDEX "idx_shared_boxes_shared_with" ON "public"."shared_boxes" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_shared_models_model_id" ON "public"."shared_models" USING "btree" ("model_id");



CREATE INDEX "idx_shared_models_owner_id" ON "public"."shared_models" USING "btree" ("owner_id");



CREATE INDEX "idx_shared_models_shared_with" ON "public"."shared_models" USING "btree" ("shared_with_user_id");



CREATE INDEX "idx_version_published" ON "public"."version" USING "btree" ("published");



CREATE INDEX "idx_version_published_created_at" ON "public"."version" USING "btree" ("published", "created_at" DESC);



CREATE INDEX "lists_created_at_idx" ON "public"."lists" USING "btree" ("created_at");



CREATE INDEX "lists_game_id_idx" ON "public"."lists" USING "btree" ("game_id");



CREATE INDEX "lists_user_id_idx" ON "public"."lists" USING "btree" ("user_id");



CREATE INDEX "locations_admins_idx" ON "public"."locations" USING "gin" ("admins");



CREATE INDEX "opponents_created_by_idx" ON "public"."opponents" USING "btree" ("created_by");



CREATE INDEX "opponents_opp_name_idx" ON "public"."opponents" USING "btree" ("opp_name");



CREATE INDEX "timeslots_availability_idx" ON "public"."timeslots" USING "gin" ("availability");



CREATE INDEX "timeslots_location_id_idx" ON "public"."timeslots" USING "btree" ("location_id");



CREATE UNIQUE INDEX "unique_model_hobby_item" ON "public"."model_hobby_items" USING "btree" ("model_id", "hobby_item_id");



CREATE INDEX "unit_models_model_id_idx" ON "public"."unit_models" USING "btree" ("model_id");



CREATE INDEX "unit_models_unit_id_idx" ON "public"."unit_models" USING "btree" ("unit_id");



CREATE INDEX "units_display_order_idx" ON "public"."units" USING "btree" ("display_order");



CREATE INDEX "units_list_id_idx" ON "public"."units" USING "btree" ("list_id");



CREATE INDEX "wishlist_created_at_idx" ON "public"."wishlist" USING "btree" ("created_at");



CREATE INDEX "wishlist_user_uid_idx" ON "public"."wishlist" USING "btree" ("user_uid");



CREATE OR REPLACE TRIGGER "recalculate_points_on_delete" AFTER DELETE ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_list_points"();



CREATE OR REPLACE TRIGGER "recalculate_points_on_insert" AFTER INSERT ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_list_points"();



CREATE OR REPLACE TRIGGER "recalculate_points_on_update" AFTER UPDATE OF "cost" ON "public"."units" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_list_points"();



CREATE OR REPLACE TRIGGER "set_updated_at_campaigns" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_campaigns"();



CREATE OR REPLACE TRIGGER "trigger_ensure_single_primary_battle_image" BEFORE INSERT OR UPDATE ON "public"."battle_images" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_primary_battle_image"();



CREATE OR REPLACE TRIGGER "trigger_ensure_single_primary_box_image" BEFORE INSERT OR UPDATE ON "public"."box_images" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_primary_box_image"();



CREATE OR REPLACE TRIGGER "update_events_updated_at" BEFORE UPDATE ON "public"."campaigns" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_friendships_updated_at" BEFORE UPDATE ON "public"."friendships" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_lists_updated_at" BEFORE UPDATE ON "public"."lists" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."battle_images"
    ADD CONSTRAINT "battle_images_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battle_images"
    ADD CONSTRAINT "battle_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."battles"
    ADD CONSTRAINT "battles_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."battles"
    ADD CONSTRAINT "battles_opponent_id_fkey" FOREIGN KEY ("opponent_id") REFERENCES "public"."opponents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."battles"
    ADD CONSTRAINT "battles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocked_dates"
    ADD CONSTRAINT "blocked_dates_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_timeslot_id_fkey" FOREIGN KEY ("timeslot_id") REFERENCES "public"."timeslots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."box_images"
    ADD CONSTRAINT "box_images_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."box_images"
    ADD CONSTRAINT "box_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boxes"
    ADD CONSTRAINT "boxes_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."boxes"
    ADD CONSTRAINT "boxes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."campaigns"
    ADD CONSTRAINT "campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lists"
    ADD CONSTRAINT "lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_boxes"
    ADD CONSTRAINT "model_boxes_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_boxes"
    ADD CONSTRAINT "model_boxes_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_hobby_items"
    ADD CONSTRAINT "model_hobby_items_hobby_item_id_fkey" FOREIGN KEY ("hobby_item_id") REFERENCES "public"."hobby_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_hobby_items"
    ADD CONSTRAINT "model_hobby_items_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_images"
    ADD CONSTRAINT "model_images_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."model_images"
    ADD CONSTRAINT "model_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."models"
    ADD CONSTRAINT "models_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_battles"
    ADD CONSTRAINT "shared_battles_battle_id_fkey" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_battles"
    ADD CONSTRAINT "shared_battles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_battles"
    ADD CONSTRAINT "shared_battles_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_bookings"
    ADD CONSTRAINT "shared_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_bookings"
    ADD CONSTRAINT "shared_bookings_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_bookings"
    ADD CONSTRAINT "shared_bookings_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_boxes"
    ADD CONSTRAINT "shared_boxes_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "public"."boxes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_boxes"
    ADD CONSTRAINT "shared_boxes_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_boxes"
    ADD CONSTRAINT "shared_boxes_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_models"
    ADD CONSTRAINT "shared_models_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_models"
    ADD CONSTRAINT "shared_models_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shared_models"
    ADD CONSTRAINT "shared_models_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."timeslots"
    ADD CONSTRAINT "timeslots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_models"
    ADD CONSTRAINT "unit_models_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."unit_models"
    ADD CONSTRAINT "unit_models_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."units"
    ADD CONSTRAINT "units_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins and location admins can manage blocked dates" ON "public"."blocked_dates" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))) OR (EXISTS ( SELECT 1
   FROM "public"."locations"
  WHERE (("locations"."id" = "blocked_dates"."location_id") AND ("auth"."uid"() = ANY ("locations"."admins")))))));



CREATE POLICY "Admins can read all boxes" ON "public"."boxes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Admins can read all users" ON "public"."users" FOR SELECT TO "authenticated" USING ("public"."is_admin_user"("auth"."uid"()));



CREATE POLICY "Admins can update all boxes" ON "public"."boxes" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Admins have full access to model hobby items" ON "public"."model_hobby_items" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Allow admins to delete roles" ON "public"."roles" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Allow admins to insert roles" ON "public"."roles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Allow admins to insert version" ON "public"."version" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Allow admins to update roles" ON "public"."roles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Allow admins to update version" ON "public"."version" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."is_admin" = true)))));



CREATE POLICY "Allow authenticated users to read roles" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public read access to boxes for sharing" ON "public"."boxes" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access to games for sharing" ON "public"."games" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Allow public read access to public model-box relationships" ON "public"."model_boxes" FOR SELECT TO "authenticated", "anon" USING (((EXISTS ( SELECT 1
   FROM "public"."models" "m"
  WHERE (("m"."id" = "model_boxes"."model_id") AND ("m"."public" = true)))) OR (EXISTS ( SELECT 1
   FROM "public"."boxes" "b"
  WHERE (("b"."id" = "model_boxes"."box_id") AND ("b"."public" = true))))));



CREATE POLICY "Allow public read access to shared models" ON "public"."models" FOR SELECT TO "anon" USING (("public" = true));



CREATE POLICY "Allow public read access to version" ON "public"."version" FOR SELECT USING (true);



CREATE POLICY "Anyone can read blocked dates" ON "public"."blocked_dates" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read games" ON "public"."games" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read locations" ON "public"."locations" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read manufacturers" ON "public"."manufacturers" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Anyone can read timeslots" ON "public"."timeslots" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Authenticated users can manage games" ON "public"."games" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage locations" ON "public"."locations" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage manufacturers" ON "public"."manufacturers" TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can manage timeslots" ON "public"."timeslots" TO "authenticated" USING (true);



CREATE POLICY "Location admins can delete bookings at their locations" ON "public"."bookings" FOR DELETE TO "authenticated" USING (("public"."is_admin_user"("auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."locations"
  WHERE (("locations"."id" = "bookings"."location_id") AND ("auth"."uid"() = ANY ("locations"."admins")))))));



CREATE POLICY "Owners can delete their battle shares" ON "public"."shared_battles" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can delete their booking shares" ON "public"."shared_bookings" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can delete their box shares" ON "public"."shared_boxes" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can delete their model shares" ON "public"."shared_models" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can share their battles" ON "public"."shared_battles" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can share their bookings" ON "public"."shared_bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can share their boxes" ON "public"."shared_boxes" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can share their models" ON "public"."shared_models" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can update their battle shares" ON "public"."shared_battles" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can update their booking shares" ON "public"."shared_bookings" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can update their box shares" ON "public"."shared_boxes" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can update their model shares" ON "public"."shared_models" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can view their battle shares" ON "public"."shared_battles" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can view their booking shares" ON "public"."shared_bookings" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can view their box shares" ON "public"."shared_boxes" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Owners can view their model shares" ON "public"."shared_models" FOR SELECT USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Public boxes are viewable by everyone" ON "public"."boxes" FOR SELECT USING (("public" = true));



CREATE POLICY "Public models are viewable by everyone" ON "public"."models" FOR SELECT USING (("public" = true));



CREATE POLICY "Users can add hobby items to their own models" ON "public"."model_hobby_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."models"
  WHERE (("models"."id" = "model_hobby_items"."model_id") AND ("models"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create custom games" ON "public"."games" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND ("supported" = false)));



CREATE POLICY "Users can create events" ON "public"."campaigns" FOR INSERT WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can create friend requests" ON "public"."friendships" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete opponents" ON "public"."opponents" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "created_by") OR ("created_by" IS NULL)));



CREATE POLICY "Users can delete own battles" ON "public"."battles" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own bookings" ON "public"."bookings" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("users"."is_admin" = true))))));



CREATE POLICY "Users can delete own boxes" ON "public"."boxes" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own lists" ON "public"."lists" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own model-box relationships" ON "public"."model_boxes" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."models" "m"
  WHERE (("m"."id" = "model_boxes"."model_id") AND ("m"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."boxes" "b"
  WHERE (("b"."id" = "model_boxes"."box_id") AND ("b"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete own models" ON "public"."models" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their friendships" ON "public"."friendships" FOR DELETE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can delete their own battle images for their own battles" ON "public"."battle_images" FOR DELETE USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."battles"
  WHERE (("battles"."id" = "battle_images"."battle_id") AND ("battles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete their own box images for their own boxes" ON "public"."box_images" FOR DELETE USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."boxes"
  WHERE (("boxes"."id" = "box_images"."box_id") AND ("boxes"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can delete their own campaigns" ON "public"."campaigns" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their own custom games" ON "public"."games" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can delete their own model images" ON "public"."model_images" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own wishlist items" ON "public"."wishlist" FOR DELETE USING (("auth"."uid"() = "user_uid"));



CREATE POLICY "Users can delete unit_models in own lists" ON "public"."unit_models" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."units"
     JOIN "public"."lists" ON (("lists"."id" = "units"."list_id")))
  WHERE (("units"."id" = "unit_models"."unit_id") AND ("lists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete units in own lists" ON "public"."units" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."lists"
  WHERE (("lists"."id" = "units"."list_id") AND ("lists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert battle images for their own battles" ON "public"."battle_images" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."battles"
  WHERE (("battles"."id" = "battle_images"."battle_id") AND ("battles"."user_id" = "auth"."uid"())))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can insert box images for their own boxes" ON "public"."box_images" FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."boxes"
  WHERE (("boxes"."id" = "box_images"."box_id") AND ("boxes"."user_id" = "auth"."uid"())))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can insert opponents" ON "public"."opponents" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") OR ("created_by" IS NULL)));



CREATE POLICY "Users can insert own battles" ON "public"."battles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own bookings" ON "public"."bookings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own boxes" ON "public"."boxes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own data" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert own lists" ON "public"."lists" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own model-box relationships" ON "public"."model_boxes" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."models" "m"
  WHERE (("m"."id" = "model_boxes"."model_id") AND ("m"."user_id" = "auth"."uid"())))) AND (EXISTS ( SELECT 1
   FROM "public"."boxes" "b"
  WHERE (("b"."id" = "model_boxes"."box_id") AND ("b"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can insert own models" ON "public"."models" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own campaigns" ON "public"."campaigns" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can insert their own model images" ON "public"."model_images" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own wishlist items" ON "public"."wishlist" FOR INSERT WITH CHECK (("auth"."uid"() = "user_uid"));



CREATE POLICY "Users can insert unit_models in own lists" ON "public"."unit_models" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."units"
     JOIN "public"."lists" ON (("lists"."id" = "units"."list_id")))
  WHERE (("units"."id" = "unit_models"."unit_id") AND ("lists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert units in own lists" ON "public"."units" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."lists"
  WHERE (("lists"."id" = "units"."list_id") AND ("lists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read all bookings for availability" ON "public"."bookings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read all opponents" ON "public"."opponents" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can read own battles" ON "public"."battles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own boxes" ON "public"."boxes" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own data" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own model-box relationships" ON "public"."model_boxes" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."models" "m"
  WHERE (("m"."id" = "model_boxes"."model_id") AND ("m"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."boxes" "b"
  WHERE (("b"."id" = "model_boxes"."box_id") AND ("b"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can read own models" ON "public"."models" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own opponents" ON "public"."opponents" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can remove hobby items from their own models" ON "public"."model_hobby_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."models"
  WHERE (("models"."id" = "model_hobby_items"."model_id") AND ("models"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update opponents" ON "public"."opponents" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "created_by") OR ("created_by" IS NULL))) WITH CHECK ((("auth"."uid"() = "created_by") OR ("created_by" IS NULL)));



CREATE POLICY "Users can update own battles" ON "public"."battles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own bookings" ON "public"."bookings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own boxes" ON "public"."boxes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own data or admins can update any user" ON "public"."users" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."users" "admin_check"
  WHERE (("admin_check"."id" = "auth"."uid"()) AND ("admin_check"."is_admin" = true)))))) WITH CHECK ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM "public"."users" "admin_check"
  WHERE (("admin_check"."id" = "auth"."uid"()) AND ("admin_check"."is_admin" = true))))));



CREATE POLICY "Users can update own lists" ON "public"."lists" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own models" ON "public"."models" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their friendships" ON "public"."friendships" FOR UPDATE USING ((("auth"."uid"() = "friend_id") OR ("auth"."uid"() = "user_id"))) WITH CHECK ((("auth"."uid"() = "friend_id") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can update their own battle images for their own battles" ON "public"."battle_images" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."battles"
  WHERE (("battles"."id" = "battle_images"."battle_id") AND ("battles"."user_id" = "auth"."uid"())))))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."battles"
  WHERE (("battles"."id" = "battle_images"."battle_id") AND ("battles"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own box images for their own boxes" ON "public"."box_images" FOR UPDATE USING ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."boxes"
  WHERE (("boxes"."id" = "box_images"."box_id") AND ("boxes"."user_id" = "auth"."uid"())))))) WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."boxes"
  WHERE (("boxes"."id" = "box_images"."box_id") AND ("boxes"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can update their own campaigns" ON "public"."campaigns" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own custom games" ON "public"."games" FOR UPDATE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can update their own model images" ON "public"."model_images" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own wishlist items" ON "public"."wishlist" FOR UPDATE USING (("auth"."uid"() = "user_uid")) WITH CHECK (("auth"."uid"() = "user_uid"));



CREATE POLICY "Users can update units in own lists" ON "public"."units" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."lists"
  WHERE (("lists"."id" = "units"."list_id") AND ("lists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view battle images for their own battles" ON "public"."battle_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."battles"
  WHERE (("battles"."id" = "battle_images"."battle_id") AND ("battles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view battles shared with them" ON "public"."shared_battles" FOR SELECT USING ((("auth"."uid"() = "shared_with_user_id") AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Users can view bookings shared with them" ON "public"."shared_bookings" FOR SELECT USING ((("auth"."uid"() = "shared_with_user_id") AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Users can view box images for their own boxes or public boxes" ON "public"."box_images" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."boxes"
  WHERE (("boxes"."id" = "box_images"."box_id") AND (("boxes"."user_id" = "auth"."uid"()) OR ("boxes"."public" = true))))));



CREATE POLICY "Users can view boxes shared with them" ON "public"."shared_boxes" FOR SELECT USING ((("auth"."uid"() = "shared_with_user_id") AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Users can view games" ON "public"."games" FOR SELECT USING ((("supported" = true) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Users can view hobby items on their own models" ON "public"."model_hobby_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."models"
  WHERE (("models"."id" = "model_hobby_items"."model_id") AND ("models"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view models shared with them" ON "public"."shared_models" FOR SELECT USING ((("auth"."uid"() = "shared_with_user_id") AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Users can view own lists" ON "public"."lists" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own battles" ON "public"."battles" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."campaigns"
  WHERE (("campaigns"."id" = "battles"."campaign_id") AND ("campaigns"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Users can view their own campaigns" ON "public"."campaigns" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own friendships" ON "public"."friendships" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() = "friend_id")));



CREATE POLICY "Users can view their own model images" ON "public"."model_images" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wishlist items" ON "public"."wishlist" FOR SELECT USING (("auth"."uid"() = "user_uid"));



CREATE POLICY "Users can view unit_models in own lists" ON "public"."unit_models" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."units"
     JOIN "public"."lists" ON (("lists"."id" = "units"."list_id")))
  WHERE (("units"."id" = "unit_models"."unit_id") AND ("lists"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view units in own lists" ON "public"."units" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."lists"
  WHERE (("lists"."id" = "units"."list_id") AND ("lists"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."battle_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."battles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocked_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."box_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."boxes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hobby_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manufacturers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_boxes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_hobby_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."model_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opponents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_battles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_boxes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shared_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timeslots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."unit_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."units" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."version" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wishlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."are_friends"("p_user_id" "uuid", "p_friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_list_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_list_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_list_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_friendship_status"("p_user_id" "uuid", "p_friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_primary_battle_image"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_primary_battle_image"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_primary_battle_image"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_primary_box_image"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_primary_box_image"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_primary_box_image"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_friends"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_friends"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friends"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_requests"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_shared_content_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_shared_content_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_shared_content_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_campaigns"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_campaigns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_campaigns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."battle_images" TO "anon";
GRANT ALL ON TABLE "public"."battle_images" TO "authenticated";
GRANT ALL ON TABLE "public"."battle_images" TO "service_role";



GRANT ALL ON TABLE "public"."battles" TO "anon";
GRANT ALL ON TABLE "public"."battles" TO "authenticated";
GRANT ALL ON TABLE "public"."battles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."battles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."battles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."battles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."blocked_dates" TO "anon";
GRANT ALL ON TABLE "public"."blocked_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."blocked_dates" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."box_images" TO "anon";
GRANT ALL ON TABLE "public"."box_images" TO "authenticated";
GRANT ALL ON TABLE "public"."box_images" TO "service_role";



GRANT ALL ON TABLE "public"."boxes" TO "anon";
GRANT ALL ON TABLE "public"."boxes" TO "authenticated";
GRANT ALL ON TABLE "public"."boxes" TO "service_role";



GRANT ALL ON TABLE "public"."boxes_staging" TO "anon";
GRANT ALL ON TABLE "public"."boxes_staging" TO "authenticated";
GRANT ALL ON TABLE "public"."boxes_staging" TO "service_role";



GRANT ALL ON TABLE "public"."campaigns" TO "anon";
GRANT ALL ON TABLE "public"."campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."hobby_items" TO "anon";
GRANT ALL ON TABLE "public"."hobby_items" TO "authenticated";
GRANT ALL ON TABLE "public"."hobby_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."hobby_items_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."hobby_items_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."hobby_items_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lists" TO "anon";
GRANT ALL ON TABLE "public"."lists" TO "authenticated";
GRANT ALL ON TABLE "public"."lists" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."manufacturers" TO "anon";
GRANT ALL ON TABLE "public"."manufacturers" TO "authenticated";
GRANT ALL ON TABLE "public"."manufacturers" TO "service_role";



GRANT ALL ON TABLE "public"."model_boxes" TO "anon";
GRANT ALL ON TABLE "public"."model_boxes" TO "authenticated";
GRANT ALL ON TABLE "public"."model_boxes" TO "service_role";



GRANT ALL ON TABLE "public"."model_hobby_items" TO "anon";
GRANT ALL ON TABLE "public"."model_hobby_items" TO "authenticated";
GRANT ALL ON TABLE "public"."model_hobby_items" TO "service_role";



GRANT ALL ON TABLE "public"."model_images" TO "anon";
GRANT ALL ON TABLE "public"."model_images" TO "authenticated";
GRANT ALL ON TABLE "public"."model_images" TO "service_role";



GRANT ALL ON TABLE "public"."models" TO "anon";
GRANT ALL ON TABLE "public"."models" TO "authenticated";
GRANT ALL ON TABLE "public"."models" TO "service_role";



GRANT ALL ON TABLE "public"."opponents" TO "anon";
GRANT ALL ON TABLE "public"."opponents" TO "authenticated";
GRANT ALL ON TABLE "public"."opponents" TO "service_role";



GRANT ALL ON SEQUENCE "public"."opponents_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."opponents_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."opponents_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."shared_battles" TO "anon";
GRANT ALL ON TABLE "public"."shared_battles" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_battles" TO "service_role";



GRANT ALL ON TABLE "public"."shared_bookings" TO "anon";
GRANT ALL ON TABLE "public"."shared_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."shared_boxes" TO "anon";
GRANT ALL ON TABLE "public"."shared_boxes" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_boxes" TO "service_role";



GRANT ALL ON TABLE "public"."shared_models" TO "anon";
GRANT ALL ON TABLE "public"."shared_models" TO "authenticated";
GRANT ALL ON TABLE "public"."shared_models" TO "service_role";



GRANT ALL ON TABLE "public"."timeslots" TO "anon";
GRANT ALL ON TABLE "public"."timeslots" TO "authenticated";
GRANT ALL ON TABLE "public"."timeslots" TO "service_role";



GRANT ALL ON TABLE "public"."unit_models" TO "anon";
GRANT ALL ON TABLE "public"."unit_models" TO "authenticated";
GRANT ALL ON TABLE "public"."unit_models" TO "service_role";



GRANT ALL ON TABLE "public"."units" TO "anon";
GRANT ALL ON TABLE "public"."units" TO "authenticated";
GRANT ALL ON TABLE "public"."units" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."version" TO "anon";
GRANT ALL ON TABLE "public"."version" TO "authenticated";
GRANT ALL ON TABLE "public"."version" TO "service_role";



GRANT ALL ON SEQUENCE "public"."version_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."version_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."version_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist" TO "anon";
GRANT ALL ON TABLE "public"."wishlist" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist" TO "service_role";



GRANT ALL ON SEQUENCE "public"."wishlist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."wishlist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."wishlist_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























