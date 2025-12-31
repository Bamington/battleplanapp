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

interface YearlyStats {
  year: number
  modelsPurchased: number
  modelsPainted: number
}

interface YearlyGamePainted {
  [year: number]: {
    game_id: string
    game_name: string
    paintedModels: number
  }[]
}

interface YearlyPaintSummary {
  [year: number]: {
    firstPainted?: { name: string; gameName: string; date: string }
    lastPainted?: { name: string; gameName: string; date: string }
  }
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
  yearlyStats: YearlyStats[]
  yearlyPaintedByGame: YearlyGamePainted
  yearlyPaintSummary: YearlyPaintSummary
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
        yearlyStats: [],
        yearlyPaintedByGame: {},
        yearlyPaintSummary: {},
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
        yearlyStats: [],
        yearlyPaintedByGame: {},
        yearlyPaintSummary: {},
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
    // Group models by year for year-over-year view (purchases + painted)
    const yearlyStats: { [key: string]: { purchased: number; painted: number } } = {}
    // Track painted models per game per year
    const yearlyPaintedGameStats: { 
      [year: string]: { 
        [gameId: string]: { game_id: string; game_name: string; paintedModels: number } 
      } 
    } = {}
    // Track first/last painted model per year
    const yearlyPaintSummary: { 
      [year: string]: { 
        firstPainted?: { name: string; date: string }
        lastPainted?: { name: string; date: string }
      } 
    } = {}

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

      // Track monthly activity (creation date) and yearly purchases
      const createdDate = new Date(model.created_at)
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`
      const purchaseDate = model.purchase_date || model.box?.purchase_date || model.created_at
      const purchaseYear = new Date(purchaseDate).getFullYear()
      const purchaseYearKey = `${purchaseYear}`
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { added: 0, painted: 0 }
      }
      monthlyStats[monthKey].added += modelCount

      if (!yearlyStats[purchaseYearKey]) {
        yearlyStats[purchaseYearKey] = { purchased: 0, painted: 0 }
      }
      yearlyStats[purchaseYearKey].purchased += modelCount

      // Track painting activity by month
      if (isPainted && model.painted_date) {
        const paintedDate = new Date(model.painted_date)
        const paintedMonthKey = `${paintedDate.getFullYear()}-${String(paintedDate.getMonth() + 1).padStart(2, '0')}`
        const paintedYearKey = `${paintedDate.getFullYear()}`
        
        if (!monthlyStats[paintedMonthKey]) {
          monthlyStats[paintedMonthKey] = { added: 0, painted: 0 }
        }
        monthlyStats[paintedMonthKey].painted += modelCount

        if (!yearlyStats[paintedYearKey]) {
          yearlyStats[paintedYearKey] = { purchased: 0, painted: 0 }
        }
        yearlyStats[paintedYearKey].painted += modelCount

        if (!yearlyPaintedGameStats[paintedYearKey]) {
          yearlyPaintedGameStats[paintedYearKey] = {}
        }
        if (!yearlyPaintedGameStats[paintedYearKey][gameKey]) {
          yearlyPaintedGameStats[paintedYearKey][gameKey] = {
            game_id: gameKey,
            game_name: gameName,
            paintedModels: 0
          }
        }
        yearlyPaintedGameStats[paintedYearKey][gameKey].paintedModels += modelCount

        if (!yearlyPaintSummary[paintedYearKey]) {
          yearlyPaintSummary[paintedYearKey] = {}
        }
        const summary = yearlyPaintSummary[paintedYearKey]
        const paintedDateIso = new Date(model.painted_date).toISOString()
        const paintedGameName = model.game?.name || model.box?.game?.name || 'Unknown Game'
        // first painted (earliest date)
        if (!summary.firstPainted || paintedDateIso < summary.firstPainted.date) {
          summary.firstPainted = { 
            name: model.name || 'Unknown Model', 
            gameName: paintedGameName,
            date: paintedDateIso 
          }
        }
        // last painted (latest date)
        if (!summary.lastPainted || paintedDateIso > summary.lastPainted.date) {
          summary.lastPainted = { 
            name: model.name || 'Unknown Model', 
            gameName: paintedGameName,
            date: paintedDateIso 
          }
        }
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

    // Calculate yearly trends
    const modelsByYear = Object.entries(yearlyStats)
      .map(([year, stats]) => ({
        year: parseInt(year, 10),
        modelsPurchased: stats.purchased,
        modelsPainted: stats.painted
      }))
      .sort((a, b) => b.year - a.year)

    // Calculate yearly painted per game (convert nested map to arrays)
    const yearlyPaintedByGame: YearlyGamePainted = Object.entries(yearlyPaintedGameStats).reduce((acc, [year, games]) => {
      const yearNum = parseInt(year, 10)
      acc[yearNum] = Object.values(games)
        .filter(game => game.paintedModels > 0)
        .sort((a, b) => b.paintedModels - a.paintedModels || a.game_name.localeCompare(b.game_name))
      return acc
    }, {} as YearlyGamePainted)

    const yearlyPaintSummaryFinal: YearlyPaintSummary = Object.entries(yearlyPaintSummary).reduce((acc, [year, summary]) => {
      acc[parseInt(year, 10)] = summary
      return acc
    }, {} as YearlyPaintSummary)

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
      yearlyStats: modelsByYear,
      yearlyPaintedByGame,
      yearlyPaintSummary: yearlyPaintSummaryFinal,
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
