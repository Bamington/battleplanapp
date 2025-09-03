import { useState, useEffect, useMemo } from 'react'
import { useBattles } from './useBattles'

interface GameStats {
  game_name: string
  game_uid: string
  battles: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

interface BattleStatistics {
  totalBattles: number
  totalWins: number
  totalLosses: number
  totalDraws: number
  overallWinRate: number
  mostPlayedGames: GameStats[]
}

export function useBattleStatistics() {
  const { battles, loading: battlesLoading, hasInitialized } = useBattles()
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const statistics = useMemo((): BattleStatistics => {
    if (!hasInitialized || battles.length === 0) {
      return {
        totalBattles: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        overallWinRate: 0,
        mostPlayedGames: []
      }
    }

    // Calculate overall stats
    const totalBattles = battles.length
    let totalWins = 0
    let totalLosses = 0
    let totalDraws = 0

    // Group battles by game
    const gameStats: { [key: string]: GameStats } = {}

    battles.forEach(battle => {
      const gameKey = battle.game_uid || battle.game_name || 'Unknown Game'
      const gameName = battle.game_name || 'Unknown Game'
      
      // Initialize game stats if not exists
      if (!gameStats[gameKey]) {
        gameStats[gameKey] = {
          game_name: gameName,
          game_uid: battle.game_uid || '',
          battles: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0
        }
      }

      // Increment battle count for this game
      gameStats[gameKey].battles++

      // Categorize result
      const result = battle.result?.toLowerCase() || ''
      
      if (result.includes('i won') || result.includes('win')) {
        gameStats[gameKey].wins++
        totalWins++
      } else if (result.includes('draw') || result.includes('tie')) {
        gameStats[gameKey].draws++
        totalDraws++
      } else {
        // Anything else counts as a loss (opponent won, etc.)
        gameStats[gameKey].losses++
        totalLosses++
      }
    })

    // Calculate win rates for each game
    Object.values(gameStats).forEach(game => {
      const totalGames = game.wins + game.losses + game.draws
      game.winRate = totalGames > 0 ? (game.wins / totalGames) * 100 : 0
    })

    // Sort games by most played, then by win rate
    const mostPlayedGames = Object.values(gameStats)
      .sort((a, b) => {
        if (a.battles !== b.battles) {
          return b.battles - a.battles // Most played first
        }
        return b.winRate - a.winRate // Higher win rate first for ties
      })
      .slice(0, 5) // Top 5 games

    // Calculate overall win rate
    const totalDecisiveGames = totalWins + totalLosses
    const overallWinRate = totalDecisiveGames > 0 ? (totalWins / totalDecisiveGames) * 100 : 0

    return {
      totalBattles,
      totalWins,
      totalLosses,
      totalDraws,
      overallWinRate,
      mostPlayedGames
    }
  }, [battles, hasInitialized])

  useEffect(() => {
    // Only show loading state for initial load, not for refetches
    if (!hasLoadedOnce && hasInitialized) {
      setHasLoadedOnce(true)
      setLoading(false)
    } else if (!hasInitialized && !hasLoadedOnce) {
      setLoading(battlesLoading)
    } else {
      // Once we've loaded initially, never show loading again
      setLoading(false)
    }
  }, [battlesLoading, hasInitialized, hasLoadedOnce])

  return {
    statistics,
    loading,
    hasInitialized
  }
}