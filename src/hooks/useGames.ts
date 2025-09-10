import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useGameIcons, gameIconsCache } from './useGameIcons'

interface Game {
  id: string
  name: string
  icon: string | null
}

// User-specific cache
const gamesCache: Record<string, { games: Game[], expiry: number }> = {}
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { cacheInitialized: gameIconsCacheInitialized } = useGameIcons()

  useEffect(() => {
    if (user) {
      fetchGames()
    }
  }, [gameIconsCacheInitialized, user])

  const fetchGames = async () => {
    try {
      if (!user) return

      const cacheKey = user.id
      
      // Check if cache is valid
      if (gamesCache[cacheKey] && Date.now() < gamesCache[cacheKey].expiry) {
        setGames(gamesCache[cacheKey].games)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      // Fetch games that are either supported=true OR created by the current user
      const { data, error: fetchError } = await supabase
        .from('games')
        .select('id, name')
        .or(`supported.eq.true,created_by.eq.${user.id},created_by.is.null`)
        .order('name')

      if (fetchError) throw fetchError

      // Combine game data with cached icons
      const gamesList: Game[] = (data || []).map(game => ({
        ...game,
        icon: gameIconsCache[game.id] || null
      }))
      
      // Update cache
      gamesCache[cacheKey] = {
        games: gamesList,
        expiry: Date.now() + CACHE_DURATION
      }
      
      setGames(gamesList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games')
      console.error('Error fetching games:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    if (user) {
      delete gamesCache[user.id]
    }
  }

  const createGame = async (gameName: string): Promise<Game> => {
    if (!user) {
      throw new Error('User must be authenticated to create games')
    }

    if (!gameName.trim()) {
      throw new Error('Game name is required')
    }

    const { data, error } = await supabase
      .from('games')
      .insert({
        name: gameName.trim(),
        created_by: user.id,
        supported: false
      })
      .select('id, name')
      .single()

    if (error) throw error

    const newGame: Game = {
      ...data,
      icon: null
    }

    // Update cache with the new game
    const cacheKey = user.id
    if (gamesCache[cacheKey]) {
      const updatedGames = [...gamesCache[cacheKey].games, newGame].sort((a, b) => a.name.localeCompare(b.name))
      gamesCache[cacheKey] = {
        games: updatedGames,
        expiry: gamesCache[cacheKey].expiry
      }
      setGames(updatedGames)
    } else {
      // If no cache, refresh
      fetchGames()
    }

    return newGame
  }

  const deleteGame = async (gameId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to delete games')
    }

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameId)
      .eq('created_by', user.id) // Only allow deleting games created by the current user

    if (error) throw error

    // Update cache by removing the deleted game
    const cacheKey = user.id
    if (gamesCache[cacheKey]) {
      const updatedGames = gamesCache[cacheKey].games.filter(game => game.id !== gameId)
      gamesCache[cacheKey] = {
        games: updatedGames,
        expiry: gamesCache[cacheKey].expiry
      }
      setGames(updatedGames)
    } else {
      // If no cache, refresh
      fetchGames()
    }
  }

  return { games, loading, error, refetch: fetchGames, clearCache, createGame, deleteGame }
}