import React from 'react'
import { Filter, X, Check } from 'lucide-react'
import { GameDropdown } from './GameDropdown'

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

interface Model {
  id: string
  name: string
  status: string
  box?: {
    id: string
    name: string
    game?: {
      id: string
      name: string
      icon: string | null
    } | null
  } | null
  game?: {
    id: string
    name: string
    icon: string | null
  } | null
}

interface ModelFiltersProps {
  games: Game[]
  boxes: Box[]
  models: Model[]
  selectedBoxes: string[]
  selectedGames: string[]
  selectedStatuses: string[]
  onBoxesChange: (boxIds: string[]) => void
  onGamesChange: (gameIds: string[]) => void
  onStatusesChange: (statuses: string[]) => void
  onClearFilters: () => void
}

export function ModelFilters({
  games,
  boxes,
  models,
  selectedBoxes,
  selectedGames,
  selectedStatuses,
  onBoxesChange,
  onGamesChange,
  onStatusesChange,
  onClearFilters
}: ModelFiltersProps) {
  const hasActiveFilters = selectedBoxes.length > 0 || selectedGames.length > 0 || selectedStatuses.length > 0

  // Calculate available filter options with counts
  const getAvailableBoxes = () => {
    const boxCounts = new Map<string, { name: string; count: number }>()
    
    models.forEach(model => {
      if (model.box) {
        const boxId = model.box.id
        const boxName = model.box.name
        const current = boxCounts.get(boxId) || { name: boxName, count: 0 }
        current.count++
        boxCounts.set(boxId, current)
      }
    })
    
    return Array.from(boxCounts.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }

  const getAvailableGames = () => {
    const gameCounts = new Map<string, { name: string; count: number }>()
    
    models.forEach(model => {
      const gameId = model.box?.game?.id || model.game?.id
      const gameName = model.box?.game?.name || model.game?.name
      
      if (gameId && gameName) {
        const current = gameCounts.get(gameId) || { name: gameName, count: 0 }
        current.count++
        gameCounts.set(gameId, current)
      }
    })
    
    return Array.from(gameCounts.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }

  const getAvailableStatuses = () => {
    const statusCounts = new Map<string, number>()
    
    models.forEach(model => {
      const current = statusCounts.get(model.status) || 0
      statusCounts.set(model.status, current + 1)
    })
    
    return Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  }

  const availableBoxes = getAvailableBoxes()
  const availableGames = getAvailableGames()
  const availableStatuses = getAvailableStatuses()

  // Get filter display names
  const getSelectedBoxNames = () => {
    return availableBoxes
      .filter(box => selectedBoxes.includes(box.id))
      .map(box => box.name)
  }

  const getSelectedGameNames = () => {
    return availableGames
      .filter(game => selectedGames.includes(game.id))
      .map(game => game.name)
  }

  // Handle multi-select changes
  const handleBoxToggle = (boxId: string) => {
    const newSelectedBoxes = selectedBoxes.includes(boxId)
      ? selectedBoxes.filter(id => id !== boxId)
      : [...selectedBoxes, boxId]
    onBoxesChange(newSelectedBoxes)
  }

  const handleGameToggle = (gameId: string) => {
    const newSelectedGames = selectedGames.includes(gameId)
      ? selectedGames.filter(id => id !== gameId)
      : [...selectedGames, gameId]
    onGamesChange(newSelectedGames)
  }

  const handleStatusToggle = (status: string) => {
    const newSelectedStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter(s => s !== status)
      : [...selectedStatuses, status]
    onStatusesChange(newSelectedStatuses)
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
        {/* Box Filter */}
        <div>
          <label className="block text-sm font-medium text-input-label font-overpass mb-2">
            Boxes
          </label>
          <div className="max-h-48 overflow-y-auto border border-border-custom rounded-lg bg-bg-primary">
            {availableBoxes.map((box) => (
              <label
                key={box.id}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-bg-secondary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedBoxes.includes(box.id)}
                  onChange={() => handleBoxToggle(box.id)}
                  className="rounded border-border-custom text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-text flex-1">{box.name}</span>
                <span className="text-xs text-secondary-text">({box.count})</span>
              </label>
            ))}
          </div>
        </div>

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

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-input-label font-overpass mb-2">
            Statuses
          </label>
          <div className="max-h-48 overflow-y-auto border border-border-custom rounded-lg bg-bg-primary">
            {availableStatuses.map(({ status, count }) => (
              <label
                key={status}
                className="flex items-center space-x-2 px-3 py-2 hover:bg-bg-secondary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status)}
                  onChange={() => handleStatusToggle(status)}
                  className="rounded border-border-custom text-green-500 focus:ring-green-500"
                />
                <span className="text-sm text-text flex-1">{status}</span>
                <span className="text-xs text-secondary-text">({count})</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-border-custom">
          <div className="flex flex-wrap gap-2">
            {selectedBoxes.map((boxId) => {
              const boxName = availableBoxes.find(box => box.id === boxId)?.name || ''
              return (
                <div key={boxId} className="flex items-center space-x-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                  <span>Box: {boxName}</span>
                  <button
                    onClick={() => handleBoxToggle(boxId)}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
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
            {selectedStatuses.map((status) => (
              <div key={status} className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <span>Status: {status}</span>
                <button
                  onClick={() => handleStatusToggle(status)}
                  className="text-green-600 hover:text-green-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
