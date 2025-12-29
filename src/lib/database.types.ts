export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      battle_images: {
        Row: {
          battle_id: number
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          user_id: string
        }
        Insert: {
          battle_id: number
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          user_id: string
        }
        Update: {
          battle_id?: number
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battle_images_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          battle_name: string | null
          battle_notes: string | null
          campaign_id: string | null
          created_at: string
          custom_game: string | null
          date_played: string | null
          game_name: string | null
          game_uid: string | null
          id: number
          image_url: string | null
          location: string | null
          opp_id: string[] | null
          opp_name: string | null
          opponent_id: number | null
          result: string | null
          user_id: string | null
        }
        Insert: {
          battle_name?: string | null
          battle_notes?: string | null
          campaign_id?: string | null
          created_at?: string
          custom_game?: string | null
          date_played?: string | null
          game_name?: string | null
          game_uid?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          opp_id?: string[] | null
          opp_name?: string | null
          opponent_id?: number | null
          result?: string | null
          user_id?: string | null
        }
        Update: {
          battle_name?: string | null
          battle_notes?: string | null
          campaign_id?: string | null
          created_at?: string
          custom_game?: string | null
          date_played?: string | null
          game_name?: string | null
          game_uid?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          opp_id?: string[] | null
          opp_name?: string | null
          opponent_id?: number | null
          result?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battles_opponent_id_fkey"
            columns: ["opponent_id"]
            isOneToOne: false
            referencedRelation: "opponents"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          blocked_tables: number | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          location_id: string
        }
        Insert: {
          blocked_tables?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          location_id: string
        }
        Update: {
          blocked_tables?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_dates_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string | null
          date: string
          game_id: string | null
          id: string
          location_id: string
          timeslot_id: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          game_id?: string | null
          id?: string
          location_id: string
          timeslot_id: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          game_id?: string | null
          id?: string
          location_id?: string
          timeslot_id?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_timeslot_id_fkey"
            columns: ["timeslot_id"]
            isOneToOne: false
            referencedRelation: "timeslots"
            referencedColumns: ["id"]
          },
        ]
      }
      box_images: {
        Row: {
          box_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          user_id: string
        }
        Insert: {
          box_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          user_id: string
        }
        Update: {
          box_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "box_images_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes: {
        Row: {
          created_at: string | null
          custom_game: string | null
          game_id: string | null
          id: string
          image_url: string | null
          includes_string: string | null
          name: string
          public: boolean | null
          purchase_date: string | null
          show_carousel: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_game?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          includes_string?: string | null
          name: string
          public?: boolean | null
          purchase_date?: string | null
          show_carousel?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_game?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          includes_string?: string | null
          name?: string
          public?: boolean | null
          purchase_date?: string | null
          show_carousel?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boxes_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes_staging: {
        Row: {
          custom_game: string | null
          game_id: string | null
          includes_string: string | null
          name: string | null
          purchase_date: string | null
          user_id: string | null
        }
        Insert: {
          custom_game?: string | null
          game_id?: string | null
          includes_string?: string | null
          name?: string | null
          purchase_date?: string | null
          user_id?: string | null
        }
        Update: {
          custom_game?: string | null
          game_id?: string | null
          includes_string?: string | null
          name?: string | null
          purchase_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string | null
          created_by: string | null
          default_theme: string | null
          icon: string | null
          id: string
          image: string | null
          manufacturer_id: string | null
          name: string
          supported: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          default_theme?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          manufacturer_id?: string | null
          name: string
          supported?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          default_theme?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          manufacturer_id?: string | null
          name?: string
          supported?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string | null
          description: string | null
          game_id: string | null
          id: string
          name: string
          points_limit: number | null
          points_total: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          game_id?: string | null
          id?: string
          name: string
          points_limit?: number | null
          points_total?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          game_id?: string | null
          id?: string
          name?: string
          points_limit?: number | null
          points_total?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          admins: string[] | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          store_email: string | null
          tables: number
        }
        Insert: {
          address: string
          admins?: string[] | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          store_email?: string | null
          tables?: number
        }
        Update: {
          address?: string
          admins?: string[] | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          store_email?: string | null
          tables?: number
        }
        Relationships: []
      }
      manufacturers: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      model_boxes: {
        Row: {
          added_at: string | null
          box_id: string
          id: string
          model_id: string
        }
        Insert: {
          added_at?: string | null
          box_id: string
          id?: string
          model_id: string
        }
        Update: {
          added_at?: string | null
          box_id?: string
          id?: string
          model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_boxes_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_boxes_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          is_progress_photo: boolean | null
          model_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          is_progress_photo?: boolean | null
          model_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          is_progress_photo?: boolean | null
          model_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_images_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          box_id: string | null
          count: number | null
          created_at: string | null
          custom_game: string | null
          game_id: string | null
          id: string
          image_url: string | null
          lore_description: string | null
          lore_name: string | null
          name: string
          notes: string | null
          painted_date: string | null
          painting_notes: string | null
          public: boolean | null
          purchase_date: string | null
          share_artist: string | null
          share_content: boolean[] | null
          share_name: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          box_id?: string | null
          count?: number | null
          created_at?: string | null
          custom_game?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          lore_description?: string | null
          lore_name?: string | null
          name: string
          notes?: string | null
          painted_date?: string | null
          painting_notes?: string | null
          public?: boolean | null
          purchase_date?: string | null
          share_artist?: string | null
          share_content?: boolean[] | null
          share_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          box_id?: string | null
          count?: number | null
          created_at?: string | null
          custom_game?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          lore_description?: string | null
          lore_name?: string | null
          name?: string
          notes?: string | null
          painted_date?: string | null
          painting_notes?: string | null
          public?: boolean | null
          purchase_date?: string | null
          share_artist?: string | null
          share_content?: boolean[] | null
          share_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "models_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "models_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      opponents: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          opp_email: string | null
          opp_name: string | null
          opp_rel_uuid: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          opp_email?: string | null
          opp_name?: string | null
          opp_rel_uuid?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          opp_email?: string | null
          opp_name?: string | null
          opp_rel_uuid?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          booking_limit: number | null
          created_at: string
          id: number
          role_name: string | null
          users_assigned: string[] | null
        }
        Insert: {
          booking_limit?: number | null
          created_at?: string
          id?: number
          role_name?: string | null
          users_assigned?: string[] | null
        }
        Update: {
          booking_limit?: number | null
          created_at?: string
          id?: number
          role_name?: string | null
          users_assigned?: string[] | null
        }
        Relationships: []
      }
      shared_battles: {
        Row: {
          battle_id: number
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          permission_level: string
          shared_with_user_id: string | null
        }
        Insert: {
          battle_id: number
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Update: {
          battle_id?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_battles_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_bookings: {
        Row: {
          booking_id: string
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          permission_level: string
          shared_with_user_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_boxes: {
        Row: {
          box_id: string
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          permission_level: string
          shared_with_user_id: string | null
        }
        Insert: {
          box_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Update: {
          box_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_boxes_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_models: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          model_id: string
          owner_id: string
          permission_level: string
          shared_with_user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          model_id: string
          owner_id: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          model_id?: string
          owner_id?: string
          permission_level?: string
          shared_with_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      timeslots: {
        Row: {
          availability: string[] | null
          created_at: string | null
          end_time: string
          id: string
          location_id: string
          name: string
          start_time: string
        }
        Insert: {
          availability?: string[] | null
          created_at?: string | null
          end_time: string
          id?: string
          location_id: string
          name: string
          start_time: string
        }
        Update: {
          availability?: string[] | null
          created_at?: string | null
          end_time?: string
          id?: string
          location_id?: string
          name?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeslots_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_models: {
        Row: {
          created_at: string | null
          id: string
          model_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          model_id: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          model_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_models_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_models_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          cost: number | null
          created_at: string | null
          display_order: number | null
          id: string
          list_id: string
          model_count: number
          name: string
          notes: string | null
          type: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          list_id: string
          model_count?: number
          name: string
          notes?: string | null
          type?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          list_id?: string
          model_count?: number
          name?: string
          notes?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          fav_games: string[] | null
          fav_locations: string[] | null
          id: string
          is_admin: boolean | null
          onboarded: boolean | null
          user_name_public: string | null
          user_roles: string[] | null
        }
        Insert: {
          created_at?: string | null
          email: string
          fav_games?: string[] | null
          fav_locations?: string[] | null
          id: string
          is_admin?: boolean | null
          onboarded?: boolean | null
          user_name_public?: string | null
          user_roles?: string[] | null
        }
        Update: {
          created_at?: string | null
          email?: string
          fav_games?: string[] | null
          fav_locations?: string[] | null
          id?: string
          is_admin?: boolean | null
          onboarded?: boolean | null
          user_name_public?: string | null
          user_roles?: string[] | null
        }
        Relationships: []
      }
      version: {
        Row: {
          created_at: string
          id: number
          published: boolean
          ver_notes: string | null
          ver_number: string
          ver_title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          published?: boolean
          ver_notes?: string | null
          ver_number?: string
          ver_title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          published?: boolean
          ver_notes?: string | null
          ver_number?: string
          ver_title?: string | null
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: number
          item_name: string | null
          user_uid: string | null
          wishlist_category: string[] | null
          wishlist_game: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          item_name?: string | null
          user_uid?: string | null
          wishlist_category?: string[] | null
          wishlist_game?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          item_name?: string | null
          user_uid?: string | null
          wishlist_category?: string[] | null
          wishlist_game?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: boolean
      }
      check_friendship_status: {
        Args: { p_friend_id: string; p_user_id: string }
        Returns: {
          friendship_id: string
          requester_id: string
          status: string
        }[]
      }
      get_friends: {
        Args: { p_user_id: string }
        Returns: {
          friend_email: string
          friend_name: string
          friend_user_id: string
          friendship_created_at: string
          friendship_id: string
        }[]
      }
      get_pending_requests: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          direction: string
          recipient_id: string
          request_id: string
          requester_email: string
          requester_id: string
          requester_name: string
        }[]
      }
      get_shared_content_count: {
        Args: { p_user_id: string }
        Returns: {
          battles_i_shared: number
          battles_shared_with_me: number
          bookings_i_shared: number
          bookings_shared_with_me: number
          boxes_i_shared: number
          boxes_shared_with_me: number
          models_i_shared: number
          models_shared_with_me: number
        }[]
      }
      is_admin_user: { Args: { p_user_id: string }; Returns: boolean }
      send_friend_request: { Args: { p_friend_id: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
