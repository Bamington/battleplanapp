import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Battle {
  id: number
  battle_name: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
  created_at: string
}

export function useBattles() {
  const [battles, setBattles] = useState<Battle[]>([])
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const { user } = useAuth()

  const fetchBattles = async () => {
    if (!user) {
      setBattles([])
      setLoading(false)
      setHasInitialized(true)
      return
    }

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('user_id', user.id) // Filter by user_id for proper isolation
        .order('date_played', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching battles:', error)
        setBattles([])
      } else {
        // Fetch game icons for battles that have game_uid
        const battlesWithIcons = await Promise.all(
          (data || []).map(async (battle) => {
            if (battle.game_uid) {
              try {
                const { data: gameData } = await supabase
                  .from('games')
                  .select('icon')
                  .eq('id', battle.game_uid)
                  .single()
                
                return {
                  ...battle,
                  game_icon: gameData?.icon || null
                }
              } catch (gameError) {
                console.warn('Failed to fetch game icon for battle:', battle.id, gameError)
                return {
                  ...battle,
                  game_icon: null
                }
              }
            } else {
              return {
                ...battle,
                game_icon: null
              }
            }
          })
        )
        
        setBattles(battlesWithIcons)
      }
    } catch (error) {
      console.error('Error fetching battles:', error)
      setBattles([])
    } finally {
      setLoading(false)
      setHasInitialized(true)
    }
  }

  useEffect(() => {
    fetchBattles()
  }, [user])

  const refetch = () => {
    fetchBattles()
  }

  return {
    battles,
    loading,
    hasInitialized,
    refetch
  }
}
