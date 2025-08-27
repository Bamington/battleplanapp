import { createClient } from '@supabase/supabase-js'
import { getAuthCallbackUrl } from '../utils/environment'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables missing!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  console.error('Please create a .env file with your Supabase credentials')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Test connection on initialization
if (supabaseUrl && supabaseAnonKey) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase auth error:', error)
    } else {
      console.log('✅ Supabase client initialized successfully')
    }
  })
}