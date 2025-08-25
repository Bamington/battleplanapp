import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface BlockedDate {
  id: string
  location_id: string
  date: string
  description: string | null
  created_at: string
  locations: {
    id: string
    name: string
    address: string
  } | null
}

export function useBlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchBlockedDates = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('blocked_dates')
        .select('*, locations(*)')
        .order('date', { ascending: true })

      // If user is a location admin (but not a full admin), filter by their locations
      if (user?.is_location_admin && !user?.is_admin) {
        // Get locations where the user is an admin
        const { data: userLocations, error: locationError } = await supabase
          .from('locations')
          .select('id')
          .contains('admins', [user.id])

        if (locationError) {
          console.error('Error fetching user locations:', locationError)
          throw locationError
        }

        if (userLocations && userLocations.length > 0) {
          const locationIds = userLocations.map(loc => loc.id)
          query = query.in('location_id', locationIds)
        } else {
          // User is marked as location admin but has no locations, return empty array
          setBlockedDates([])
          return
        }
      }

      const { data, error } = await query

      if (error) throw error

      setBlockedDates(data || [])
    } catch (err) {
      console.error('Error fetching blocked dates:', err)
      setError('Failed to load blocked dates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlockedDates()
  }, [user])

  return {
    blockedDates,
    loading,
    error,
    refetch: fetchBlockedDates
  }
}
