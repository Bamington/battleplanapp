import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Booking {
  id: string
  date: string
  created_at: string
  user_name: string | null
  user_email: string | null
  user: {
    id: string
    email: string
  }
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
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setBookings([])
      setLoading(false)
      return
    }

    fetchBookings()
  }, [user])

  const fetchBookings = async () => {
    try {
      // First, get bookings with related data (except user)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          created_at,
          user_id,
          user_name,
          user_email,
          location:locations(
            id,
            name,
            address,
            icon
          ),
          timeslot:timeslots(
            id,
            name,
            start_time,
            end_time
          ),
          game:games(
            id,
            name,
            icon
          )
        `)
        .eq('user_id', user?.id)
        .order('date', { ascending: true })

      if (bookingsError) throw bookingsError
      if (!bookingsData) {
        setBookings([])
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(bookingsData.map(booking => booking.user_id))]
      
      // Fetch user data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      if (usersError) throw usersError

      // Create a map of user data
      const usersMap = new Map(
        (usersData || []).map(user => [user.id, user])
      )

      // Combine booking data with user data
      const bookingsWithUsers = bookingsData.map(booking => ({
        ...booking,
        user: usersMap.get(booking.user_id) || { id: booking.user_id, email: 'Unknown User' }
      }))

      setBookings(bookingsWithUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  return { bookings, loading, error, refetch: fetchBookings }
}