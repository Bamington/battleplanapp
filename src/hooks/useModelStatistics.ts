import { useState, useEffect, useMemo } from 'react'
import { useModels } from './useModels'

interface GameStats {
  game_name: string
  game_id: string
  totalModels: number
  paintedModels: number
  unpaintedModels: number
  assembledModels: number
  unassembledModels: number
  paintingRate: number
  assemblyRate: number
}

interface StatusStats {
  status: string
  count: number
  percentage: number
}

interface MonthlyStats {
  month: string
  modelsAdded: number
  modelsPainted: number
}

interface ModelStatistics {
  totalModels: number
  totalPainted: number
  totalUnpainted: number
  totalAssembled: number
  totalUnassembled: number
  overallPaintingRate: number
  overallAssemblyRate: number
  statusBreakdown: StatusStats[]
  mostPlayedGames: GameStats[]
  modelsByMonth: MonthlyStats[]
  averageModelsPerGame: number
  mostProductiveMonth: { month: string; modelsPainted: number }
  longestPaintingStreak: number
  recentActivity: { period: string; modelsAdded: number }
}

export function useModelStatistics() {
  const { models, loading: modelsLoading } = useModels()
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const statistics = useMemo((): ModelStatistics => {
    if (modelsLoading) {
      return {
        totalModels: 0,
        totalPainted: 0,
        totalUnpainted: 0,
        totalAssembled: 0,
        totalUnassembled: 0,
        overallPaintingRate: 0,
        overallAssemblyRate: 0,
        statusBreakdown: [],
        mostPlayedGames: [],
        modelsByMonth: [],
        averageModelsPerGame: 0,
        mostProductiveMonth: { month: '', modelsPainted: 0 },
        longestPaintingStreak: 0,
        recentActivity: { period: '', modelsAdded: 0 }
      }
    }

    if (models.length === 0) {
      return {
        totalModels: 0,
        totalPainted: 0,
        totalUnpainted: 0,
        totalAssembled: 0,
        totalUnassembled: 0,
        overallPaintingRate: 0,
        overallAssemblyRate: 0,
        statusBreakdown: [],
        mostPlayedGames: [],
        modelsByMonth: [],
        averageModelsPerGame: 0,
        mostProductiveMonth: { month: '', modelsPainted: 0 },
        longestPaintingStreak: 0,
        recentActivity: { period: '', modelsAdded: 0 }
      }
    }

    // Calculate overall stats using model count
    const totalModels = models.reduce((sum, model) => sum + (model.count || 1), 0)
    let totalPainted = 0
    let totalUnpainted = 0
    let totalAssembled = 0
    let totalUnassembled = 0

    // Group models by game
    const gameStats: { [key: string]: GameStats } = {}
    // Group models by status
    const statusStats: { [key: string]: number } = {}
    // Group models by month for trend analysis
    const monthlyStats: { [key: string]: { added: number; painted: number } } = {}

    // Process each model
    models.forEach(model => {
      const gameKey = model.game_id || 'Unknown Game'
      const gameName = model.game?.name || 'Unknown Game'
      const modelCount = model.count || 1
      
      // Initialize game stats if not exists
      if (!gameStats[gameKey]) {
        gameStats[gameKey] = {
          game_name: gameName,
          game_id: gameKey,
          totalModels: 0,
          paintedModels: 0,
          unpaintedModels: 0,
          assembledModels: 0,
          unassembledModels: 0,
          paintingRate: 0,
          assemblyRate: 0
        }
      }

      // Increment model count for this game
      gameStats[gameKey].totalModels += modelCount

      // Categorize by painting status
      const isPainted = model.painted_date !== null
      if (isPainted) {
        gameStats[gameKey].paintedModels += modelCount
        totalPainted += modelCount
      } else {
        gameStats[gameKey].unpaintedModels += modelCount
        totalUnpainted += modelCount
      }

      // Categorize by assembly status
      const isAssembled = model.status?.toLowerCase().includes('assembled') || 
                         model.status?.toLowerCase().includes('painted')
      if (isAssembled) {
        gameStats[gameKey].assembledModels += modelCount
        totalAssembled += modelCount
      } else {
        gameStats[gameKey].unassembledModels += modelCount
        totalUnassembled += modelCount
      }

      // Track status breakdown
      const status = model.status || 'Unknown'
      statusStats[status] = (statusStats[status] || 0) + modelCount

      // Track monthly activity
      const createdDate = new Date(model.created_at)
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { added: 0, painted: 0 }
      }
      monthlyStats[monthKey].added += modelCount

      // Track painting activity by month
      if (isPainted && model.painted_date) {
        const paintedDate = new Date(model.painted_date)
        const paintedMonthKey = `${paintedDate.getFullYear()}-${String(paintedDate.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyStats[paintedMonthKey]) {
          monthlyStats[paintedMonthKey] = { added: 0, painted: 0 }
        }
        monthlyStats[paintedMonthKey].painted += modelCount
      }
    })

    // Calculate rates for each game
    Object.values(gameStats).forEach(game => {
      game.paintingRate = game.totalModels > 0 ? (game.paintedModels / game.totalModels) * 100 : 0
      game.assemblyRate = game.totalModels > 0 ? (game.assembledModels / game.totalModels) * 100 : 0
    })

    // Sort games by most models, then by painting rate
    const mostPlayedGames = Object.values(gameStats)
      .sort((a, b) => {
        if (a.totalModels !== b.totalModels) {
          return b.totalModels - a.totalModels // Most models first
        }
        return b.paintingRate - a.paintingRate // Higher painting rate first for ties
      })
      // Remove slice limit to allow "Show more" functionality

    // Calculate status breakdown
    const statusBreakdown = Object.entries(statusStats)
      .map(([status, count]) => ({
        status,
        count,
        percentage: (count / totalModels) * 100
      }))
      .sort((a, b) => b.count - a.count)

    // Calculate monthly trends
    const modelsByMonth = Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month,
        modelsAdded: stats.added,
        modelsPainted: stats.painted
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Calculate overall rates
    const overallPaintingRate = totalModels > 0 ? (totalPainted / totalModels) * 100 : 0
    const overallAssemblyRate = totalModels > 0 ? (totalAssembled / totalModels) * 100 : 0

    // Calculate average models per game
    const uniqueGames = Object.keys(gameStats).length
    const averageModelsPerGame = uniqueGames > 0 ? totalModels / uniqueGames : 0

    // Find most productive month
    const mostProductiveMonth = modelsByMonth.reduce((max, current) => 
      current.modelsPainted > max.modelsPainted ? current : max,
      { month: '', modelsPainted: 0 }
    )

    // Calculate longest painting streak (consecutive months with painted models)
    let longestStreak = 0
    let currentStreak = 0
    modelsByMonth.forEach(month => {
      if (month.modelsPainted > 0) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    })

    // Calculate recent activity (last 3 months)
    const now = new Date()
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const recentMonths = modelsByMonth.filter(month => {
      const [year, monthNum] = month.month.split('-')
      const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
      return monthDate >= threeMonthsAgo
    })
    
    const recentActivity = {
      period: 'Last 3 months',
      modelsAdded: recentMonths.reduce((sum, month) => sum + month.modelsAdded, 0)
    }

    return {
      totalModels,
      totalPainted,
      totalUnpainted,
      totalAssembled,
      totalUnassembled,
      overallPaintingRate,
      overallAssemblyRate,
      statusBreakdown,
      mostPlayedGames,
      modelsByMonth,
      averageModelsPerGame,
      mostProductiveMonth,
      longestPaintingStreak: longestStreak,
      recentActivity
    }
  }, [models, modelsLoading])

  useEffect(() => {
    // Only show loading state for initial load, not for refetches
    if (!hasLoadedOnce && !modelsLoading) {
      setHasLoadedOnce(true)
      setLoading(false)
    } else if (modelsLoading && !hasLoadedOnce) {
      setLoading(true)
    } else {
      // Once we've loaded initially, never show loading again
      setLoading(false)
    }
  }, [modelsLoading, hasLoadedOnce])

  return {
    statistics,
    loading,
    hasInitialized: !modelsLoading && hasLoadedOnce
  }
}
