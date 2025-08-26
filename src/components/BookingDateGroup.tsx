import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { BookingCard } from './BookingCard'
import { getRelativeDate } from '../utils/timezone'

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

interface BookingDateGroupProps {
  date: string
  bookings: Booking[]
  isExpanded: boolean
  onToggle: () => void
  onBookingClick: (booking: Booking) => void
  onCancelBooking?: (bookingId: string) => void
}

export function BookingDateGroup({ 
  date, 
  bookings, 
  isExpanded, 
  onToggle, 
  onBookingClick,
  onCancelBooking
}: BookingDateGroupProps) {
  const formatDateHeader = (dateString: string) => {
    return getRelativeDate(dateString)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left border-b border-border-custom pb-2 hover:bg-bg-secondary transition-colors rounded-lg px-2 py-1"
      >
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-title">
            {formatDateHeader(date)}
          </h2>
          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          </span>
        </div>
        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-icon" />
        ) : (
                      <ChevronRight className="w-5 h-5 text-icon" />
        )}
      </button>
      
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <BookingCard 
              key={booking.id} 
              booking={booking} 
              onClick={() => onBookingClick(booking)}
              onCancelBooking={onCancelBooking}
              isPast={date === 'past'}
            />
          ))}
        </div>
      )}
    </div>
  )
}