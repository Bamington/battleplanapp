import React, { useState, useRef, useEffect } from 'react'
import { User, Settings, Moon, Sun, Shield } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'
import { Toast } from './Toast'

interface PublicHeaderProps {
  onAdminClick?: () => void
  onSettingsClick?: () => void
}

export function PublicHeader({ onAdminClick, onSettingsClick }: PublicHeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, left: 0 })
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { user, signOut } = useAuth()
  const profileButtonRef = useRef<HTMLButtonElement>(null)

  // Calculate profile menu position
  useEffect(() => {
    if (isProfileMenuOpen && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect()
      const menuWidth = 200 // min-w-[200px]
      const menuHeight = 200 // Approximate height
      
      // Position below the button
      let left = rect.left
      let top = rect.bottom + 8 // 8px gap
      
      // Prevent going off the right side of screen
      if (left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 16 // 16px margin from edge
      }
      
      // Prevent going off the bottom of screen
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8 // Position above the button instead
      }
      
      setProfileMenuPosition({ top, left })
    }
  }, [isProfileMenuOpen])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileButtonRef.current && !profileButtonRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...')
      setIsProfileMenuOpen(false)
      const { error } = await signOut()
      console.log('Sign out result:', { error })
      if (error) {
        console.error('Sign out error:', error)
        setToastMessage('Failed to sign out. Please try again.')
        setShowToast(true)
      } else {
        console.log('Sign out successful')
        // Show success message
        setToastMessage('Successfully signed out')
        setShowToast(true)
      }
    } catch (err) {
      console.error('Sign out error:', err)
      setToastMessage('Failed to sign out. Please try again.')
      setShowToast(true)
    }
  }

  return (
    <>
      <header className="bg-bg-primary shadow-sm border-b border-border-custom relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Empty space for balance */}
            <div className="flex items-center">
              <div className="w-6 h-6"></div> {/* Spacer to balance the header */}
            </div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center flex-1">
              <a
                href="/"
                className="hover:opacity-80 transition-opacity focus:outline-none"
              >
                <img 
                  src="/Battleplan-Logo-Purple.svg"
                  alt="Battleplan Logo" 
                  className="max-h-[300px] w-auto"
                />
              </a>
            </div>

            {/* Right side - Profile Menu */}
            <div className="flex items-center space-x-4">
              {/* Profile Menu Button - Show for both logged in and logged out users */}
              <button
                ref={profileButtonRef}
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="text-secondary-text hover:text-text focus:outline-none"
              >
                <User className="w-6 h-6 text-icon hover:text-icon-hover" />
              </button>
            </div>
          </div>

          {/* Profile Menu Dropdown */}
          <div 
            className={`fixed bg-bg-primary border border-border-custom rounded-lg shadow-lg py-2 z-50 min-w-[200px] transition-all duration-200 ease-in-out ${
              isProfileMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
            style={{
              top: `${profileMenuPosition.top}px`,
              left: `${profileMenuPosition.left}px`
            }}
          >
            {user ? (
              <>
                {/* User info */}
                <div className="px-4 py-2 border-b border-border-custom">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-icon" />
                    <span className="text-base text-text">{user.email}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onAdminClick?.()
                  }}
                  className={`flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors ${
                    (user?.is_admin || user?.is_location_admin) ? '' : 'hidden'
                  }`}
                >
                  <Shield className="w-5 h-5 text-icon hover:text-icon-hover" />
                  <span>Admin</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    onSettingsClick?.()
                  }}
                  className="flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
                >
                  <Settings className="w-5 h-5 text-icon hover:text-icon-hover" />
                  <span>Settings</span>
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Sign In option for logged out users */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false)
                    window.location.href = '/login'
                  }}
                  className="flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
                >
                  <User className="w-5 h-5 text-icon hover:text-icon-hover" />
                  <span>Sign In</span>
                </button>
              </>
            )}
            
            {/* Dark/Light Mode Toggle - Show for both logged in and logged out users */}
            <div className="flex items-center justify-between px-4 py-2 hover:bg-bg-secondary transition-colors">
              <div className="flex items-center space-x-3">
                {isDarkMode ? <Moon className="w-5 h-5 text-icon hover:text-icon-hover" /> : <Sun className="w-5 h-5 text-icon hover:text-icon-hover" />}
                <span className="text-base font-semibold text-text">
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring---color-brand focus:ring-offset-2 ${
                  isDarkMode ? 'bg-brand' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Backdrop for profile menu */}
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-200 ease-in-out ${
          isProfileMenuOpen
            ? 'bg-opacity-25 pointer-events-auto' 
            : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          setIsProfileMenuOpen(false)
        }}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}
