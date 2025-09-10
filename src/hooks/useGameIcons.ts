import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface GameIcon {
  id: string
  name: string
  icon: string | null
}

interface GameIconsCache {
  [gameId: string]: string | null
}

let gameIconsCache: GameIconsCache = {}
let cacheInitialized = false
let cachePromise: Promise<void> | null = null

export function useGameIcons() {
  const [isLoading, setIsLoading] = useState(!cacheInitialized)
  const [error, setError] = useState<string | null>(null)

  const initializeCache = async () => {
    if (cacheInitialized || cachePromise) {
      return cachePromise || Promise.resolve()
    }

    cachePromise = (async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('games')
          .select('id, name, icon')

        if (fetchError) {
          console.error('Error fetching game icons:', fetchError)
          setError('Failed to load game icons')
          return
        }

        // Build the cache
        const newCache: GameIconsCache = {}
        
        data?.forEach((game: GameIcon) => {
          newCache[game.id] = game.icon
          // Also cache by name for backwards compatibility
          if (game.name) {
            newCache[game.name] = game.icon
          }
        })

        gameIconsCache = newCache
        cacheInitialized = true
      } catch (err) {
        console.error('Error initializing game icons cache:', err)
        setError('Failed to initialize game icons cache')
      } finally {
        setIsLoading(false)
      }
    })()

    return cachePromise
  }

  useEffect(() => {
    initializeCache()
  }, [])

  const getGameIcon = (gameId: string | null | undefined): string | null => {
    if (!gameId || !cacheInitialized) return null
    return gameIconsCache[gameId] || null
  }

  const isValidGameIcon = (iconUrl: string | null | undefined): boolean => {
    return !!(iconUrl && 
      typeof iconUrl === 'string' &&
      iconUrl.trim() !== '' && 
      iconUrl !== 'undefined' && 
      iconUrl !== 'null' &&
      iconUrl.startsWith('http') &&
      iconUrl.includes('game-assets'))
  }

  const clearCache = () => {
    gameIconsCache = {}
    cacheInitialized = false
    cachePromise = null
  }

  const refreshCache = async () => {
    clearCache()
    await initializeCache()
  }

  return {
    isLoading,
    error,
    getGameIcon,
    isValidGameIcon,
    cacheInitialized,
    clearCache,
    refreshCache
  }
}

// Export the cache for direct access if needed
export { gameIconsCache }