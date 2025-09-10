import React, { useState } from 'react'
import { BarChart3, Trophy, Gamepad2, Target, Medal, Crown, Users, TrendingUp, Calendar, Zap, Palette, Wrench, ChevronDown } from 'lucide-react'
import { useModelStatistics } from '../hooks/useModelStatistics'
import { useGameIcons } from '../hooks/useGameIcons'

export function ModelStatisticsPage() {
  const { statistics, loading, hasInitialized } = useModelStatistics()
  const { getGameIcon, isValidGameIcon } = useGameIcons()
  const [showAllGames, setShowAllGames] = useState(false)

  if (loading || !hasInitialized) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-bg-primary rounded-lg p-6">
                  <div className="h-4 bg-border-custom rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-border-custom rounded w-1/2"></div>
                </div>
              ))}
            </div>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-bg-primary rounded-lg p-6">
                  <div className="h-6 bg-border-custom rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-4 bg-border-custom rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (statistics.totalModels === 0) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-secondary-text mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-title mb-4">No Models Yet</h2>
            <p className="text-secondary-text">Add some models to your collection to see statistics!</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Models */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-text text-sm font-medium">Total Models</p>
                <p className="text-3xl font-bold text-title">{statistics.totalModels}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Gamepad2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Painted Models */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-text text-sm font-medium">Painted</p>
                <p className="text-3xl font-bold text-title">{statistics.totalPainted}</p>
                <p className="text-xs text-secondary-text">{statistics.overallPaintingRate.toFixed(1)}% of total</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Palette className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Assembled Models */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-text text-sm font-medium">Assembled</p>
                <p className="text-3xl font-bold text-title">{statistics.totalAssembled}</p>
                <p className="text-xs text-secondary-text">{statistics.overallAssemblyRate.toFixed(1)}% of total</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Wrench className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Average per Game */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary-text text-sm font-medium">Avg per Game</p>
                <p className="text-3xl font-bold text-title">{statistics.averageModelsPerGame.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Breakdown */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <h3 className="text-lg font-semibold text-title mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Status Breakdown
            </h3>
            <div className="space-y-3">
              {statistics.statusBreakdown.slice(0, 5).map((status, index) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-text font-medium">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-title font-semibold">{status.count}</span>
                    <span className="text-secondary-text text-sm ml-2">({status.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Played Games */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <h3 className="text-lg font-semibold text-title mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Top Games by Model Count
            </h3>
            <div className="space-y-3">
              {(showAllGames ? statistics.mostPlayedGames : statistics.mostPlayedGames.slice(0, 5)).map((game, index) => {
                const gameIconUrl = getGameIcon(game.game_id)
                const hasValidIcon = isValidGameIcon(gameIconUrl)
                
                return (
                <div key={game.game_id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary mr-3">
                      {hasValidIcon ? (
                        <img 
                          src={gameIconUrl} 
                          alt={game.game_name}
                          className="w-5 h-5 rounded"
                        />
                      ) : (
                        <Gamepad2 className="w-4 h-4 text-secondary-text" />
                      )}
                    </div>
                    <div>
                      <span className="text-text font-medium">{game.game_name}</span>
                      <p className="text-xs text-secondary-text">
                        {game.paintingRate.toFixed(1)}% painted
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-title font-semibold">{game.totalModels}</span>
                    <p className="text-xs text-secondary-text">models</p>
                  </div>
                </div>
                )
              })}
            </div>
            
            {/* Show More Button */}
            {statistics.mostPlayedGames.length > 5 && (
              <div className="mt-4 pt-4 border-t border-border-custom">
                <button
                  onClick={() => setShowAllGames(!showAllGames)}
                  className="flex items-center justify-center w-full py-2 px-4 text-sm font-medium text-secondary-text hover:text-text hover:bg-bg-secondary rounded-lg transition-colors duration-200"
                >
                  <ChevronDown className={`w-4 h-4 mr-2 transition-transform duration-200 ${showAllGames ? 'rotate-180' : ''}`} />
                  {showAllGames ? 'Show Less' : `Show More (${statistics.mostPlayedGames.length - 5} more)`}
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <h3 className="text-lg font-semibold text-title mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text">Models added ({statistics.recentActivity.period})</span>
                <span className="text-title font-semibold">{statistics.recentActivity.modelsAdded}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text">Most productive month</span>
                <div className="text-right">
                  <span className="text-title font-semibold">{statistics.mostProductiveMonth.modelsPainted}</span>
                  <p className="text-xs text-secondary-text">painted in {statistics.mostProductiveMonth.month}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text">Longest painting streak</span>
                <span className="text-title font-semibold">{statistics.longestPaintingStreak} months</span>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
            <h3 className="text-lg font-semibold text-title mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Monthly Trends (Last 6 months)
            </h3>
            <div className="space-y-2">
              {statistics.modelsByMonth.slice(-6).map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-text text-sm">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-title font-semibold text-sm">{month.modelsAdded}</span>
                      <p className="text-xs text-secondary-text">added</p>
                    </div>
                    <div className="text-right">
                      <span className="text-title font-semibold text-sm">{month.modelsPainted}</span>
                      <p className="text-xs text-secondary-text">painted</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-bg-primary rounded-lg p-6 border border-border-custom">
          <h3 className="text-lg font-semibold text-title mb-4 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Collection Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-title mb-2">{statistics.overallPaintingRate.toFixed(1)}%</div>
              <div className="text-secondary-text text-sm">Painting Progress</div>
              <div className="w-full bg-border-custom rounded-full h-2 mt-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${statistics.overallPaintingRate}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-title mb-2">{statistics.overallAssemblyRate.toFixed(1)}%</div>
              <div className="text-secondary-text text-sm">Assembly Progress</div>
              <div className="w-full bg-border-custom rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${statistics.overallAssemblyRate}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-title mb-2">{statistics.totalUnpainted}</div>
              <div className="text-secondary-text text-sm">Models to Paint</div>
              <div className="w-full bg-border-custom rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(statistics.totalUnpainted / statistics.totalModels) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
