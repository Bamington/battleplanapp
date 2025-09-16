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
      battles: {
        Row: {
          battle_name: string | null
          battle_notes: string | null
          created_at: string
          date_played: string | null
          event_id: string | null
          game_name: string | null
          game_uid: string | null
          id: number
          image_url: string | null
          location: string | null
          opp_id: string[] | null
          opp_name: string | null
          result: string | null
          user_id: string | null
        }
        Insert: {
          battle_name?: string | null
          battle_notes?: string | null
          created_at?: string
          date_played?: string | null
          event_id?: string | null
          game_name?: string | null
          game_uid?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          opp_id?: string[] | null
          opp_name?: string | null
          result?: string | null
          user_id?: string | null
        }
        Update: {
          battle_name?: string | null
          battle_notes?: string | null
          created_at?: string
          date_played?: string | null
          event_id?: string | null
          game_name?: string | null
          game_uid?: string | null
          id?: number
          image_url?: string | null
          location?: string | null
          opp_id?: string[] | null
          opp_name?: string | null
          result?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_dates: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          location_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          location_id: string
        }
        Update: {
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
      events: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      boxes: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          image_url: string | null
          name: string
          public: boolean | null
          purchase_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          public?: boolean | null
          purchase_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          public?: boolean | null
          purchase_date?: string | null
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
      games: {
        Row: {
          created_at: string | null
          created_by: string | null
          icon: string | null
          id: string
          image: string | null
          manufacturer_id: string | null
          name: string
          supported: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          manufacturer_id?: string | null
          name: string
          supported?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          icon?: string | null
          id?: string
          image?: string | null
          manufacturer_id?: string | null
          name?: string
          supported?: boolean | null
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
      locations: {
        Row: {
          address: string
          admins: string[] | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          tables: number
        }
        Insert: {
          address: string
          admins?: string[] | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          tables?: number
        }
        Update: {
          address?: string
          admins?: string[] | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
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
      models: {
        Row: {
          box_id: string | null
          count: number | null
          created_at: string | null
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
          share_name: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          box_id?: string | null
          count?: number | null
          created_at?: string | null
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
          share_name?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          box_id?: string | null
          count?: number | null
          created_at?: string | null
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
      model_images: {
        Row: {
          id: string
          model_id: string
          image_url: string
          display_order: number
          is_primary: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          model_id: string
          image_url: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          model_id?: string
          image_url?: string
          display_order?: number
          is_primary?: boolean
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_images_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      opponents: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          opp_name: string | null
          opp_rel_uuid: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          opp_name?: string | null
          opp_rel_uuid?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
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
          ver_notes: string | null
          ver_number: number | null
          ver_title: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ver_notes?: string | null
          ver_number?: number | null
          ver_title?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ver_notes?: string | null
          ver_number?: number | null
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
        }
        Insert: {
          created_at?: string
          id?: number
          item_name?: string | null
          user_uid?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          item_name?: string | null
          user_uid?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_user: {
        Args: { p_user_id: string }
        Returns: boolean
      }
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
