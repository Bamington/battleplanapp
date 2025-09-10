import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  location: string | null
  opp_name: string | null // Keep for backward compatibility during migration
  opp_id: string[] | null
  opponent_id: number | null
  opponent?: {
    id: number
    opp_name: string | null
    opp_rel_uuid: string | null
    created_by: string | null
    created_at: string
  } | null
  result: string | null
  user_id: string | null
  created_at: string
}

export function useBattles() {
  const [battles, setBattles] = useState<Battle[]>([])
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const fetchBattles = async (isRefetch = false) => {
    // Show loading while auth is loading
    if (authLoading) {
      setLoading(true)
      setHasInitialized(false)
      return
    }

    if (!user) {
      setBattles([])
      setLoading(false)
      setHasInitialized(true)
      return
    }

    const startTime = Date.now()
    // Only apply minimum loading time for initial loads, not refetches
    const minLoadingTime = isRefetch ? 0 : 500

    try {
      // Only show loading for initial loads, not refetches
      if (!isRefetch) {
        setLoading(true)
      }
      
      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          opponent:opponents(*)
        `)
        .eq('user_id', user.id)
        .order('date_played', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching battles:', error)
        setBattles([])
      } else {
        setBattles(data || [])
      }
    } catch (error) {
      console.error('Error fetching battles:', error)
      setBattles([])
    } finally {
      // Ensure minimum loading time for better UX (only for initial loads)
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      setTimeout(() => {
        // Only change loading state if this is not a refetch or if loading was true
        if (!isRefetch) {
          setLoading(false)
        }
        setHasInitialized(true)
      }, remainingTime)
    }
  }

  useEffect(() => {
    fetchBattles()
  }, [user, authLoading])

  const refetch = async () => {
    await fetchBattles(true) // Pass true to indicate this is a refetch
  }


  return {
    battles,
    loading,
    hasInitialized,
    refetch
  }
}
