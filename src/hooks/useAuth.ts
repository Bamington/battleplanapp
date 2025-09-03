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
  user_roles: string[] | null
}

// Cache for user roles and admin status
let userRolesCache: { [userId: string]: { 
  isLocationAdmin: boolean
  isBetaTester: boolean
  cacheTime: number 
}} = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isBetaTester, setIsBetaTester] = useState(false)

  const fetchUserProfile = async (session: any) => {
    console.log('fetchUserProfile called with session:', session ? 'exists' : 'null')
    if (!session?.user) {
      console.log('No session or user, setting user to null')
      setUser(null)
      return
    }

    try {
      const userId = session.user.id
      const cached = userRolesCache[userId]
      const now = Date.now()

      // Fetch user profile from users table
      const { data, error } = await supabase
        .from('users')
        .select('is_admin, user_name_public, onboarded, fav_games, fav_locations, user_roles')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
      }

      let isLocationAdmin = false
      let betaTesterStatus = false

      // Check cache first
      if (cached && now < cached.cacheTime + CACHE_DURATION) {
        isLocationAdmin = cached.isLocationAdmin
        betaTesterStatus = cached.isBetaTester
      } else {
        // Fetch both location admin status and beta tester role in parallel
        const [locationAdminResult, betaTesterResult] = await Promise.all([
          supabase
            .from('locations')
            .select('id')
            .contains('admins', [userId])
            .limit(1),
          supabase
            .from('roles')
            .select('users_assigned')
            .eq('role_name', 'Beta Tester')
            .single()
        ])

        isLocationAdmin = !locationAdminResult.error && locationAdminResult.data && locationAdminResult.data.length > 0
        betaTesterStatus = !betaTesterResult.error && betaTesterResult.data?.users_assigned?.includes(userId) || false

        // Update cache
        userRolesCache[userId] = {
          isLocationAdmin,
          isBetaTester: betaTesterStatus,
          cacheTime: now
        }
      }

      setIsBetaTester(betaTesterStatus)
      setUser({
        ...session.user,
        is_admin: data?.is_admin || false,
        is_location_admin: isLocationAdmin,
        user_name_public: data?.user_name_public || null,
        onboarded: data?.onboarded || false,
        fav_games: data?.fav_games || null,
        fav_locations: data?.fav_locations || null,
        user_roles: data?.user_roles || null,
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

  // Helper function to check if user has a specific role (synchronous check)
  const hasRole = (roleName: string) => {
    // First check the user_roles field (legacy)
    if (user?.user_roles?.includes(roleName)) {
      return true
    }
    
    // For now, return false for roles table check since it requires async
    // This will be handled by the useEffect below
    return false
  }

  // Check if user is a beta tester (synchronous check)
  const isBetaTesterSync = hasRole('Beta Tester')


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
    hasRole,
    isBetaTester: isBetaTester || isBetaTesterSync,
  }
}