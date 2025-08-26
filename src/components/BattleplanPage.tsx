import React, { useState, useEffect } from 'react'
import { Calendar, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { NewBookingModal } from './NewBookingModal'
import { BookingCard } from './BookingCard'
import { CancelBookingModal } from './CancelBookingModal'
import { useBookings } from '../hooks/useBookings'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../utils/timezone'

interface BattleplanPageProps {
  refreshTrigger?: number
  onNewBooking?: () => void
}

export function BattleplanPage({ refreshTrigger = 0, onNewBooking }: BattleplanPageProps) {
  const [expandedDates, setExpandedDates] = React.useState<Set<string>>(new Set())
  const [lastSelectedLocation, setLastSelectedLocation] = React.useState<string>('')
  const [cancelModal, setCancelModal] = React.useState<{
    isOpen: boolean
    bookingId: string | null
  }>({
    isOpen: false,
    bookingId: null
  })
  const [cancelling, setCancelling] = React.useState(false)
  const { bookings, loading, hasInitialized, refetch } = useBookings()

  // Refetch bookings when refreshTrigger changes
  React.useEffect(() => {
    if (refreshTrigger > 0) {
      refetch()
    }
  }, [refreshTrigger, refetch])



  const handleCancelBooking = (bookingId: string) => {
    setCancelModal({
      isOpen: true,
      bookingId
    })
  }

  const handleConfirmCancel = async () => {
    if (!cancelModal.bookingId) return

    setCancelling(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', cancelModal.bookingId)

      if (error) throw error

      // Refresh bookings and close modal
      await refetch()
      setCancelModal({ isOpen: false, bookingId: null })
    } catch (error) {
      console.error('Error cancelling booking:', error)
      // You could add error handling UI here
    } finally {
      setCancelling(false)
    }
  }

  // Group bookings by date and sort by timeslot within each group
  const groupedBookings = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const upcomingGroups: { [date: string]: typeof bookings } = {}
    const pastBookings: typeof bookings = []
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date)
      
      if (bookingDate >= today) {
        // Upcoming booking
        const dateKey = booking.date
        if (!upcomingGroups[dateKey]) {
          upcomingGroups[dateKey] = []
        }
        upcomingGroups[dateKey].push(booking)
      } else {
        // Past booking
        pastBookings.push(booking)
      }
    })
    
    // Sort bookings within each upcoming date group by start time
    Object.keys(upcomingGroups).forEach(date => {
      upcomingGroups[date].sort((a, b) => {
        return a.timeslot.start_time.localeCompare(b.timeslot.start_time)
      })
    })
    
    // Sort past bookings by date (most recent first) and then by timeslot
    pastBookings.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date)
      if (dateCompare !== 0) return dateCompare
      return b.timeslot.start_time.localeCompare(a.timeslot.start_time)
    })
    
    // Sort upcoming dates chronologically
    const sortedUpcomingDates = Object.keys(upcomingGroups).sort((a, b) => a.localeCompare(b))
    
    const result = sortedUpcomingDates.map(date => ({
      date,
      bookings: upcomingGroups[date],
      isPast: false
    }))
    
    // Add past bookings group if there are any
    if (pastBookings.length > 0) {
      result.push({
        date: 'past',
        bookings: pastBookings,
        isPast: true
      })
    }
    
    return result
  }, [bookings])

  // Initialize expanded state - only expand the first group
  React.useEffect(() => {
    if (groupedBookings.length > 0) {
      setExpandedDates(new Set([groupedBookings[0].date]))
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

  const formatDateHeader = (dateString: string) => {
    if (dateString === 'past') {
      return 'Past Bookings'
    }
    return formatLocalDate(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-title mb-4">YOUR TABLE BOOKINGS</h1>
        </div>

        {/* Bookings List */}
        <div className="mb-8">
          {loading ? (
            <div className="space-y-8">
              {/* Skeleton for date groups */}
              {Array.from({ length: 2 }).map((_, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                  {/* Skeleton date header */}
                  <div className="w-full border-b border-border-custom pb-2 animate-pulse">
                    <div className="h-6 bg-secondary-text opacity-20 rounded w-48"></div>
                  </div>
                  
                  {/* Skeleton booking cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: groupIndex === 0 ? 3 : 2 }).map((_, cardIndex) => (
                      <div key={cardIndex} className="bg-bg-card rounded-lg shadow-sm border border-border-custom p-4 animate-pulse">
                        {/* Date and Timeslot skeleton */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-secondary-text opacity-20 rounded w-3/4 mb-1"></div>
                            <div className="h-3 bg-secondary-text opacity-20 rounded w-1/2"></div>
                          </div>
                        </div>
                        
                        {/* Location skeleton */}
                        <div className="flex items-start space-x-2 mb-3">
                          <div className="w-4 h-4 bg-secondary-text opacity-20 rounded mt-0.5"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-secondary-text opacity-20 rounded w-2/3 mb-1"></div>
                            <div className="h-3 bg-secondary-text opacity-20 rounded w-full"></div>
                          </div>
                        </div>
                        
                        {/* User skeleton */}
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-secondary-text opacity-20 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-secondary-text opacity-20 rounded w-3/4"></div>
                          </div>
                        </div>
                        
                        {/* Game skeleton (optional) */}
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-secondary-text opacity-20 rounded"></div>
                          <div className="h-3 bg-secondary-text opacity-20 rounded w-1/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : hasInitialized && bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-secondary-text mx-auto mb-4" />
              <p className="text-base text-secondary-text mb-4">No table bookings yet.</p>
              <div className="flex justify-center">
                <button 
                  onClick={onNewBooking}
                  className="btn-primary"
                >
                  Book Your First Table
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {groupedBookings.map(({ date, bookings: dateBookings, isPast }) => (
                <div key={date} className="space-y-4">
                  <button
                    onClick={() => toggleDateExpansion(date)}
                    className="w-full flex items-center justify-between text-left border-b border-border-custom pb-2 hover:bg-bg-secondary transition-colors rounded-lg px-2 py-1"
                  >
                    <h2 className="text-xl font-bold text-title">
                      {formatDateHeader(date)}
                    </h2>
                    {expandedDates.has(date) ? (
                      <ChevronDown className="w-5 h-5 text-icon" />
                    ) : (
                                              <ChevronRight className="w-5 h-5 text-icon" />
                    )}
                  </button>
                  {expandedDates.has(date) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dateBookings.map((booking) => (
                        <BookingCard 
                          key={booking.id} 
                          booking={booking} 
                          onClick={() => {}} // Empty function for now, can be used for booking details
                          onCancelBooking={handleCancelBooking}
                          isPast={isPast}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>



      <CancelBookingModal
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, bookingId: null })}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
      />
    </>
  )
}