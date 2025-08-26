import React, { useState, useEffect } from 'react'
import { X, ArrowLeft, ArrowRight, User, Gamepad2, MapPin } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MultiSelectDropdown } from './MultiSelectDropdown'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface Location {
  id: string
  name: string
  address: string
  icon: string | null
}

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [userName, setUserName] = useState('')
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  
  // Data for dropdowns
  const [games, setGames] = useState<Game[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  // Profanity filter (comprehensive implementation)
  const profanityList = [
    // Common profanities and inappropriate terms
    'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap', 'piss', 'dick', 'cock', 'pussy', 'cunt',
    'bastard', 'whore', 'slut', 'faggot', 'nigger', 'nigga', 'fag', 'dyke', 'retard', 'spic', 'kike',
    // Common variations and leetspeak
    'fuk', 'fuq', 'sh1t', 'sh!t', 'b!tch', 'b1tch', 'a$$', 'a55', 'd!ck', 'd1ck', 'p!ss', 'p1ss',
    // Common gaming-related inappropriate terms
    'noob', 'n00b', 'nub', 'scrub', 'get gud', 'git gud', 'uninstall', 'kys', 'kys', 'kys',
    // Additional variations
    'f*ck', 'f**k', 'f***', 's**t', 's***', 'b***h', 'a**', 'd**k', 'p**s', 'c**t'
  ]
  
  const containsProfanity = (text: string) => {
    const lowerText = text.toLowerCase()
    // Check for exact matches and partial matches
    return profanityList.some(word => {
      // Check for exact word boundaries or as part of the text
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
      return regex.test(lowerText)
    })
  }

  // Validation
  const isUserNameValid = () => {
    return userName.length >= 5 && 
           userName.length <= 20 && 
           !containsProfanity(userName) &&
           /^[a-zA-Z0-9\s]+$/.test(userName)
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      // Fetch games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('id, name, icon')
        .order('name')

      if (gamesError) throw gamesError
      setGames(gamesData || [])

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, address, icon')
        .order('name')

      if (locationsError) throw locationsError
      setLocations(locationsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    }
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleComplete = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          user_name_public: userName.trim(),
          fav_games: selectedGames.length > 0 ? selectedGames : null,
          fav_locations: selectedLocations.length > 0 ? selectedLocations : null,
          onboarded: true
        })
        .eq('id', user.id)

      if (error) throw error

      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-title mb-2">Welcome to BattlePlan!</h2>
        <p className="text-secondary-text">
          Let's get you set up with your profile. First, let's set your display name.
        </p>
      </div>

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
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-title mb-2">Favorite Games</h2>
        <p className="text-secondary-text">
          Select up to 5 of your favorite games (optional)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-input-label mb-2">
          Select Games
        </label>
        <MultiSelectDropdown
          options={games}
          selectedOptions={selectedGames}
          onSelectionChange={setSelectedGames}
          placeholder="Choose your favorite games"
          maxSelections={5}
          type="game"
        />
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-title mb-2">Favorite Locations</h2>
        <p className="text-secondary-text">
          Select up to 5 of your favorite gaming locations (optional)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-input-label mb-2">
          Select Locations
        </label>
        <MultiSelectDropdown
          options={locations}
          selectedOptions={selectedLocations}
          onSelectionChange={setSelectedLocations}
          placeholder="Choose your favorite locations"
          maxSelections={5}
          type="location"
        />
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-primary rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <div className="flex items-center space-x-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-icon" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-title">Setup Profile</h1>
              <p className="text-sm text-secondary-text">Step {currentStep} of 3</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="w-full bg-bg-secondary rounded-full h-2">
            <div 
              className="bg-[var(--color-brand)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          {renderCurrentStep()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3">
            <p className="text-sm text-red-500 text-center">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-border-custom">
          <div className="flex justify-between">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && !isUserNameValid()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
