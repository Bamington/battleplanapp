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

// Cache for user profiles to prevent redundant fetches
let userProfileCache: { [userId: string]: {
  profile: any
  cacheTime: number
}} = {}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Global auth state - singleton pattern
let globalAuthState: {
  user: User | null
  loading: boolean
  isBetaTester: boolean
  initialized: boolean
} = {
  user: null,
  loading: true,
  isBetaTester: false,
  initialized: false
}

// Global listeners to notify all hook instances of state changes
let listeners: Set<() => void> = new Set()

const notifyListeners = () => {
  listeners.forEach(callback => callback())
}

// Single auth subscription - only created once
let authSubscription: any = null
let initializationPromise: Promise<void> | null = null

const fetchUserProfile = async (session: any) => {
  console.log('🔍 DEBUG: fetchUserProfile called with session:', session ? 'exists' : 'null')
  if (session) {
    console.log('🔍 DEBUG: Session details:', {
      user_id: session.user?.id,
      email: session.user?.email,
      expires_at: session.expires_at
    })
  }
  
  if (!session?.user) {
    console.log('🔍 DEBUG: No session or user, setting user to null')
    globalAuthState.user = null
    globalAuthState.loading = false
    notifyListeners()
    return
  }

  try {
    const userId = session.user.id
    console.log('🔍 DEBUG: Processing user profile for ID:', userId)
    
    const cached = userRolesCache[userId]
    const cachedProfile = userProfileCache[userId]
    const now = Date.now()

    console.log('🔍 DEBUG: Cache status:', {
      hasCachedProfile: !!cachedProfile,
      hasCachedRoles: !!cached,
      cacheAge: cachedProfile ? now - cachedProfile.cacheTime : 'N/A'
    })

    // Check if we have a cached profile
    let data = null
    let error = null

    if (cachedProfile && now < cachedProfile.cacheTime + CACHE_DURATION) {
      console.log('🔍 DEBUG: Using cached user profile for:', userId)
      data = cachedProfile.profile
    } else {
      console.log('🔍 DEBUG: Fetching fresh user profile for:', userId)
      // Fetch user profile from users table
      const result = await supabase
        .from('users')
        .select('is_admin, user_name_public, onboarded, fav_games, fav_locations, user_roles')
        .eq('id', userId)
        .single()

      data = result.data
      error = result.error

      console.log('🔍 DEBUG: User profile fetch result:', {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message
      })

      if (error && error.code !== 'PGRST116') {
        console.error('❌ DEBUG: Error fetching user profile:', error)
        console.error('❌ Profile error details:', JSON.stringify(error, null, 2))
        // Continue with basic user info even if profile fetch fails
      } else {
        console.log('🔍 DEBUG: Caching user profile...')
        // Cache the profile
        userProfileCache[userId] = {
          profile: data,
          cacheTime: now
        }
      }
    }

    let isLocationAdmin = false
    let betaTesterStatus = false

    console.log('🔍 DEBUG: Checking user roles...')
    // Check cache first
    if (cached && now < cached.cacheTime + CACHE_DURATION) {
      console.log('🔍 DEBUG: Using cached roles for:', userId)
      isLocationAdmin = cached.isLocationAdmin
      betaTesterStatus = cached.isBetaTester
    } else {
      console.log('🔍 DEBUG: Fetching fresh roles for:', userId)
      try {
        // Fetch both location admin status and beta tester role in parallel
        console.log('🔍 DEBUG: Fetching location admin status...')
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

        console.log('🔍 DEBUG: Role fetch results:', {
          locationAdminError: locationAdminResult.error,
          locationAdminData: locationAdminResult.data,
          betaTesterError: betaTesterResult.error,
          betaTesterData: betaTesterResult.data
        })

        isLocationAdmin = !locationAdminResult.error && locationAdminResult.data && locationAdminResult.data.length > 0
        betaTesterStatus = !betaTesterResult.error && betaTesterResult.data?.users_assigned?.includes(userId) || false

        console.log('🔍 DEBUG: Calculated roles:', {
          isLocationAdmin,
          betaTesterStatus
        })

        // Update cache
        userRolesCache[userId] = {
          isLocationAdmin,
          isBetaTester: betaTesterStatus,
          cacheTime: now
        }
        console.log('🔍 DEBUG: Roles cached successfully')
      } catch (roleError) {
        console.error('❌ DEBUG: Error fetching role information:', roleError)
        console.error('❌ Role error details:', JSON.stringify(roleError, null, 2))
        // Continue with default values
      }
    }

    globalAuthState.isBetaTester = betaTesterStatus
    globalAuthState.user = {
      ...session.user,
      is_admin: data?.is_admin || false,
      is_location_admin: isLocationAdmin,
      user_name_public: data?.user_name_public || null,
      onboarded: data?.onboarded || false,
      fav_games: data?.fav_games || null,
      fav_locations: data?.fav_locations || null,
      user_roles: data?.user_roles || null,
    }

    console.log('🔍 DEBUG: Final user state set:', {
      user_id: globalAuthState.user.id,
      email: globalAuthState.user.email,
      is_admin: globalAuthState.user.is_admin,
      is_location_admin: globalAuthState.user.is_location_admin,
      is_beta_tester: globalAuthState.isBetaTester,
      onboarded: globalAuthState.user.onboarded
    })

    notifyListeners()
    console.log('🔍 DEBUG: Listeners notified of user state change')
  } catch (error) {
    console.error('❌ DEBUG: Error fetching user profile:', error)
    console.error('❌ Profile fetch error details:', JSON.stringify(error, null, 2))
    // Fall back to basic session user info
    globalAuthState.user = {
      ...session.user,
      is_admin: false,
      is_location_admin: false,
      user_name_public: null,
      onboarded: true, // Default to true to avoid onboarding modal
      fav_games: null,
      fav_locations: null,
      user_roles: null,
    }
    globalAuthState.loading = false
    notifyListeners()
    console.log('🔍 DEBUG: Fallback user state set due to error')
  }
}

