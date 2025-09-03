import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Location {
  id: string
  name: string
  address: string
  icon: string | null
}

let locationsCache: Location[] | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>(locationsCache || [])
  const [loading, setLoading] = useState(!locationsCache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      // Check if cache is valid
      if (locationsCache && Date.now() < cacheExpiry) {
        setLocations(locationsCache)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('id, name, address, icon')
        .order('name')

      if (fetchError) throw fetchError

      const locationsList = data || []
      
      // Update cache
      locationsCache = locationsList
      cacheExpiry = Date.now() + CACHE_DURATION
      
      setLocations(locationsList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
      console.error('Error fetching locations:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    locationsCache = null
    cacheExpiry = 0
  }

  return { locations, loading, error, refetch: fetchLocations, clearCache }
}