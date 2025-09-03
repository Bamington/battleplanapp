import { useState, useEffect, useMemo } from 'react'
import { useBattles } from './useBattles'
import { useGames } from './useGames'
import type { BattleFilters } from '../components/BattleFilters'

interface GameStats {
  game_name: string
  game_uid: string
  battles: number
  wins: number
  losses: number
  draws: number
  winRate: number
  favoriteOpponents: OpponentStats[]
  averageBattlesPerMonth: number
}

interface OpponentStats {
  name: string
  battles: number
  wins: number
  losses: number
  draws: number
  winRate: number
}

interface LocationStats {
  name: string
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
  favoriteOpponents: OpponentStats[]
  frequentLocations: LocationStats[]
  battlesByMonth: { month: string; battles: number }[]
  longestWinStreak: number
  longestLossStreak: number
  mostActivePeriod: { period: string; battles: number }
  filteredBattleCount: number
}

export function useFilteredBattleStatistics() {
  const { battles, loading: battlesLoading, hasInitialized } = useBattles()
  const { games, loading: gamesLoading } = useGames()
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  
  // Initialize empty filters
  const [filters, setFilters] = useState<BattleFilters>({
    selectedGames: [],
    selectedOpponents: [],
    selectedResults: [],
    dateFrom: '',
    dateTo: '',
    searchQuery: ''
  })

  // Filter battles based on current filters
  const filteredBattles = useMemo(() => {
    if (!hasInitialized || battles.length === 0) {
      return []
    }

    return battles.filter(battle => {
      // Game filter
      if (filters.selectedGames.length > 0) {
        if (!battle.game_uid || !filters.selectedGames.includes(battle.game_uid)) {
          return false
        }
      }

      // Opponent filter
      if (filters.selectedOpponents.length > 0) {
        if (!battle.opp_name || !filters.selectedOpponents.includes(battle.opp_name)) {
          return false
        }
      }

      // Result filter
      if (filters.selectedResults.length > 0) {
        const result = battle.result?.toLowerCase() || ''
        let matchesResult = false
        
        filters.selectedResults.forEach(selectedResult => {
          if (selectedResult === 'win' && (result.includes('i won') || result.includes('win'))) {
            matchesResult = true
          } else if (selectedResult === 'loss' && !result.includes('i won') && !result.includes('win') && !result.includes('draw') && !result.includes('tie')) {
            matchesResult = true
          } else if (selectedResult === 'draw' && (result.includes('draw') || result.includes('tie'))) {
            matchesResult = true
          }
        })

        if (!matchesResult) return false
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const battleDate = battle.date_played ? new Date(battle.date_played) : new Date(battle.created_at)
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom)
          if (battleDate < fromDate) return false
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo)
          toDate.setHours(23, 59, 59, 999) // Include the entire "to" day
          if (battleDate > toDate) return false
        }
      }

      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const searchableText = [
          battle.battle_name,
          battle.opp_name,
          battle.game_name,
          battle.battle_notes,
          battle.result
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(query)) return false
      }

      return true
    })
  }, [battles, hasInitialized, filters])

  // Get unique opponents from all battles (for filter options)
  const allOpponents = useMemo(() => {
    if (!hasInitialized) return []
    
    const opponents = new Set<string>()
    battles.forEach(battle => {
      if (battle.opp_name) {
        opponents.add(battle.opp_name)
      }
    })
    return Array.from(opponents).sort()
  }, [battles, hasInitialized])

  // Get only games that have battles recorded (for filter options)
  const gamesWithBattles = useMemo(() => {
    if (!hasInitialized || !games) return []
    
    const gameIdsWithBattles = new Set<string>()
    battles.forEach(battle => {
      if (battle.game_uid) {
        gameIdsWithBattles.add(battle.game_uid)
      }
    })
    
    return games.filter(game => gameIdsWithBattles.has(game.id))
  }, [battles, hasInitialized, games])

  const statistics = useMemo((): BattleStatistics => {
    if (!hasInitialized || filteredBattles.length === 0) {
      return {
        totalBattles: 0,
        totalWins: 0,
        totalLosses: 0,
        totalDraws: 0,
        overallWinRate: 0,
        mostPlayedGames: [],
        favoriteOpponents: [],
        frequentLocations: [],
        battlesByMonth: [],
        longestWinStreak: 0,
        longestLossStreak: 0,
        mostActivePeriod: { period: '', battles: 0 },
        filteredBattleCount: 0
      }
    }

    // Calculate overall stats
    const totalBattles = filteredBattles.length
    let totalWins = 0
    let totalLosses = 0
    let totalDraws = 0

    // Group battles by game
    const gameStats: { [key: string]: GameStats } = {}
    // Group battles by opponent
    const opponentStats: { [key: string]: OpponentStats } = {}
    // Group battles by location
    const locationStats: { [key: string]: LocationStats } = {}
    // Group battles by month for trend analysis
    const monthlyStats: { [key: string]: number } = {}

    // Process each battle
    filteredBattles.forEach(battle => {
      const gameKey = battle.game_uid || battle.game_name || 'Unknown Game'
      const gameName = battle.game_name || 'Unknown Game'
      const opponentName = battle.opp_name || 'Unknown Opponent'
      const locationName = battle.location || 'No Location'
      
      // Initialize game stats if not exists
      if (!gameStats[gameKey]) {
        gameStats[gameKey] = {
          game_name: gameName,
          game_uid: battle.game_uid || '',
          battles: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0,
          favoriteOpponents: [],
          averageBattlesPerMonth: 0
        }
      }

      // Initialize opponent stats if not exists
      if (!opponentStats[opponentName]) {
        opponentStats[opponentName] = {
          name: opponentName,
          battles: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0
        }
      }

      // Initialize location stats if not exists
      if (!locationStats[locationName]) {
        locationStats[locationName] = {
          name: locationName,
          battles: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          winRate: 0
        }
      }

      // Increment battle counts
      gameStats[gameKey].battles++
      opponentStats[opponentName].battles++
      locationStats[locationName].battles++

      // Group by month
      const battleDate = battle.date_played ? new Date(battle.date_played) : new Date(battle.created_at)
      const monthKey = `${battleDate.getFullYear()}-${String(battleDate.getMonth() + 1).padStart(2, '0')}`
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1

      // Categorize result
      const result = battle.result?.toLowerCase() || ''
      
      if (result.includes('i won') || result.includes('win')) {
        gameStats[gameKey].wins++
        opponentStats[opponentName].wins++
        locationStats[locationName].wins++
        totalWins++
      } else if (result.includes('draw') || result.includes('tie')) {
        gameStats[gameKey].draws++
        opponentStats[opponentName].draws++
        locationStats[locationName].draws++
        totalDraws++
      } else {
        gameStats[gameKey].losses++
        opponentStats[opponentName].losses++
        locationStats[locationName].losses++
        totalLosses++
      }
    })

    // Calculate win rates and favorite opponents for each game
    Object.values(gameStats).forEach(game => {
      const totalGames = game.wins + game.losses + game.draws
      game.winRate = totalGames > 0 ? (game.wins / totalGames) * 100 : 0

      // Find favorite opponents for this game
      const gameOpponents: { [key: string]: OpponentStats } = {}
      filteredBattles
        .filter(battle => (battle.game_uid || battle.game_name) === (game.game_uid || game.game_name))
        .forEach(battle => {
          const oppName = battle.opp_name || 'Unknown Opponent'
          if (!gameOpponents[oppName]) {
            gameOpponents[oppName] = {
              name: oppName,
              battles: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              winRate: 0
            }
          }
          gameOpponents[oppName].battles++

          const result = battle.result?.toLowerCase() || ''
          if (result.includes('i won') || result.includes('win')) {
            gameOpponents[oppName].wins++
          } else if (result.includes('draw') || result.includes('tie')) {
            gameOpponents[oppName].draws++
          } else {
            gameOpponents[oppName].losses++
          }
        })

      // Calculate win rates and sort
      Object.values(gameOpponents).forEach(opp => {
        const total = opp.wins + opp.losses + opp.draws
        opp.winRate = total > 0 ? (opp.wins / total) * 100 : 0
      })

      game.favoriteOpponents = Object.values(gameOpponents)
        .sort((a, b) => b.battles - a.battles)
        .slice(0, 3)
    })

    // Calculate win rates for opponents
    Object.values(opponentStats).forEach(opponent => {
      const total = opponent.wins + opponent.losses + opponent.draws
      opponent.winRate = total > 0 ? (opponent.wins / total) * 100 : 0
    })

    // Calculate win rates for locations
    Object.values(locationStats).forEach(location => {
      const total = location.wins + location.losses + location.draws
      location.winRate = total > 0 ? (location.wins / total) * 100 : 0
    })

    // Sort games by most played, then by win rate
    const mostPlayedGames = Object.values(gameStats)
      .sort((a, b) => {
        if (a.battles !== b.battles) {
          return b.battles - a.battles
        }
        return b.winRate - a.winRate
      })
      .slice(0, 5)

    // Sort opponents by most played
    const favoriteOpponents = Object.values(opponentStats)
      .sort((a, b) => b.battles - a.battles)
      .slice(0, 5)

    // Sort locations by most played
    const frequentLocations = Object.values(locationStats)
      .sort((a, b) => b.battles - a.battles)
      .slice(0, 5)

    // Create battles by month array
    const battlesByMonth = Object.entries(monthlyStats)
      .map(([month, battles]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        }),
        battles
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Calculate streaks
    let longestWinStreak = 0
    let longestLossStreak = 0
    let currentWinStreak = 0
    let currentLossStreak = 0

    // Sort battles by date for streak calculation
    const sortedBattles = [...filteredBattles].sort((a, b) => {
      const dateA = new Date(a.date_played || a.created_at)
      const dateB = new Date(b.date_played || b.created_at)
      return dateA.getTime() - dateB.getTime()
    })

    sortedBattles.forEach(battle => {
      const result = battle.result?.toLowerCase() || ''
      
      if (result.includes('i won') || result.includes('win')) {
        currentWinStreak++
        currentLossStreak = 0
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak)
      } else if (!result.includes('draw') && !result.includes('tie')) {
        currentLossStreak++
        currentWinStreak = 0
        longestLossStreak = Math.max(longestLossStreak, currentLossStreak)
      } else {
        // Draw - reset both streaks
        currentWinStreak = 0
        currentLossStreak = 0
      }
    })

    // Find most active period
    const mostActivePeriod = battlesByMonth.length > 0 
      ? battlesByMonth.reduce((max, current) => current.battles > max.battles ? current : max)
      : { period: '', battles: 0 }

    // Calculate overall win rate
    const totalDecisiveGames = totalWins + totalLosses
    const overallWinRate = totalDecisiveGames > 0 ? (totalWins / totalDecisiveGames) * 100 : 0

    return {
      totalBattles,
      totalWins,
      totalLosses,
      totalDraws,
      overallWinRate,
      mostPlayedGames,
      favoriteOpponents,
      frequentLocations,
      battlesByMonth,
      longestWinStreak,
      longestLossStreak,
      mostActivePeriod: { period: mostActivePeriod.month, battles: mostActivePeriod.battles },
      filteredBattleCount: totalBattles
    }
  }, [filteredBattles, hasInitialized])

  useEffect(() => {
    // Show loading if either battles or games are loading, but only for initial load
    const anyLoading = battlesLoading || gamesLoading
    
    if (!hasLoadedOnce && hasInitialized && !gamesLoading) {
      setHasLoadedOnce(true)
      setLoading(false)
    } else if ((!hasInitialized || gamesLoading) && !hasLoadedOnce) {
      setLoading(anyLoading)
    } else {
      // Once we've loaded initially, never show loading again
      setLoading(false)
    }
  }, [battlesLoading, gamesLoading, hasInitialized, hasLoadedOnce])

  const clearFilters = () => {
    setFilters({
      selectedGames: [],
      selectedOpponents: [],
      selectedResults: [],
      dateFrom: '',
      dateTo: '',
      searchQuery: ''
    })
  }

  const hasActiveFilters = 
    filters.selectedGames.length > 0 || 
    filters.selectedOpponents.length > 0 || 
    filters.selectedResults.length > 0 || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.searchQuery.length > 0

  return {
    statistics,
    loading,
    hasInitialized,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    allOpponents,
    games: gamesWithBattles,
    totalUnfilteredBattles: battles.length
  }
}