import { useState, useEffect } from 'react'

const RECENT_GAMES_KEY = 'mini-myths-recent-games'
const MAX_RECENT_GAMES = 3

interface RecentGame {
  id: string
  name: string
  icon: string | null
  lastUsed: number
}

export function useRecentGames() {
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])

  useEffect(() => {
    // Load recent games from localStorage on mount
    loadRecentGames()
  }, [])

  const loadRecentGames = () => {
    try {
      const stored = localStorage.getItem(RECENT_GAMES_KEY)
      if (stored) {
        const games = JSON.parse(stored) as RecentGame[]
        // Sort by lastUsed (most recent first) and take only the max number
        const sortedGames = games
          .sort((a, b) => b.lastUsed - a.lastUsed)
          .slice(0, MAX_RECENT_GAMES)
        setRecentGames(sortedGames)
      }
    } catch (error) {
      console.error('Error loading recent games:', error)
      setRecentGames([])
    }
  }

  const addRecentGame = (game: { id: string; name: string; icon: string | null }) => {
    try {
      const now = Date.now()
      const newGame: RecentGame = {
        id: game.id,
        name: game.name,
        icon: game.icon,
        lastUsed: now
      }

      // Get current recent games
      const stored = localStorage.getItem(RECENT_GAMES_KEY)
      let currentGames: RecentGame[] = []
      
      if (stored) {
        currentGames = JSON.parse(stored) as RecentGame[]
      }

      // Remove the game if it already exists
      currentGames = currentGames.filter(g => g.id !== game.id)
      
      // Add the new game at the beginning
      currentGames.unshift(newGame)
      
      // Keep only the most recent games
      currentGames = currentGames.slice(0, MAX_RECENT_GAMES)
      
      // Save to localStorage
      localStorage.setItem(RECENT_GAMES_KEY, JSON.stringify(currentGames))
      
      // Update state
      setRecentGames(currentGames)
    } catch (error) {
      console.error('Error saving recent game:', error)
    }
  }

  const clearRecentGames = () => {
    try {
      localStorage.removeItem(RECENT_GAMES_KEY)
      setRecentGames([])
    } catch (error) {
      console.error('Error clearing recent games:', error)
    }
  }

  return {
    recentGames,
    addRecentGame,
    clearRecentGames
  }
}