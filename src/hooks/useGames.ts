import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useGameIcons, gameIconsCache } from './useGameIcons'

interface Game {
  id: string
  name: string
  icon: string | null
}

let gamesCache: Game[] | null = null
let cacheExpiry: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useGames() {
  const [games, setGames] = useState<Game[]>(gamesCache || [])
  const [loading, setLoading] = useState(!gamesCache)
  const [error, setError] = useState<string | null>(null)
  const { cacheInitialized: gameIconsCacheInitialized } = useGameIcons()

  useEffect(() => {
    fetchGames()
  }, [gameIconsCacheInitialized])

  const fetchGames = async () => {
    try {
      // Check if cache is valid
      if (gamesCache && Date.now() < cacheExpiry) {
        setGames(gamesCache)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Only fetch basic game info (id, name) - icons come from the game icons cache
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, name')
        .order('name')

      if (fetchError) throw fetchError

      // Combine game data with cached icons
      const gamesList: Game[] = (data || []).map(game => ({
        ...game,
        icon: gameIconsCache[game.id] || null
      }))
      
      // Update cache
      gamesCache = gamesList
      cacheExpiry = Date.now() + CACHE_DURATION
      
      setGames(gamesList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games')
      console.error('Error fetching games:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    gamesCache = null
    cacheExpiry = 0
  }

  return { games, loading, error, refetch: fetchGames, clearCache }
}