import React from 'react'
import { MapPin, Clock, X, User } from 'lucide-react'

interface BookingCardProps {
  booking: {
    id: string
    date: string
    user_name: string | null
    user_email: string | null
    location: {
      name: string
      address: string
      icon: string | null
    }
    timeslot: {
      name: string
      start_time: string
      end_time: string
    }
    game: {
      name: string
      icon: string | null
    } | null
    user: {
      id: string
      email: string
    }
  }
  onClick?: () => void
  onCancelBooking?: (bookingId: string) => void
  isPast?: boolean
}

export function BookingCard({ booking, onClick, onCancelBooking, isPast = false }: BookingCardProps) {
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="bg-bg-card rounded-lg shadow-sm border border-border-custom p-4 w-full">
      <div 
        onClick={onClick}
        className="cursor-pointer hover:bg-bg-secondary transition-colors text-left rounded p-2 -m-2 mb-2"
      >
        {/* Timeslot */}
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-secondary-text" />
          <div>
            <span className="font-medium text-text text-sm">{booking.timeslot.name}</span>
            <p className="text-xs text-secondary-text">
              {formatTime(booking.timeslot.start_time)} - {formatTime(booking.timeslot.end_time)}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2 mb-3">
          <MapPin className="w-4 h-4 text-secondary-text mt-0.5" />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-text text-sm truncate">{booking.location.name}</h3>
            <p className="text-xs text-secondary-text truncate">{booking.location.address}</p>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center space-x-2 mb-3">
          <User className="w-4 h-4 text-secondary-text" />
          <div className="min-w-0 flex-1">
            {booking.user_name && (
              <p className="text-sm text-text truncate font-medium">{booking.user_name}</p>
            )}
            <p className="text-xs text-secondary-text truncate">{booking.user_email || booking.user.email}</p>
          </div>
        </div>

        {/* Game (if selected) */}
        {booking.game && (
          <div className="flex items-center space-x-2">
              {booking.game.icon ? (
                <img
                  src={booking.game.icon}
                  alt={`${booking.game.name} icon`}
                  className="w-4 h-4 object-contain rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: booking.game.icon ? 'none' : 'flex' }}>
                <span className="text-white text-xs font-bold">{booking.game.name.charAt(0)}</span>
              </div>
            <span className="text-sm text-secondary-text truncate">{booking.game.name}</span>
          </div>
        )}
      </div>
      
      {/* Cancel Button */}
      {onCancelBooking && !isPast && (
        <div className="flex justify-end pt-2 border-t border-border-custom">
          <button
            onClick={() => onCancelBooking(booking.id)}
            className="btn-danger-outline-sm btn-with-icon-sm"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      )}
    </div>
  )
}