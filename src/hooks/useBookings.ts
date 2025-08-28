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
  const [hasInitialized, setHasInitialized] = useState(false)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    // Show skeleton loading while auth is loading
    if (authLoading) {
      setLoading(true)
      setHasInitialized(false)
      return
    }

    // Only proceed if auth has finished loading
    if (!authLoading) {
      if (!user) {
        setBookings([])
        setLoading(false)
        setHasInitialized(true)
        return
      }

      // Always show loading when user is available
      setLoading(true)
      fetchBookings()
    }
  }, [user, authLoading])

  const fetchBookings = async () => {
    const startTime = Date.now()
    const minLoadingTime = 500 // Minimum 500ms loading time for better UX
    
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
       // Ensure minimum loading time for better UX
       const elapsedTime = Date.now() - startTime
       const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
       
       setTimeout(() => {
         setLoading(false)
         setHasInitialized(true)
       }, remainingTime)
     }
  }

  // Debug logging
  console.log('useBookings state:', { loading, hasInitialized, bookingsLength: bookings.length, authLoading })

  return { bookings, loading, error, hasInitialized, refetch: fetchBookings }
}