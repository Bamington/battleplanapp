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
  campaign_id: string | null
  campaign?: {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
  } | null
}

export function useBattles() {
  const [battles, setBattles] = useState<Battle[]>([])
  const [isLoading, setIsLoading] = useState(true) // Always start with loading = true
  const { user, loading: authLoading } = useAuth()

  const fetchBattles = async () => {
    try {
      // Don't fetch if no user
      if (!user) {
        setBattles([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('battles')
        .select(`
          *,
          opponent:opponents(*),
          campaign:campaigns(id, name, description, start_date, end_date)
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
      // Only stop loading when we're completely done
      setIsLoading(false)
    }
  }

  // Fetch data when auth completes
  useEffect(() => {
    if (!authLoading) {
      // Ensure we show loading state when starting to fetch
      setIsLoading(true)
      fetchBattles()
    }
  }, [user, authLoading])

  const refetch = async () => {
    await fetchBattles()
  }

  return {
    battles,
    loading: isLoading || authLoading,
    refetch
  }
}
