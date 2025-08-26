import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getAuthCallbackUrl } from '../utils/environment'

interface User {
  id: string
  email: string
  is_admin: boolean
  is_location_admin: boolean
  user_name_public: string | null
  onboarded: boolean | null
  fav_games: string[] | null
  fav_locations: string[] | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (session: any) => {
    console.log('fetchUserProfile called with session:', session ? 'exists' : 'null')
    if (!session?.user) {
      console.log('No session or user, setting user to null')
      setUser(null)
      return
    }

    try {
      // Fetch user profile from users table
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, user_name_public, onboarded, fav_games, fav_locations')
        .eq('id', session.user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
      }

      // Check if user is a location admin
      const { data: locationAdminData, error: locationAdminError } = await supabase
        .from('locations')
        .select('id')
        .contains('admins', [session.user.id])
        .limit(1)

      const isLocationAdmin = !locationAdminError && locationAdminData && locationAdminData.length > 0
      setUser({
        ...session.user,
        is_admin: data?.is_admin || false,
        is_location_admin: isLocationAdmin,
        user_name_public: data?.user_name_public || null,
        onboarded: data?.onboarded || false,
        fav_games: data?.fav_games || null,
        fav_locations: data?.fav_locations || null,
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setUser(session.user)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', { event, session: session ? 'exists' : 'null' })
      fetchUserProfile(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          // Add branding parameters
          hd: '', // Hosted domain (optional)
          prompt: 'select_account', // Always show account selection
        },
        // Add custom branding if available
        ...(import.meta.env.VITE_GOOGLE_CLIENT_ID && {
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        }),
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    try {
      console.log('Calling Supabase auth.signOut()...')
      
      // First check if there's an active session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No active session found, clearing user state directly')
        setUser(null)
        // Clear any remaining auth data from storage
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
        // Also clear any other Supabase-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('supabase.')) {
            localStorage.removeItem(key)
          }
        })
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('supabase.')) {
            sessionStorage.removeItem(key)
          }
        })
        return { error: null }
      }
      
      const { error } = await supabase.auth.signOut()
      console.log('Supabase signOut response:', { error })
      if (error) {
        console.error('Supabase sign out error:', error)
      } else {
        console.log('Supabase signOut successful')
      }
      return { error }
    } catch (err) {
      console.error('Sign out error:', err)
      // If there's an error, still clear the user state
      setUser(null)
      // Clear any remaining auth data from storage
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.removeItem('supabase.auth.token')
      // Also clear any other Supabase-related storage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.')) {
          localStorage.removeItem(key)
        }
      })
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('supabase.')) {
          sessionStorage.removeItem(key)
        }
      })
      return { error: err }
    }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl(),
    })
    return { data, error }
  }

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }

  // Check if user needs to set a new password
  const needsPasswordReset = user && window.location.hash.includes('type=recovery')

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    needsPasswordReset,
  }
}