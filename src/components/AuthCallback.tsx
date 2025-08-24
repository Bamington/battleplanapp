import React, { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function AuthCallback() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash and search params
        const hash = window.location.hash
        const searchParams = new URLSearchParams(window.location.search)
        
        // Check if this is an OAuth callback
        if (hash.includes('access_token') || searchParams.has('code')) {
          // Supabase will automatically handle the OAuth callback
          // We just need to wait for the auth state to update
          setTimeout(() => {
            setLoading(false)
            // Redirect to home page after successful auth
            window.location.href = '/'
          }, 1000)
        } else if (hash.includes('error')) {
          // Handle OAuth error
          const errorDescription = new URLSearchParams(hash.substring(1)).get('error_description')
          setError(errorDescription || 'Authentication failed')
          setLoading(false)
        } else {
          setError('Invalid authentication callback')
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Authentication failed')
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [])

  // If user is already authenticated, redirect to home
  useEffect(() => {
    if (user && !loading) {
      window.location.href = '/'
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-text">Completing authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-title mb-4">Authentication Failed</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return null
}