const initializeAuth = async () => {
  if (globalAuthState.initialized) {
    console.log('🔍 DEBUG: Auth already initialized, skipping...')
    return
  }

  console.log('🔍 DEBUG: Initializing auth singleton...')
  globalAuthState.initialized = true

  try {
    console.log('🔍 DEBUG: Getting initial session from Supabase...')
    // Get initial session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ DEBUG: Error getting initial session:', sessionError)
      console.error('❌ Session error details:', JSON.stringify(sessionError, null, 2))
    } else {
      console.log('🔍 DEBUG: Initial session result:', session ? 'Session exists' : 'No session')
      if (session) {
        console.log('🔍 DEBUG: Session user ID:', session.user?.id)
        console.log('🔍 DEBUG: Session expires at:', session.expires_at)
      }
    }
    
    console.log('🔍 DEBUG: Calling fetchUserProfile...')
    await fetchUserProfile(session)
    globalAuthState.loading = false
    console.log('🔍 DEBUG: Auth initialization completed, loading set to false')

    // Listen for auth changes - only create one subscription
    if (!authSubscription) {
      console.log('🔍 DEBUG: Setting up auth state change listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔍 DEBUG: Auth state change detected:', { event, session: session ? 'exists' : 'null' })
        if (session) {
          console.log('🔍 DEBUG: New session user ID:', session.user?.id)
        }
        await fetchUserProfile(session)
        globalAuthState.loading = false
        notifyListeners()
      })
      authSubscription = subscription
      console.log('🔍 DEBUG: Auth state change listener set up successfully')
    }

    notifyListeners()
    console.log('🔍 DEBUG: Auth initialization completed successfully')
  } catch (error) {
    console.error('❌ DEBUG: Error initializing auth:', error)
    console.error('❌ Auth init error details:', JSON.stringify(error, null, 2))
    // Ensure loading state is set to false even on error
    globalAuthState.loading = false
    globalAuthState.initialized = false // Allow retry
    notifyListeners()
  }
}

