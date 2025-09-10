import React, { useState } from 'react'
import { Filter, X, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { GameDropdown } from './GameDropdown'
import { MultiSelectDropdown } from './MultiSelectDropdown'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface Box {
  id: string
  name: string
  image_url?: string | null
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
  searchQuery: string
  onBoxesChange: (boxIds: string[]) => void
  onGamesChange: (gameIds: string[]) => void
  onStatusesChange: (statuses: string[]) => void
  onSearchChange: (query: string) => void
  onClearFilters: () => void
}

export function ModelFilters({
  games,
  boxes,
  models,
  selectedBoxes,
  selectedGames,
  selectedStatuses,
  searchQuery,
  onBoxesChange,
  onGamesChange,
  onStatusesChange,
  onSearchChange,
  onClearFilters
}: ModelFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasActiveFilters = selectedBoxes.length > 0 || selectedGames.length > 0 || selectedStatuses.length > 0 || searchQuery.length > 0

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

  // Find the 'Other' game from the database
  const otherGame = games.find(game => game.name.toLowerCase() === 'other')

  // Convert to MultiSelectDropdown format
  const boxOptions = availableBoxes.map(box => {
    const boxData = boxes.find(b => b.id === box.id)
    return {
      id: box.id,
      name: `${box.name} (${box.count})`,
      icon: boxData?.image_url || null
    }
  })

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

  const statusOptions = availableStatuses.map(({ status, count }) => ({
    id: status,
    name: `${status} (${count})`
  }))

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
              Search Models
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by model name..."
              className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box Filter */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Collections
              </label>
              <MultiSelectDropdown
                options={boxOptions}
                selectedOptions={selectedBoxes}
                onSelectionChange={onBoxesChange}
                placeholder="Select collections..."
                maxSelections={10}
                searchable={true}
                type="game"
              />
            </div>

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

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                Statuses
              </label>
              <MultiSelectDropdown
                options={statusOptions}
                selectedOptions={selectedStatuses}
                onSelectionChange={onStatusesChange}
                placeholder="Select statuses..."
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
            {selectedBoxes.map((boxId) => {
              const boxName = availableBoxes.find(box => box.id === boxId)?.name || ''
              return (
                <div key={boxId} className="flex items-center space-x-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                  <span>Collection: {boxName}</span>
                  <button
                    onClick={() => handleBoxToggle(boxId)}
                    className="text-amber-600 hover:text-amber-800 transition-colors"
                  >
                    <X className="w-3 h-3 text-icon" />
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
                    <X className="w-3 h-3 text-icon" />
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
                  <X className="w-3 h-3 text-icon" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
