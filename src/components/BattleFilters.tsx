import React, { useState } from 'react'
import { Filter, X, Calendar, User, Trophy } from 'lucide-react'
import { MultiSelectDropdown } from './MultiSelectDropdown'
import { DatePicker } from './DatePicker'

interface Game {
  id: string
  name: string
  icon: string | null
}

export interface BattleFilters {
  selectedGames: string[]
  selectedOpponents: string[]
  selectedResults: string[]
  dateFrom: string
  dateTo: string
  searchQuery: string
}

interface BattleFiltersProps {
  games: Game[]
  opponents: string[]
  filters: BattleFilters
  onFiltersChange: (filters: BattleFilters) => void
  onClearFilters: () => void
}

export function BattleFiltersComponent({
  games,
  opponents,
  filters,
  onFiltersChange,
  onClearFilters
}: BattleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const hasActiveFilters = 
    filters.selectedGames.length > 0 || 
    filters.selectedOpponents.length > 0 || 
    filters.selectedResults.length > 0 || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.searchQuery.length > 0

  // Find the 'Other' game from the database
  const otherGame = games.find(game => game.name.toLowerCase() === 'other')

  // Convert to MultiSelectDropdown format
  const gameOptions = [
    // Add the real 'Other' game from database if it exists
    ...(otherGame ? [{
      id: otherGame.id,
      name: 'Other',
      icon: otherGame.icon || '/bp-unkown.svg'
    }] : []),
    ...games.filter(game => game.name.toLowerCase() !== 'other').map(game => ({
      id: game.id,
      name: game.name,
      icon: game.icon
    }))
  ]

  const opponentOptions = opponents.map(opponent => ({
    id: opponent,
    name: opponent,
    icon: null
  }))

  const resultOptions = [
    { id: 'win', name: 'Wins' },
    { id: 'loss', name: 'Losses' }, 
    { id: 'draw', name: 'Draws' }
  ]

  const updateFilters = (updates: Partial<BattleFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  // Get display names for active filters
  const getSelectedGameNames = () => {
    return games
      .filter(game => filters.selectedGames.includes(game.id))
      .map(game => game.name)
  }

  const getSelectedResultNames = () => {
    return resultOptions
      .filter(result => filters.selectedResults.includes(result.id))
      .map(result => result.name)
  }

  const formatDateRange = () => {
    if (filters.dateFrom && filters.dateTo) {
      const from = new Date(filters.dateFrom).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })
      const to = new Date(filters.dateTo).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })
      return `${from} - ${to}`
    } else if (filters.dateFrom) {
      const from = new Date(filters.dateFrom).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })
      return `From ${from}`
    } else if (filters.dateTo) {
      const to = new Date(filters.dateTo).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })
      return `Until ${to}`
    }
    return null
  }

  const clearDateRange = () => {
    updateFilters({ dateFrom: '', dateTo: '' })
  }

  return (
    <div className="bg-bg-card rounded-lg border border-border-custom p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-secondary-text" />
          <h3 className="text-lg font-semibold text-title">Filters</h3>
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-1 text-sm text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-4 h-4 text-icon" />
              <span>Clear all</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-sm text-secondary-text hover:text-text transition-colors"
          >
            {isExpanded ? (
              <>
                <span>Collapse</span>
                <div className="w-4 h-4 transform rotate-180">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </>
            ) : (
              <>
                <span>Expand</span>
                <div className="w-4 h-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </>
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Search Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-input-label font-overpass mb-2">
              Search Battles
            </label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              placeholder="Search by battle name, opponent, or notes..."
              className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            {/* Game Filter */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Games
              </label>
              <MultiSelectDropdown
                options={gameOptions}
                selectedOptions={filters.selectedGames}
                onSelectionChange={(selected) => updateFilters({ selectedGames: selected })}
                placeholder="All games"
                maxSelections={10}
                searchable={true}
                type="game"
              />
            </div>

            {/* Opponent Filter */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Opponents
              </label>
              <MultiSelectDropdown
                options={opponentOptions}
                selectedOptions={filters.selectedOpponents}
                onSelectionChange={(selected) => updateFilters({ selectedOpponents: selected })}
                placeholder="All opponents"
                maxSelections={10}
                searchable={true}
                type="game"
              />
            </div>

            {/* Result Filter */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Results
              </label>
              <MultiSelectDropdown
                options={resultOptions}
                selectedOptions={filters.selectedResults}
                onSelectionChange={(selected) => updateFilters({ selectedResults: selected })}
                placeholder="All results"
                maxSelections={3}
                searchable={false}
                type="game"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <DatePicker
                  value={filters.dateFrom}
                  onChange={(date) => updateFilters({ dateFrom: date })}
                  placeholder="From date"
                  minDate=""
                />
                <DatePicker
                  value={filters.dateTo}
                  onChange={(date) => updateFilters({ dateTo: date })}
                  placeholder="To date"
                  minDate=""
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border-custom">
          <div className="flex flex-wrap gap-2">
            {filters.searchQuery && (
              <div className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                <span>Search: "{filters.searchQuery}"</span>
                <button
                  onClick={() => updateFilters({ searchQuery: '' })}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {getSelectedGameNames().map((gameName, index) => (
              <div key={`game-${index}`} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                <span>Game: {gameName}</span>
                <button
                  onClick={() => {
                    const gameId = games.find(g => g.name === gameName)?.id
                    if (gameId) {
                      updateFilters({ 
                        selectedGames: filters.selectedGames.filter(id => id !== gameId) 
                      })
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {filters.selectedOpponents.map((opponent) => (
              <div key={`opponent-${opponent}`} className="flex items-center space-x-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                <span>Opponent: {opponent}</span>
                <button
                  onClick={() => updateFilters({ 
                    selectedOpponents: filters.selectedOpponents.filter(o => o !== opponent) 
                  })}
                  className="text-purple-600 hover:text-purple-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {getSelectedResultNames().map((resultName, index) => (
              <div key={`result-${index}`} className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <span>Result: {resultName}</span>
                <button
                  onClick={() => {
                    const resultId = resultOptions.find(r => r.name === resultName)?.id
                    if (resultId) {
                      updateFilters({ 
                        selectedResults: filters.selectedResults.filter(id => id !== resultId) 
                      })
                    }
                  }}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {formatDateRange() && (
              <div className="flex items-center space-x-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                <Calendar className="w-3 h-3" />
                <span>{formatDateRange()}</span>
                <button
                  onClick={clearDateRange}
                  className="text-amber-600 hover:text-amber-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}