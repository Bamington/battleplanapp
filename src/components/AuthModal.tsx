import React, { useState } from 'react'
import { X, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'signup'
}

export function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
      // Note: For OAuth, the user will be redirected, so we don't close the modal here
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = mode === 'login' 
        ? await signIn(email, password)
        : await signUp(email, password)

      if (error) {
        setError(error.message)
      } else {
        onClose()
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-title">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Google Sign In Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-text font-medium">
              {mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-custom"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-modal-bg text-secondary-text">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-input-label font-overpass mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-input-label font-overpass mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white py-2 px-4 rounded-lg text-base font-semibold transition-colors"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  )
}