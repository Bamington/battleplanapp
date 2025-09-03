import React from 'react'
import { BarChart3, Trophy, Gamepad2, Target, Medal, Crown, Users, TrendingUp, Calendar, Zap } from 'lucide-react'
import { useFilteredBattleStatistics } from '../hooks/useFilteredBattleStatistics'
import { useGameIcons } from '../hooks/useGameIcons'
import { BattleFiltersComponent } from './BattleFilters'

export function StatisticsPage() {
  const { 
    statistics, 
    loading, 
    hasInitialized, 
    filters, 
    setFilters, 
    clearFilters, 
    hasActiveFilters,
    allOpponents,
    games,
    totalUnfilteredBattles
  } = useFilteredBattleStatistics()
  const { getGameIcon, isValidGameIcon } = useGameIcons()

  if (loading || !hasInitialized) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-bg-card rounded-lg p-6 border border-border-custom">
                  <div className="w-12 h-12 bg-secondary-text opacity-20 rounded-full mx-auto mb-4"></div>
                  <div className="h-6 bg-secondary-text opacity-20 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-8 bg-secondary-text opacity-20 rounded w-1/2 mx-auto"></div>
                </div>
              ))}
            </div>
            
            {/* Most Played Games Skeleton */}
            <div className="bg-bg-card rounded-lg border border-border-custom p-6">
              <div className="h-6 bg-secondary-text opacity-20 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-1/4"></div>
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (statistics.totalBattles === 0) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-bg-secondary rounded-full flex items-center justify-center mb-6">
              <BarChart3 className="w-12 h-12 text-icon" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-4 font-overpass">No Battle Data Yet</h2>
            <p className="text-secondary-text mb-6 max-w-md mx-auto">
              Start logging your battles to see detailed statistics about your gaming performance!
            </p>
            <p className="text-sm text-secondary-text">
              Use the "Battles" tab to log your first battle.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Battle Filters */}
        <BattleFiltersComponent
          games={games}
          opponents={allOpponents}
          filters={filters}
          onFiltersChange={setFilters}
          onClearFilters={clearFilters}
        />

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              <p className="text-blue-800">
                Showing {statistics.filteredBattleCount} of {totalUnfilteredBattles} battles
                {statistics.filteredBattleCount === 0 ? '. Try adjusting your filters.' : '.'}
              </p>
            </div>
          </div>
        )}
        {/* Overall Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Battles */}
          <div className="bg-bg-card rounded-lg p-6 border border-border-custom hover:shadow-[0_8px_25px_rgba(114,77,221,0.15)] transition-all duration-300">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Gamepad2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-text mb-2 text-center">Battles Played</h3>
            <p className="text-3xl font-bold text-text text-center">{statistics.totalBattles}</p>
          </div>

          {/* Win Rate */}
          <div className="bg-bg-card rounded-lg p-6 border border-border-custom hover:shadow-[0_8px_25px_rgba(114,77,221,0.15)] transition-all duration-300">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-text mb-2 text-center">Win Rate</h3>
            <p className="text-3xl font-bold text-center">
              <span className="text-green-600">{statistics.overallWinRate.toFixed(1)}%</span>
            </p>
            <p className="text-sm text-secondary-text text-center mt-1">
              {statistics.totalWins}W - {statistics.totalLosses}L {statistics.totalDraws > 0 && `- ${statistics.totalDraws}D`}
            </p>
          </div>

          {/* Best Performance */}
          <div className="bg-bg-card rounded-lg p-6 border border-border-custom hover:shadow-[0_8px_25px_rgba(114,77,221,0.15)] transition-all duration-300">
            {statistics.mostPlayedGames.length > 0 ? (
              <>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto bg-purple-100">
                  {(() => {
                    const gameIcon = getGameIcon(statistics.mostPlayedGames[0].game_uid)
                    return isValidGameIcon(gameIcon) ? (
                      <img
                        src={gameIcon || ''}
                        alt={`${statistics.mostPlayedGames[0].game_name} icon`}
                        className="w-8 h-8 object-contain rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {statistics.mostPlayedGames[0].game_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )
                  })()}
                </div>
                <h3 className="font-semibold text-text mb-2 text-center">Top Game</h3>
                <p className="text-lg font-semibold text-text text-center truncate">
                  {statistics.mostPlayedGames[0].game_name}
                </p>
                <p className="text-sm text-secondary-text text-center">
                  {statistics.mostPlayedGames[0].battles} battles • {statistics.mostPlayedGames[0].winRate.toFixed(1)}% win rate
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-text mb-2 text-center">Top Game</h3>
                <p className="text-secondary-text text-center">No data</p>
              </>
            )}
          </div>

          {/* Win Streak */}
          <div className="bg-bg-card rounded-lg p-6 border border-border-custom hover:shadow-[0_8px_25px_rgba(114,77,221,0.15)] transition-all duration-300">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-text mb-2 text-center">Best Streak</h3>
            <p className="text-3xl font-bold text-center">
              <span className="text-orange-600">{statistics.longestWinStreak}</span>
            </p>
            <p className="text-sm text-secondary-text text-center mt-1">
              Win streak
            </p>
          </div>
        </div>

        {/* Most Played Games - Hide when filtering by a single game */}
        {statistics.mostPlayedGames.length > 0 && filters.selectedGames.length !== 1 && (
          <div className="bg-bg-card rounded-lg border border-border-custom p-6">
            <div className="flex items-center mb-6">
              <Medal className="w-6 h-6 text-icon mr-3" />
              <h2 className="text-xl font-semibold text-text font-overpass">Most Played Games</h2>
            </div>
            
            <div className="space-y-4">
              {statistics.mostPlayedGames.map((game, index) => {
                const gameIcon = getGameIcon(game.game_uid)
                return (
                  <div key={game.game_uid || game.game_name} className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* Ranking Badge */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                      </div>
                      
                      {/* Game Icon */}
                      <div className="w-10 h-10 rounded-lg bg-bg-card border border-border-custom flex items-center justify-center flex-shrink-0">
                        {isValidGameIcon(gameIcon) ? (
                          <img
                            src={gameIcon || ''}
                            alt={`${game.game_name} icon`}
                            className="w-6 h-6 object-contain"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {game.game_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Game Info */}
                      <div>
                        <h3 className="font-medium text-text">{game.game_name}</h3>
                        <p className="text-sm text-secondary-text">
                          {game.wins}W - {game.losses}L {game.draws > 0 && `- ${game.draws}D`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-text">{game.battles} battles</p>
                      <p className={`text-sm font-medium ${
                        game.winRate >= 70 ? 'text-green-600' :
                        game.winRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {game.winRate.toFixed(1)}% win rate
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Favorite Opponents */}
        {statistics.favoriteOpponents.length > 0 && (
          <div className="bg-bg-card rounded-lg border border-border-custom p-6">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-icon mr-3" />
              <h2 className="text-xl font-semibold text-text font-overpass">Frequent Opponents</h2>
            </div>
            
            <div className="space-y-4">
              {statistics.favoriteOpponents.map((opponent, index) => (
                <div key={opponent.name} className="flex items-center justify-between p-4 bg-bg-secondary rounded-lg hover:bg-bg-primary transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Ranking Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                    
                    {/* Opponent Icon */}
                    <div className="w-10 h-10 rounded-lg bg-bg-card border border-border-custom flex items-center justify-center flex-shrink-0">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {opponent.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Opponent Info */}
                    <div>
                      <h3 className="font-medium text-text">{opponent.name}</h3>
                      <p className="text-sm text-secondary-text">
                        {opponent.wins}W - {opponent.losses}L {opponent.draws > 0 && `- ${opponent.draws}D`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-text">{opponent.battles} battles</p>
                    <p className={`text-sm font-medium ${
                      opponent.winRate >= 70 ? 'text-green-600' :
                      opponent.winRate >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {opponent.winRate.toFixed(1)}% win rate
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Statistics - Only show when we have data */}
        {statistics.totalBattles > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Active Period */}
            {statistics.mostActivePeriod.battles > 0 && (
              <div className="bg-bg-card rounded-lg border border-border-custom p-6">
                <div className="flex items-center mb-4">
                  <Calendar className="w-6 h-6 text-icon mr-3" />
                  <h3 className="text-lg font-semibold text-text font-overpass">Most Active Period</h3>
                </div>
                <p className="text-2xl font-bold text-text mb-2">{statistics.mostActivePeriod.period}</p>
                <p className="text-secondary-text">{statistics.mostActivePeriod.battles} battles played</p>
              </div>
            )}

            {/* Battle Streaks */}
            <div className="bg-bg-card rounded-lg border border-border-custom p-6">
              <div className="flex items-center mb-4">
                <Zap className="w-6 h-6 text-icon mr-3" />
                <h3 className="text-lg font-semibold text-text font-overpass">Battle Streaks</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-secondary-text">Longest Win Streak</span>
                  <span className="font-semibold text-green-600">{statistics.longestWinStreak}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary-text">Longest Loss Streak</span>
                  <span className="font-semibold text-red-600">{statistics.longestLossStreak}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}