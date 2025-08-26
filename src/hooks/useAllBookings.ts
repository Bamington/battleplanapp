import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { isPastDate } from '../utils/timezone'

interface Booking {
  id: string
  date: string
  created_at: string
  user_name: string | null
  user_email: string | null
  user_id: string
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

export function useAllBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchAllBookings = async () => {
    try {
      setLoading(true)
      
      let bookingsQuery = supabase
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

      // If user is location admin (but not full admin), filter by their locations
      if (user?.is_location_admin && !user?.is_admin && user?.id) {
        // First get the locations this user is admin of
        const { data: userLocations, error: locationsError } = await supabase
          .from('locations')
          .select('id')
          .contains('admins', [user.id])

        if (locationsError) throw locationsError

        const locationIds = userLocations?.map(loc => loc.id) || []
        
        if (locationIds.length === 0) {
          // User is not admin of any locations, return empty array
          setBookings([])
          return
        }

        bookingsQuery = bookingsQuery.in('location_id', locationIds)
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery

      if (bookingsError) throw bookingsError

      // Get unique user IDs
      const userIds = [...new Set(bookingsData?.map(booking => booking.user_id) || [])]
      
      // Fetch user data from auth.users via the users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

      if (usersError) throw usersError

      // Create a map of user data for quick lookup
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || [])

      // Combine the data
      const combinedData = bookingsData?.map(booking => ({
        ...booking,
        user: usersMap.get(booking.user_id) || { id: booking.user_id, email: 'Unknown User' }
      })) || []

      // Sort bookings: future bookings first (most recent date first), then past bookings (most recent date first)
      const sortedData = combinedData.sort((a, b) => {
        const aIsPast = isPastDate(a.date)
        const bIsPast = isPastDate(b.date)
        
        // If one is past and one is future, future comes first
        if (aIsPast && !bIsPast) return 1
        if (!aIsPast && bIsPast) return -1
        
        // If both are future or both are past, sort by date (most recent first)
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateComparison !== 0) return dateComparison
        
        // If dates are the same, sort by creation time (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      setBookings(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllBookings()
  }, [])

  return {
    bookings,
    loading,
    error,
    refetch: fetchAllBookings
  }
}