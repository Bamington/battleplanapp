import React, { useState, useEffect } from 'react'
import { ArrowLeft, User, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGames } from '../hooks/useGames'
import { useLocations } from '../hooks/useLocations'
import { MultiSelectDropdown } from './MultiSelectDropdown'


interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form data
  const [userName, setUserName] = useState('')
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  
  // Data for dropdowns
  const { games } = useGames()
  const { locations } = useLocations()

  // Profanity filter (same as onboarding)
  const profanityList = [
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap', 'piss', 'dick', 'cock', 'pussy', 'cunt',
    'bastard', 'whore', 'slut', 'faggot', 'nigger', 'nigga', 'fag', 'dyke', 'retard', 'spic', 'kike',
    'fuk', 'fuq', 'sh1t', 'sh!t', 'b!tch', 'b1tch', 'a$$', 'a55', 'd!ck', 'd1ck', 'p!ss', 'p1ss',
    'noob', 'n00b', 'nub', 'scrub', 'get gud', 'git gud', 'uninstall', 'kys', 'kys', 'kys',
    'f*ck', 'f**k', 'f***', 's**t', 's***', 'b***h', 'a**', 'd**k', 'p**s', 'c**t'
  ]
  
  const containsProfanity = (text: string) => {
    const lowerText = text.toLowerCase()
    return profanityList.some(word => {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      return regex.test(lowerText)
    })
  }

  // Validation
  const isUserNameValid = () => {
    if (!userName) return true // Allow empty username
    if (userName.length < 5 || userName.length > 20) return false
    if (!/^[a-zA-Z0-9\s]+$/.test(userName)) return false
    if (containsProfanity(userName)) return false
    return true
  }

  // Load user data and available options
  useEffect(() => {
    if (user) {
      // Load current user data
      setUserName(user.user_name_public || '')
      setSelectedGames(user.fav_games || [])
      setSelectedLocations(user.fav_locations || [])
      
    }
  }, [user])


  const handleSave = async () => {
    if (!user) return

    // Validate username
    if (userName && !isUserNameValid()) {
      setError('Please enter a valid display name (5-20 characters, letters, numbers, and spaces only)')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          user_name_public: userName || null,
          fav_games: selectedGames.length > 0 ? selectedGames : null,
          fav_locations: selectedLocations.length > 0 ? selectedLocations : null
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccess('Settings saved successfully!')
      
      // Update local user data
      if (user) {
        user.user_name_public = userName || null
        user.fav_games = selectedGames.length > 0 ? selectedGames : null
        user.fav_locations = selectedLocations.length > 0 ? selectedLocations : null
      }
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setUserName(user.user_name_public || '')
      setSelectedGames(user.fav_games || [])
      setSelectedLocations(user.fav_locations || [])
    }
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header onBack={onBack} />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-bg-card rounded-lg shadow-sm p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-title mb-2">Settings</h1>
            <p className="text-secondary-text">
              Manage your profile preferences and favorite games and locations.
            </p>
          </div>

          <div className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-input-label mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
                />
              </div>
              <div className="mt-2 text-sm text-secondary-text">
                <p>• Must be 5-20 characters long</p>
                <p>• Can contain letters, numbers, and spaces</p>
                <p>• Cannot contain inappropriate language</p>
                <p>• Leave empty to hide your display name</p>
              </div>
              {userName && !isUserNameValid() && (
                <p className="mt-2 text-sm text-red-500">
                  {containsProfanity(userName) 
                    ? 'Display name contains inappropriate language'
                    : 'Please enter a valid display name (5-20 characters, letters, numbers, and spaces only)'
                  }
                </p>
              )}
            </div>

            {/* Favorite Games */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Favorite Games
              </label>
              <MultiSelectDropdown
                options={games}
                selectedOptions={selectedGames}
                onSelectionChange={setSelectedGames}
                placeholder="Select your favorite games"
                maxSelections={5}
                type="game"
              />
              <p className="mt-2 text-sm text-secondary-text">
                Select up to 5 of your favorite games. These will be prioritized in dropdowns.
              </p>
            </div>

            {/* Favorite Locations */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Favorite Locations
              </label>
              <MultiSelectDropdown
                options={locations}
                selectedOptions={selectedLocations}
                onSelectionChange={setSelectedLocations}
                placeholder="Select your favorite locations"
                maxSelections={5}
                type="location"
              />
              <p className="mt-2 text-sm text-secondary-text">
                Select up to 5 of your favorite locations. These will be prioritized in dropdowns.
              </p>
            </div>

            {/* Error and Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-border-custom rounded-lg bg-bg-primary text-text hover:bg-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading || (userName && !isUserNameValid())}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-[var(--color-brand)] text-white rounded-lg hover:bg-[var(--color-brand)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// Simple header component for the settings page
function Header({ onBack }: { onBack: () => void }) {
  return (
    <header className="bg-bg-primary border-b border-border-custom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-text hover:text-secondary-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-title">Settings</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>
    </header>
  )
}
