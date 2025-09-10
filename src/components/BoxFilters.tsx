import React, { useState } from 'react'
import { Filter, X, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { MultiSelectDropdown } from './MultiSelectDropdown'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface Box {
  id: string
  name: string
  game?: {
    id: string
    name: string
    icon: string | null
  } | null
}

interface BoxFiltersProps {
  games: Game[]
  boxes: Box[]
  selectedGames: string[]
  searchQuery: string
  onGamesChange: (gameIds: string[]) => void
  onSearchChange: (query: string) => void
  onClearFilters: () => void
}

export function BoxFilters({
  games,
  boxes,
  selectedGames,
  searchQuery,
  onGamesChange,
  onSearchChange,
  onClearFilters
}: BoxFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasActiveFilters = selectedGames.length > 0 || searchQuery.length > 0

  // Calculate available game options with counts
  const getAvailableGames = () => {
    const gameCounts = new Map<string, { name: string; count: number }>()
    
    boxes.forEach(box => {
      const gameId = box.game?.id
      const gameName = box.game?.name
      
      if (gameName && gameId) {
        const current = gameCounts.get(gameId) || { name: gameName, count: 0 }
        current.count++
        gameCounts.set(gameId, current)
      }
    })
    
    return Array.from(gameCounts.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }

  const availableGames = getAvailableGames()

  // Find the 'Other' game from the database
  const otherGame = games.find(game => game.name.toLowerCase() === 'other')

  // Convert to MultiSelectDropdown format
  const gameOptions = [
    // Add the real 'Other' game from database if it exists
    ...(otherGame ? [{
      id: otherGame.id,
      name: (() => {
        const otherGameData = availableGames.find(game => game.id === otherGame.id)
        return otherGameData ? `Other (${otherGameData.count})` : 'Other'
      })(),
      icon: otherGame.icon || '/bp-unkown.svg'
    }] : []),
    ...availableGames.filter(game => game.id !== otherGame?.id).map(game => {
      const gameData = games.find(g => g.id === game.id)
      return {
        id: game.id,
        name: `${game.name} (${game.count})`,
        icon: gameData?.icon || null
      }
    })
  ]

  // Get filter display names
  const getSelectedGameNames = () => {
    return availableGames
      .filter(game => selectedGames.includes(game.id))
      .map(game => game.name)
  }

  // Handle multi-select changes
  const handleGameToggle = (gameId: string) => {
    const newSelectedGames = selectedGames.includes(gameId)
      ? selectedGames.filter(id => id !== gameId)
      : [...selectedGames, gameId]
    onGamesChange(newSelectedGames)
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
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Search Field */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-input-label font-overpass mb-2">
              Search Collections
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by collection name..."
              className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Game Filter */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Games
              </label>
              <MultiSelectDropdown
                options={gameOptions}
                selectedOptions={selectedGames}
                onSelectionChange={onGamesChange}
                placeholder="Select games..."
                maxSelections={10}
                searchable={true}
                type="game"
              />
            </div>
          </div>
        </>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border-custom">
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <div className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                <span>Search: "{searchQuery}"</span>
                <button
                  onClick={() => onSearchChange('')}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-3 h-3 text-icon" />
                </button>
              </div>
            )}
            {selectedGames.map((gameId) => {
              const gameName = availableGames.find(game => game.id === gameId)?.name || ''
              return (
                <div key={gameId} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>Game: {gameName}</span>
                  <button
                    onClick={() => handleGameToggle(gameId)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-3 h-3 text-icon" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
