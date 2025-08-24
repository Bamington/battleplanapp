import React from 'react'
import { Filter, X, Check } from 'lucide-react'

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
  onGamesChange: (gameIds: string[]) => void
  onClearFilters: () => void
}

export function BoxFilters({
  games,
  boxes,
  selectedGames,
  onGamesChange,
  onClearFilters
}: BoxFiltersProps) {
  const hasActiveFilters = selectedGames.length > 0

  // Calculate available game options with counts
  const getAvailableGames = () => {
    const gameCounts = new Map<string, { name: string; count: number }>()
    
    boxes.forEach(box => {
      if (box.game) {
        const gameId = box.game.id
        const gameName = box.game.name
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
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Game Filter */}
        <div>
          <label className="block text-sm font-medium text-input-label font-overpass mb-2">
            Games
          </label>
          <div className="max-h-48 overflow-y-auto border border-border-custom rounded-lg bg-bg-primary">
            {availableGames.map((game) => (
              <label
                key={game.id}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-bg-secondary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedGames.includes(game.id)}
                  onChange={() => handleGameToggle(game.id)}
                  className="rounded border-border-custom text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-text flex-1">{game.name}</span>
                <span className="text-xs text-secondary-text">({game.count})</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border-custom">
          <div className="flex flex-wrap gap-2">
            {selectedGames.map((gameId) => {
              const gameName = availableGames.find(game => game.id === gameId)?.name || ''
              return (
                <div key={gameId} className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  <span>Game: {gameName}</span>
                  <button
                    onClick={() => handleGameToggle(gameId)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
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