export function useAuth() {
  const [, forceUpdate] = useState({})

  // Force re-render when global state changes
  const rerender = () => forceUpdate({})

  useEffect(() => {
    console.log('🔍 DEBUG: useAuth hook mounted, adding listener...')
    // Add this instance to listeners
    listeners.add(rerender)
    console.log('🔍 DEBUG: Total listeners now:', listeners.size)

    // Initialize auth if not already done
    if (!initializationPromise) {
      console.log('🔍 DEBUG: Starting auth initialization...')
      initializationPromise = initializeAuth()
    } else {
      console.log('🔍 DEBUG: Auth initialization already in progress...')
    }

    // Add a timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (globalAuthState.loading) {
        console.warn('⚠️ DEBUG: Auth initialization timed out, setting loading to false')
        console.warn('⚠️ DEBUG: Current auth state:', {
          user: globalAuthState.user ? 'exists' : 'null',
          loading: globalAuthState.loading,
          initialized: globalAuthState.initialized
        })
        globalAuthState.loading = false
        notifyListeners()
      }
    }, 10000) // 10 second timeout

    console.log('🔍 DEBUG: useAuth hook setup complete, timeout set for 10 seconds')

    // Cleanup
    return () => {
      console.log('🔍 DEBUG: useAuth hook unmounting, cleaning up...')
      listeners.delete(rerender)
      clearTimeout(timeoutId)
      console.log('🔍 DEBUG: Remaining listeners:', listeners.size)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    console.log('🔍 DEBUG: signIn called with email:', email)
    console.log('🔍 DEBUG: Calling Supabase signInWithPassword...')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    console.log('🔍 DEBUG: signIn result:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code
    })
    
    if (error) {
      console.error('❌ DEBUG: Sign in error:', error)
      console.error('❌ Sign in error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ DEBUG: Sign in successful')
    }
    
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    console.log('🔍 DEBUG: signUp called with email:', email)
    console.log('🔍 DEBUG: Auth callback URL:', getAuthCallbackUrl())
    console.log('🔍 DEBUG: Calling Supabase signUp...')
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getAuthCallbackUrl(),
      },
    })
    
    console.log('🔍 DEBUG: signUp result:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code,
      user: data?.user ? 'exists' : 'null'
    })
    
    if (error) {
      console.error('❌ DEBUG: Sign up error:', error)
      console.error('❌ Sign up error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ DEBUG: Sign up successful')
    }
    
    return { data, error }
  }

  const signInWithGoogle = async () => {
    console.log('🔍 DEBUG: signInWithGoogle called')
    console.log('🔍 DEBUG: Auth callback URL:', getAuthCallbackUrl())
    console.log('🔍 DEBUG: Google client ID available:', !!import.meta.env.VITE_GOOGLE_CLIENT_ID)
    console.log('🔍 DEBUG: Calling Supabase signInWithOAuth...')
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          hd: '',
          prompt: 'select_account',
        },
        ...(import.meta.env.VITE_GOOGLE_CLIENT_ID && {
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        }),
      },
    })
    
    console.log('🔍 DEBUG: signInWithGoogle result:', {
      hasData: !!data,
      hasError: !!error,
      errorMessage: error?.message,
      errorCode: error?.code,
      url: data?.url ? 'exists' : 'null'
    })
    
    if (error) {
      console.error('❌ DEBUG: Google sign in error:', error)
      console.error('❌ Google sign in error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ DEBUG: Google sign in initiated successfully')
    }
    
    return { data, error }
  }

  const signOut = async () => {
    try {
      console.log('🔍 DEBUG: signOut called')
      console.log('🔍 DEBUG: Calling Supabase auth.signOut()...')

      // Clear caches
      userRolesCache = {}
      userProfileCache = {}
      console.log('🔍 DEBUG: Caches cleared')

      const { error } = await supabase.auth.signOut()
      
      console.log('🔍 DEBUG: signOut result:', {
        hasError: !!error,
        errorMessage: error?.message
      })

      // Reset global state
      globalAuthState.user = null
      globalAuthState.loading = false
      globalAuthState.isBetaTester = false
      console.log('🔍 DEBUG: Global auth state reset')

      notifyListeners()
      console.log('🔍 DEBUG: Listeners notified of sign out')

      return { error }
    } catch (err) {
      console.error('❌ DEBUG: Sign out error:', err)
      console.error('❌ Sign out error details:', JSON.stringify(err, null, 2))

      // Clear caches and reset state even on error
      userRolesCache = {}
      userProfileCache = {}
      globalAuthState.user = null
      globalAuthState.loading = false
      globalAuthState.isBetaTester = false

      notifyListeners()
      console.log('🔍 DEBUG: Fallback state reset due to sign out error')

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

  const needsPasswordReset = globalAuthState.user && window.location.hash.includes('type=recovery')

  const hasRole = (roleName: string) => {
    if (globalAuthState.user?.user_roles?.includes(roleName)) {
      return true
    }
    return false
  }

  const isBetaTesterSync = hasRole('Beta Tester')

  return {
    user: globalAuthState.user,
    loading: globalAuthState.loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    needsPasswordReset,
    hasRole,
    isBetaTester: globalAuthState.isBetaTester || isBetaTesterSync,
  }
}