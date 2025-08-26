import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { useRecentGames } from '../hooks/useRecentGames'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface GameDropdownProps {
  games: Game[]
  selectedGame: string
  onGameSelect: (gameId: string) => void
  placeholder?: string
  favoriteGames?: Game[]
}

export function GameDropdown({ games, selectedGame, onGameSelect, placeholder = "Choose a Game", favoriteGames = [] }: GameDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { recentGames } = useRecentGames()

  const selectedGameData = games.find(game => game.id === selectedGame)
  
  // Filter games based on search term
  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Get the most recent non-favorite game
  const favoriteGameIds = new Set(favoriteGames.map(g => g.id))
  const mostRecentNonFavorite = recentGames.find(game => 
    !favoriteGameIds.has(game.id) && 
    filteredGames.some(fg => fg.id === game.id)
  )
  
  // Filter games for each section
  const filteredRecentGame = mostRecentNonFavorite ? 
    filteredGames.filter(game => game.id === mostRecentNonFavorite.id) : []
  
  const filteredFavoriteGames = favoriteGames.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredOtherGames = filteredGames.filter(game =>
    game.id !== mostRecentNonFavorite?.id && 
    !favoriteGameIds.has(game.id)
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Focus the input when dropdown opens
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (gameId: string) => {
    onGameSelect(gameId)
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleToggleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setSearchTerm('')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggleOpen}
                    className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] text-left bg-bg-primary flex items-center justify-between hover:bg-bg-secondary transition-colors"
      >
        <div className="flex items-center space-x-3">
          {selectedGameData?.icon ? (
            <img
              src={selectedGameData.icon}
              alt=""
              className="w-6 h-6 object-contain flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                console.warn('Dropdown game icon failed to load:', selectedGameData.icon)
                target.style.display = 'none'
              }}
              onLoad={() => {
                console.warn('Dropdown game icon loaded successfully:', selectedGameData.icon)
              }}
            />
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
          )}
          <span className={selectedGameData ? 'text-text' : 'text-secondary-text'}>
            {selectedGameData ? selectedGameData.name : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-icon transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border-custom rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-border-custom">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder="Search games..."
                className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] text-sm bg-bg-primary text-text"
              />
            </div>
          </div>
          
          {/* Games List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredRecentGame.length === 0 && filteredFavoriteGames.length === 0 && filteredOtherGames.length === 0 ? (
              <div className="px-4 py-3 text-secondary-text text-sm">
                No games found matching "{searchTerm}"
              </div>
            ) : (
              <>
                {/* Recent Games Section */}
                {filteredRecentGame.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-blue-50 border-b border-border-custom">
                      <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                        Recent Games
                      </span>
                    </div>
                    {filteredRecentGame.map((game) => (
                      <button
                        key={`recent-${game.id}`}
                        type="button"
                        onClick={() => handleSelect(game.id)}
                        className="w-full px-4 py-3 text-left hover:bg-bg-secondary flex items-center space-x-3 transition-colors bg-blue-25"
                      >
                        {game.icon ? (
                          <img
                            src={game.icon}
                            alt=""
                            className="w-6 h-6 object-contain flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              console.warn('Game list icon failed to load:', game.icon)
                              target.style.display = 'none'
                            }}
                            onLoad={() => {
                              console.warn('Game list icon loaded successfully:', game.icon)
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                        )}
                        <span className="text-text">{game.name}</span>
                      </button>
                    ))}
                  </>
                )}
                
                {/* Favorite Games Section */}
                {filteredFavoriteGames.length > 0 && (
                  <>
                    {(filteredRecentGame.length > 0) && (
                      <div className="px-4 py-2 bg-amber-50 border-b border-border-custom">
                        <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                          Favorite Games
                        </span>
                      </div>
                    )}
                    {filteredFavoriteGames.map((game) => (
                      <button
                        key={`favorite-${game.id}`}
                        type="button"
                        onClick={() => handleSelect(game.id)}
                        className="w-full px-4 py-3 text-left hover:bg-bg-secondary flex items-center space-x-3 transition-colors bg-amber-25"
                      >
                        {game.icon ? (
                          <img
                            src={game.icon}
                            alt=""
                            className="w-6 h-6 object-contain flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              console.warn('Game list icon failed to load:', game.icon)
                              target.style.display = 'none'
                            }}
                            onLoad={() => {
                              console.warn('Game list icon loaded successfully:', game.icon)
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                        )}
                        <span className="text-text">{game.name}</span>
                      </button>
                    ))}
                  </>
                )}
                
                {/* All Games Section */}
                {filteredOtherGames.length > 0 && (
                  <>
                    {(filteredRecentGame.length > 0 || filteredFavoriteGames.length > 0) && (
                      <div className="px-4 py-2 bg-bg-secondary border-b border-border-custom">
                        <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide">
                          All Games
                        </span>
                      </div>
                    )}
                    {filteredOtherGames.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => handleSelect(game.id)}
                        className="w-full px-4 py-3 text-left hover:bg-bg-secondary flex items-center space-x-3 transition-colors"
                      >
                        {game.icon ? (
                          <img
                            src={game.icon}
                            alt=""
                            className="w-6 h-6 object-contain flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              console.warn('Game list icon failed to load:', game.icon)
                              target.style.display = 'none'
                            }}
                            onLoad={() => {
                              console.warn('Game list icon loaded successfully:', game.icon)
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
                        )}
                        <span className="text-text">{game.name}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}