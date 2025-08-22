import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface UserWithAdmin extends User {
  is_admin?: boolean
  is_location_admin?: boolean
  user_name_public?: string | null
}

export function useAuth() {
  const [user, setUser] = useState<UserWithAdmin | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (session: Session | null) => {
    if (!session?.user) {
      setUser(null)
      return
    }

    try {
      // Upsert user profile to ensure it exists
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: session.user.id,
            email: session.user.email || '',
          },
          { onConflict: 'id' }
        )
        .select('is_admin, user_name_public')
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUser(session.user)
        return
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }
}