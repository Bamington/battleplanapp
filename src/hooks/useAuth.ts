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
    if (!session?.user) {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
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