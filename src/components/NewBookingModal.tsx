import React, { useState, useEffect } from 'react'
import { X, MapPin, Calendar, Clock, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { GameDropdown } from './GameDropdown'
import { useRecentGames } from '../hooks/useRecentGames'
import { useGames } from '../hooks/useGames'
import { useLocations } from '../hooks/useLocations'
import { DatePicker } from './DatePicker'
import { getTodayLocalDate } from '../utils/timezone'

interface Location {
  id: string
  name: string
  address: string
  icon: string | null
  tables: number
}

interface Timeslot {
  id: string
  name: string
  start_time: string
  end_time: string
  availability: string[]
  isAllDay?: boolean
}

interface Game {
  id: string
  name: string
  icon: string | null
}

interface NewBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onBookingCreated: () => void
  lastSelectedLocation?: string
  onLocationSelected?: (locationId: string) => void
}

export function NewBookingModal({ isOpen, onClose, onBookingCreated, lastSelectedLocation = '', onLocationSelected }: NewBookingModalProps) {
  const { games } = useGames()
  const { locations } = useLocations()
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])
  const [selectedLocation, setSelectedLocation] = useState(lastSelectedLocation)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeslot, setSelectedTimeslot] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [userNameInput, setUserNameInput] = useState('')
  const [availableTables, setAvailableTables] = useState<number | null>(null)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [currentBookingCount, setCurrentBookingCount] = useState(0)
  const [checkingBookingLimit, setCheckingBookingLimit] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [blockedDateInfo, setBlockedDateInfo] = useState<{ description: string | null, blocked_tables: number | null } | null>(null)
  const [checkingBlockedDate, setCheckingBlockedDate] = useState(false)
  const { user } = useAuth()
  const { recentGames, addRecentGame } = useRecentGames()

  // Load last selected location from localStorage on component mount
  const getLastSelectedLocation = () => {
    try {
      return localStorage.getItem('mini-myths-last-location') || ''
    } catch (error) {
      console.error('Error loading last selected location:', error)
      return ''
    }
  }

  // Save selected location to localStorage
  const saveLastSelectedLocation = (locationId: string) => {
    try {
      if (locationId) {
        localStorage.setItem('mini-myths-last-location', locationId)
      }
    } catch (error) {
      console.error('Error saving last selected location:', error)
    }
  }
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      checkCurrentBookings()
      // Set the last selected location when modal opens, prioritizing localStorage
      const savedLocation = getLastSelectedLocation()
      setSelectedLocation(savedLocation || lastSelectedLocation)
      // Set user name from user_name_public if available
      if (user?.user_name_public) {
        setUserNameInput(user.user_name_public)
      }
    }
  }, [isOpen, lastSelectedLocation])

  useEffect(() => {
    if (selectedLocation) {
      fetchTimeslots()
      // Save to localStorage and notify parent component about location selection
      saveLastSelectedLocation(selectedLocation)
      onLocationSelected?.(selectedLocation)
    } else {
      setTimeslots([])
      setSelectedTimeslot('')
    }
  }, [selectedLocation, onLocationSelected])

  useEffect(() => {
    // Reset timeslot selection when date changes
    if (selectedDate) {
      setSelectedTimeslot('')
      setAvailableTables(null)
    }
  }, [selectedDate])

  useEffect(() => {
    // Check blocked date when location and date are selected
    if (selectedLocation && selectedDate) {
      checkBlockedDate()
    } else {
      setBlockedDateInfo(null)
    }
  }, [selectedLocation, selectedDate])

  // Clear timeslot when date becomes fully blocked (all tables blocked)
  useEffect(() => {
    if (blockedDateInfo && blockedDateInfo.blocked_tables === null) {
      setSelectedTimeslot('')
    }
  }, [blockedDateInfo])

  useEffect(() => {
    // Check table availability when location, date, and timeslot are all selected
    if (selectedLocation && selectedDate && selectedTimeslot) {
      checkTableAvailability()
    } else {
      setAvailableTables(null)
    }
  }, [selectedLocation, selectedDate, selectedTimeslot])

  const checkBlockedDate = async () => {
    if (!selectedLocation || !selectedDate) return

    setCheckingBlockedDate(true)
    try {
      console.log('Checking blocked date for:', { selectedLocation, selectedDate })
      
      // Query blocked dates with new blocked_tables field
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('description, blocked_tables')
        .eq('location_id', selectedLocation)
        .eq('date', selectedDate)

      console.log('Blocked date query result:', { data, error })

      if (error) {
        console.error('Error checking blocked date:', error)
        // Don't show error to user, just assume no blocked date
        setBlockedDateInfo(null)
        return
      }

      // Check if we found any blocked dates
      if (data && data.length > 0) {
        console.log('Found blocked date:', data[0])
        setBlockedDateInfo({ 
          description: data[0].description, 
          blocked_tables: data[0].blocked_tables 
        })
      } else {
        console.log('No blocked date found for this location/date')
        setBlockedDateInfo(null)
      }
    } catch (err) {
      console.error('Error checking blocked date:', err)
      setBlockedDateInfo(null)
    } finally {
      setCheckingBlockedDate(false)
    }
  }

  const checkTableAvailability = async () => {
    if (!selectedLocation || !selectedDate || !selectedTimeslot) return

    setCheckingAvailability(true)
    try {
      // Get the location to find total tables
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('tables')
        .eq('id', selectedLocation)
        .single()

      if (locationError) throw locationError

      const totalTables = locationData.tables
      
      // Find the selected timeslot to check if it's an "All Day" booking
      const selectedTimeslotData = timeslots.find(ts => ts.id === selectedTimeslot)
      const isSelectedAllDay = selectedTimeslotData?.isAllDay || false
      
      let bookedTables = 0
      
      if (isSelectedAllDay) {
        // For "All Day" bookings, count all bookings across all timeslots for this location and date
        const { data: allBookingsData, error: allBookingsError } = await supabase
          .from('bookings')
          .select('timeslot_id')
          .eq('location_id', selectedLocation)
          .eq('date', selectedDate)

        if (allBookingsError) throw allBookingsError
        
        // Group bookings by timeslot and find the maximum number of bookings in any single timeslot
        const bookingsByTimeslot: { [key: string]: number } = {}
        
        allBookingsData?.forEach(booking => {
          const timeslotId = booking.timeslot_id
          bookingsByTimeslot[timeslotId] = (bookingsByTimeslot[timeslotId] || 0) + 1
        })
        
        // Find the maximum number of bookings in any single timeslot
        bookedTables = Math.max(0, ...Object.values(bookingsByTimeslot))
      } else {
        // For regular timeslots, count bookings for this specific timeslot
        const { data: regularBookingsData, error: regularBookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('location_id', selectedLocation)
          .eq('date', selectedDate)
          .eq('timeslot_id', selectedTimeslot)

        if (regularBookingsError) throw regularBookingsError
        
        // Also count "All Day" bookings that would block this timeslot
        const { data: allTimeslotBookingsData, error: allTimeslotBookingsError } = await supabase
          .from('bookings')
          .select('timeslot:timeslots(id, name, start_time, end_time)')
          .eq('location_id', selectedLocation)
          .eq('date', selectedDate)

        if (allTimeslotBookingsError) throw allTimeslotBookingsError
        
        const regularBookings = regularBookingsData?.length || 0
        
        // Count bookings that use "All Day" timeslots (these block all other timeslots)
        const allDayBookings = allTimeslotBookingsData?.filter(booking => {
          const timeslot = booking.timeslot
          return timeslot && (
            timeslot.name === 'All Day Booking' || 
            (timeslot.start_time === '00:00:00' && timeslot.end_time === '23:59:59')
          )
        }).length || 0
        
        bookedTables = regularBookings + allDayBookings
      }
      
      // Subtract blocked tables from total available tables
      let effectiveTotalTables = totalTables
      if (blockedDateInfo && blockedDateInfo.blocked_tables !== null) {
        effectiveTotalTables = totalTables - blockedDateInfo.blocked_tables
      } else if (blockedDateInfo && blockedDateInfo.blocked_tables === null) {
        // All tables are blocked
        effectiveTotalTables = 0
      }
      
      const available = effectiveTotalTables - bookedTables

      setAvailableTables(Math.max(0, available))
    } catch (err) {
      console.error('Error checking table availability:', err)
      setAvailableTables(null)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const checkCurrentBookings = async () => {
    if (!user) return

    setCheckingBookingLimit(true)
    try {
      const today = getTodayLocalDate()
      
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', user.id)
        .gte('date', today)

      if (error) throw error

      setCurrentBookingCount(data?.length || 0)
    } catch (err) {
      console.error('Error checking current bookings:', err)
      setCurrentBookingCount(0)
    } finally {
      setCheckingBookingLimit(false)
    }
  }


  const fetchTimeslots = async () => {
    try {
      const { data, error } = await supabase
        .from('timeslots')
        .select('*')
        .eq('location_id', selectedLocation)
        .order('start_time')

      if (error) throw error
      
      // Mark "All Day" timeslots based on their characteristics
      const processedTimeslots = (data || []).map(timeslot => ({
        ...timeslot,
        isAllDay: timeslot.name === 'All Day Booking' || 
                 (timeslot.start_time === '00:00:00' && timeslot.end_time === '23:59:59')
      }))
      
      setTimeslots(processedTimeslots)
    } catch (err) {
      console.error('Error fetching timeslots:', err)
    }
  }


  const getFavoriteGames = () => {
    if (!user?.fav_games || user.fav_games.length === 0) return []
    return games.filter(game => user.fav_games?.includes(game.id))
  }

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId)
    // Add to recent games
    const selectedGameData = games.find(game => game.id === gameId)
    if (selectedGameData) {
      addRecentGame(selectedGameData)
    }
  }

  const getSelectedDayOfWeek = () => {
    if (!selectedDate) return null
    const date = new Date(selectedDate)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[date.getDay()]
  }

  const getAvailableTimeslots = () => {
    const dayOfWeek = getSelectedDayOfWeek()
    if (!dayOfWeek) return []
    
    return timeslots.filter(timeslot => 
      timeslot.availability && timeslot.availability.includes(dayOfWeek)
    )
  }

  const formatTime = (timeString: string) => {
    // Handle "All Day" display
    if (timeString === '00:00:00') {
      return 'All Day'
    }
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLocation || !selectedDate || !selectedTimeslot || !user) return

    setLoading(true)
    setError('')

    try {
      // Save the user's name to their profile for future use
      if (userNameInput.trim() && user.user_name_public !== userNameInput.trim()) {
        await supabase
          .from('users')
          .update({ user_name_public: userNameInput.trim() })
          .eq('id', user.id)
      }

      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          location_id: selectedLocation,
          timeslot_id: selectedTimeslot,
          game_id: selectedGame || null,
          date: selectedDate,
          user_id: user.id,
          user_name: userNameInput.trim(),
          user_email: user.email
        })
        .select()
        .single()

      if (error) throw error

      // Send email notification to store
      try {
        console.log('🚀 Invoking booking notification function for booking:', bookingData.id)
        const { data: functionResponse, error: functionError } = await supabase.functions.invoke('send-booking-notification', {
          body: { booking_id: bookingData.id }
        })

        if (functionError) {
          console.error('❌ Function error details:', {
            message: functionError.message,
            details: functionError.details,
            hint: functionError.hint,
            code: functionError.code
          })
          // Don't fail the booking if email fails
        } else {
          console.log('✅ Function response:', functionResponse)
          if (functionResponse?.success) {
            console.log('📧 Email notification sent successfully!')
          } else {
            console.log('⚠️  Function completed but with warning:', functionResponse?.message)
          }
        }
      } catch (emailError) {
        console.error('💥 Exception during email notification:', {
          error: emailError,
          message: emailError?.message,
          stack: emailError?.stack
        })
        // Don't fail the booking if email fails
      }
      
      // Add the selected game to recent games if one was selected
      if (selectedGame) {
        const selectedGameData = games.find(g => g.id === selectedGame)
        if (selectedGameData) {
          addRecentGame(selectedGameData)
        }
      }

      // Reset form
      setSelectedLocation('')
      setSelectedDate('')
      setSelectedTimeslot('')
      setSelectedGame('')
      setUserNameInput('')
      setBlockedDateInfo(null)
      
      onBookingCreated()
      onClose()
      
      // Update booking count after successful creation
      setCurrentBookingCount(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const isDateFullyBlocked = blockedDateInfo && blockedDateInfo.blocked_tables === null
  const isFormValid = selectedLocation && selectedDate && selectedTimeslot && userNameInput.trim() && currentBookingCount < 4 && !isDateFullyBlocked

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const availableTimeslots = getAvailableTimeslots()

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-container"
      onClick={handleBackdropClick}
    >
      <div className={`bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col transition-all duration-300 ease-out transform p-6
        ${isOpen 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0'
        }`}>
        
        {/* Header - Fixed at top with shadow */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 pb-4 shadow-sm bg-modal-bg rounded-t-lg">
          <h2 className="text-xl font-semibold text-text font-overpass">
            New Booking
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Booking Limit Warning - Fixed with shadow */}
        {checkingBookingLimit ? (
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 flex-shrink-0 mx-6 mb-4 shadow-sm bg-modal-bg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-blue-700 text-sm font-medium">Checking booking limit...</span>
            </div>
          </div>
        ) : currentBookingCount >= 4 ? (
          <div className="p-4 rounded-lg border bg-red-50 border-red-200 flex-shrink-0 mx-6 mb-4 shadow-sm bg-modal-bg">
            <span className="text-red-700 text-sm font-medium">
              ⚠️ You have reached the maximum of 4 active bookings. Cancel an existing booking to create a new one.
            </span>
          </div>
        ) : currentBookingCount >= 3 ? (
          <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200 flex-shrink-0 mx-6 mb-4 shadow-sm bg-modal-bg">
            <span className="text-yellow-700 text-sm font-medium">
              ⚠️ You have {currentBookingCount} active booking{currentBookingCount !== 1 ? 's' : ''}. You can create {4 - currentBookingCount} more.
            </span>
          </div>
        ) : null}

        {/* Form - Scrollable content with padding */}
        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto px-6">
          <div className="py-4 space-y-6">
          {/* User Name */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
              <input
                type="text"
                id="userName"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
                required
              />
            </div>
            <p className="text-xs text-secondary-text mt-1">
              This will be shared with the store for your booking.
            </p>
          </div>

          {/* Game (Optional) */}
          <div>
            <label htmlFor="game" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Game (Optional)
            </label>
            <GameDropdown
              games={games}
              selectedGame={selectedGame}
              onGameSelect={handleGameSelect}
              placeholder="Choose a Game (Optional)"
              favoriteGames={getFavoriteGames()}
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
              required
            >
              <option value="">Select a Location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Date
            </label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              minDate={getTodayLocalDate()}
              placeholder="Select a date"
            />
          </div>

          {/* Timeslot */}
          <div>
            <label htmlFor="timeslot" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Time
            </label>
            <select
              id="timeslot"
              value={selectedTimeslot}
              onChange={(e) => setSelectedTimeslot(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
              required
              disabled={!selectedDate || availableTimeslots.length === 0}
            >
              <option value="">Select a Time</option>
              {availableTimeslots.map((timeslot) => (
                <option key={timeslot.id} value={timeslot.id}>
                  {timeslot.name} ({formatTime(timeslot.start_time)} - {formatTime(timeslot.end_time)})
                </option>
              ))}
            </select>
            {selectedDate && availableTimeslots.length === 0 && selectedLocation && (
              <p className="text-sm text-secondary-text mt-1">
                No timeslots available for {getSelectedDayOfWeek()} at this location.
              </p>
            )}
          </div>

          {/* Blocked Date Warning */}
          {checkingBlockedDate ? (
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-blue-700 text-sm font-medium">Checking date availability...</span>
              </div>
            </div>
          ) : isDateFullyBlocked ? (
            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
              <div className="flex items-start space-x-2">
                <span className="text-red-700 text-sm font-medium">🚫 Location Unavailable</span>
              </div>
              <p className="text-red-600 text-sm mt-1">
                This location is completely blocked on the selected date.
                {blockedDateInfo?.description && (
                  <span className="block mt-1">
                    <strong>Reason:</strong> {blockedDateInfo.description}
                  </span>
                )}
              </p>
            </div>
          ) : blockedDateInfo && blockedDateInfo.blocked_tables !== null ? (
            <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
              <div className="flex items-start space-x-2">
                <span className="text-yellow-700 text-sm font-medium">⚠️ Limited Availability</span>
              </div>
              <p className="text-yellow-600 text-sm mt-1">
                {blockedDateInfo.blocked_tables} table{blockedDateInfo.blocked_tables !== 1 ? 's are' : ' is'} blocked on this date.
                {blockedDateInfo.description && (
                  <span className="block mt-1">
                    <strong>Reason:</strong> {blockedDateInfo.description}
                  </span>
                )}
              </p>
            </div>
          ) : null}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Table Availability Banner - Only show if date is not fully blocked */}
          {!isDateFullyBlocked && selectedLocation && selectedDate && selectedTimeslot && (
            <div className={`p-4 rounded-lg border ${
              checkingAvailability 
                ? 'bg-blue-50 border-blue-200' 
                : availableTables === null
                ? 'bg-gray-50 border-gray-200'
                : availableTables === 0 
                ? 'bg-red-50 border-red-200' 
                : availableTables <= 2 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              {checkingAvailability ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-blue-700 text-sm font-medium">Checking table availability...</span>
                </div>
              ) : availableTables === null ? (
                <span className="text-gray-700 text-sm font-medium">Unable to check table availability</span>
              ) : availableTables === 0 ? (
                <span className="text-red-700 text-sm font-medium">⚠️ No tables available for this timeslot</span>
              ) : availableTables <= 2 ? (
                <span className="text-yellow-700 text-sm font-medium">⚠️ Only {availableTables} table{availableTables !== 1 ? 's' : ''} remaining</span>
              ) : (
                <span className="text-green-700 text-sm font-medium">✅ {availableTables} table{availableTables !== 1 ? 's' : ''} available</span>
              )}
            </div>
          )}
          </div>
        </form>

        {/* Submit Button - Fixed at bottom with shadow */}
        <div className="p-6 pt-4 shadow-sm bg-modal-bg rounded-b-lg flex-shrink-0">
          <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={!isFormValid || loading || availableTables === 0 || currentBookingCount >= 4 || isDateFullyBlocked}
            className={`btn-full ${
              isFormValid && !loading && availableTables !== 0 && currentBookingCount < 4 && !isDateFullyBlocked
                ? 'btn-primary'
                : 'btn-disabled'
            }`}
            onClick={handleSubmit}
          >
            {loading ? 'Creating Booking...' : 
             currentBookingCount >= 4 ? 'Booking Limit Reached' :
             availableTables === 0 ? 'No Tables Available' : 
             isDateFullyBlocked ? 'Location Unavailable' :
             'Confirm Booking'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-danger-outline btn-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
    </div>
  )
}