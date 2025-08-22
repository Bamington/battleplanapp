import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          is_admin: boolean
          user_name_public: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          is_admin?: boolean
          user_name_public?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_admin?: boolean
          user_name_public?: string | null
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          address: string
          admins: string[]
          tables: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          admins?: string[]
          tables?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          admins?: string[]
          tables?: number
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          location_id: string
          timeslot_id: string
          game_id: string | null
          date: string
          user_id: string
          user_name: string | null
          user_email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          timeslot_id: string
          game_id?: string | null
          date: string
          user_id: string
          user_name?: string | null
          user_email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          timeslot_id?: string
          game_id?: string | null
          date?: string
          user_id?: string
          user_name?: string | null
          user_email?: string | null
          created_at?: string
        }
      }
      timeslots: {
        Row: {
          id: string
          location_id: string
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      blocked_dates: {
        Row: {
          id: string
          location_id: string
          date: string
          number_of_tables: number
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          date: string
          number_of_tables?: number
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          date?: string
          number_of_tables?: number
          created_at?: string
        }
      }
      manufacturers: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      games: {
        Row: {
          id: string
          name: string
          manufacturer_id: string | null
          image: string | null
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          manufacturer_id?: string | null
          image?: string | null
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          manufacturer_id?: string | null
          image?: string | null
          icon?: string | null
          created_at?: string
        }
      }
      boxes: {
        Row: {
          id: string
          name: string
          game_id: string | null
          purchase_date: string | null
          user_id: string | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          game_id?: string | null
          purchase_date?: string | null
          user_id?: string | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          game_id?: string | null
          purchase_date?: string | null
          user_id?: string | null
          image_url?: string | null
          created_at?: string
        }
      }
      models: {
        Row: {
          id: string
          name: string
          box_id: string | null
          game_id: string | null
          status: string | null
          count: number | null
          user_id: string | null
          image_url: string | null
          created_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          name: string
          box_id?: string | null
          game_id?: string | null
          status?: string | null
          count?: number | null
          user_id?: string | null
          image_url?: string | null
          purchase_date?: string | null
          created_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          name?: string
          box_id?: string | null
          game_id?: string | null
          status?: string | null
          count?: number | null
          user_id?: string | null
          image_url?: string | null
          purchase_date?: string | null
          created_at?: string
          notes?: string | null
        }
      }
    }
  }
}