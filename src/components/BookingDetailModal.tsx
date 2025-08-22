import React, { useState } from 'react'
import { X, Calendar, Clock, MapPin, User, Gamepad2, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Booking {
  id: string
  date: string
  created_at: string
  user_name: string | null
  user_email: string | null
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

interface BookingDetailModalProps {
  isOpen: boolean
  onClose: () => void
  onBookingCancelled: () => void
  booking: Booking | null
}

export function BookingDetailModal({ isOpen, onClose, onBookingCancelled, booking }: BookingDetailModalProps) {
  const [cancelling, setCancelling] = useState(false)
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  const handleCancelBooking = async () => {
    if (!booking) return

    setCancelling(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id)

      if (error) throw error

      onBookingCancelled()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancelling(false)
      setShowConfirmCancel(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    const tomorrow = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatCreatedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!isOpen || !booking) return null

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
      <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-title">Booking Details</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Date */}
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-secondary-text" />
            <div>
              <p className="font-medium text-text">{formatDate(booking.date)}</p>
              <p className="text-sm text-secondary-text">{booking.date}</p>
            </div>
          </div>

          {/* Timeslot */}
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-secondary-text" />
            <div>
              <p className="font-medium text-text">{booking.timeslot.name}</p>
              <p className="text-sm text-secondary-text">
                {formatTime(booking.timeslot.start_time)} - {formatTime(booking.timeslot.end_time)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-secondary-text mt-0.5" />
            <div>
              <p className="font-medium text-text">{booking.location.name}</p>
              <p className="text-sm text-secondary-text">{booking.location.address}</p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-secondary-text" />
            <div>
              <p className="font-medium text-text">
                {booking.user_name ? booking.user_name : 'Booked by'}
              </p>
              <p className="text-sm text-secondary-text">
                {booking.user_email || booking.user.email}
              </p>
            </div>
          </div>

          {/* Game (if selected) */}
          {booking.game && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {booking.game.icon ? (
                  <img
                    src={booking.game.icon}
                    alt={`${booking.game.name} icon`}
                    className="w-5 h-5 object-contain rounded"
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
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: booking.game.icon ? 'none' : 'flex' }}>
                  <span className="text-white text-xs font-bold">{booking.game.name.charAt(0)}</span>
                </div>
              </div>
              <div>
                <p className="font-medium text-text">Game</p>
                <p className="text-sm text-secondary-text">{booking.game.name}</p>
              </div>
            </div>
          )}

          {/* Booking Created */}
          <div className="border-t border-border-custom pt-4">
            <p className="text-sm text-secondary-text">
              Booking created: {formatCreatedDate(booking.created_at)}
            </p>
          </div>
        </div>

        {/* Cancel Booking Section */}
        <div className="mt-8 pt-6 border-t border-border-custom">
          {!showConfirmCancel ? (
            <button
              onClick={() => setShowConfirmCancel(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Cancel This Booking</span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-medium mb-2">Are you sure?</p>
                <p className="text-red-700 text-sm">
                  This will permanently delete this booking and make the table available for others to book.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmCancel(false)}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 border border-border-custom text-text rounded-lg hover:bg-bg-secondary transition-colors font-medium"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors font-medium"
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}