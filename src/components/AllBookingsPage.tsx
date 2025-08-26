import React, { useState } from 'react'
import { ArrowLeft, Calendar } from 'lucide-react'
import { BookingDateGroup } from './BookingDateGroup'
import { BookingDetailModal } from './BookingDetailModal'
import { CancelBookingModal } from './CancelBookingModal'
import { useAllBookings } from '../hooks/useAllBookings'
import { supabase } from '../lib/supabase'
import { isPastDate } from '../utils/timezone'

interface Booking {
  id: string
  date: string
  created_at: string
  location: {
    id: string
    name: string
    address: string
    icon: string | null
  }
  timeslot: {
    id: string
    name: string
    start_time: string
    end_time: string
  }
  game: {
    id: string
    name: string
    icon: string | null
  } | null
  user: {
    id: string
    email: string
  }
}

interface AllBookingsPageProps {
  onBack: () => void
}

export function AllBookingsPage({ onBack }: AllBookingsPageProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean
    bookingId: string | null
  }>({
    isOpen: false,
    bookingId: null
  })
  const [cancelling, setCancelling] = useState(false)
  const { bookings, loading, error, refetch } = useAllBookings()

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowBookingModal(true)
  }

  const handleBookingCancelled = () => {
    setShowBookingModal(false)
    setSelectedBooking(null)
    refetch() // Refresh the list
  }

  const handleCancelBooking = (bookingId: string) => {
    console.log('Attempting to cancel booking with ID:', bookingId)
    setCancelModal({
      isOpen: true,
      bookingId: bookingId
    })
  }

  const handleConfirmCancel = async () => {
    console.log('Confirming cancellation for booking ID:', cancelModal.bookingId)
    if (!cancelModal.bookingId) return

    setCancelling(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', cancelModal.bookingId)

      if (error) throw error

      console.log('Booking cancelled successfully')
      // Refresh bookings and close modal
      await refetch()
      setCancelModal({ isOpen: false, bookingId: null })
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // Group bookings by date
  const groupedBookings = React.useMemo(() => {
    const futureBookings: Booking[] = []
    const pastBookings: Booking[] = []
    
    bookings.forEach(booking => {
      if (isPastDate(booking.date)) {
        // Past booking
        pastBookings.push(booking)
      } else {
        // Future booking
        futureBookings.push(booking)
      }
    })
    
    const futureGroups: { [date: string]: typeof bookings } = {}
    const pastGroups: { [date: string]: typeof bookings } = {}
    
    futureBookings.forEach(booking => {
      const dateKey = booking.date
      if (!futureGroups[dateKey]) {
        futureGroups[dateKey] = []
      }
      futureGroups[dateKey].push(booking)
    })
    
    pastBookings.forEach(booking => {
      const dateKey = booking.date
      if (!pastGroups[dateKey]) {
        pastGroups[dateKey] = []
      }
      pastGroups[dateKey].push(booking)
    })
    
    // Sort bookings within each future date group by start time
    Object.keys(futureGroups).forEach(date => {
      futureGroups[date].sort((a, b) => {
        return a.timeslot.start_time.localeCompare(b.timeslot.start_time)
      })
    })
    
    // Sort bookings within each past date group by start time
    Object.keys(pastGroups).forEach(date => {
      pastGroups[date].sort((a, b) => {
        return a.timeslot.start_time.localeCompare(b.timeslot.start_time)
      })
    })
    
    // Sort future dates chronologically (most recent first)
    const sortedFutureDates = Object.keys(futureGroups).sort((a, b) => a.localeCompare(b))
    
    // Sort past dates (most recent first)
    const sortedPastDates = Object.keys(pastGroups).sort((a, b) => b.localeCompare(a))
    
    // Create result array with future bookings first
    const result = sortedFutureDates.map(date => ({
      date,
      bookings: futureGroups[date],
      isPast: false
    }))
    
    // Add past bookings groups
    sortedPastDates.forEach(date => {
      result.push({
        date,
        bookings: pastGroups[date],
        isPast: true
      })
    })
    
    return result
  }, [bookings])

  // Initialize expanded state - expand the first few groups
  React.useEffect(() => {
    if (groupedBookings.length > 0) {
      const initialExpanded = new Set(groupedBookings.slice(0, 3).map(group => group.date))
      setExpandedDates(initialExpanded)
    }
  }, [groupedBookings])

  const toggleDateExpansion = (date: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(date)) {
        newSet.delete(date)
      } else {
        newSet.add(date)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border---color-brand mx-auto mb-4"></div>
          <p className="text-base text-secondary-text">Loading all bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-bold text-title">ALL BOOKINGS</h1>
          <p className="text-base text-secondary-text mt-2">
            View and manage all table bookings across all locations
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-secondary-text mx-auto mb-4" />
            <p className="text-base text-secondary-text">No bookings found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Future Bookings */}
            {groupedBookings.filter(group => !group.isPast).length > 0 && (
              <div className="space-y-6">
                {groupedBookings
                  .filter(group => !group.isPast)
                  .map(({ date, bookings: dateBookings, isPast }) => (
                    <BookingDateGroup
                      key={date}
                      date={date}
                      bookings={dateBookings}
                      isExpanded={expandedDates.has(date)}
                      onToggle={() => toggleDateExpansion(date)}
                      onBookingClick={handleBookingClick}
                      onCancelBooking={handleCancelBooking}
                    />
                  ))}
              </div>
            )}
            
            {/* Past Bookings Section */}
            {groupedBookings.filter(group => group.isPast).length > 0 && (
              <div className="space-y-6">
                <div className="border-t border-border-custom pt-8">
                  <h2 className="text-2xl font-bold text-title mb-6">Past Bookings</h2>
                </div>
                {groupedBookings
                  .filter(group => group.isPast)
                  .map(({ date, bookings: dateBookings, isPast }) => (
                    <BookingDateGroup
                      key={date}
                      date={date}
                      bookings={dateBookings}
                      isExpanded={expandedDates.has(date)}
                      onToggle={() => toggleDateExpansion(date)}
                      onBookingClick={handleBookingClick}
                      onCancelBooking={handleCancelBooking}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BookingDetailModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onBookingCancelled={handleBookingCancelled}
        booking={selectedBooking}
      />

      <CancelBookingModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
      />
    </>
  )
}