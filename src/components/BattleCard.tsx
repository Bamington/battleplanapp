import React from 'react'
import { Trash2, Calendar, User, Gamepad2, Edit } from 'lucide-react'
import { formatLocalDate } from '../utils/timezone'
import { useGameIcons } from '../hooks/useGameIcons'

interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  location: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
  user_id: string | null
  created_at: string
}

interface BattleCardProps {
  battle: Battle
  onViewBattle: () => void
  onDeleteBattle: (battle: Battle) => void
  onEditBattle?: (battle: Battle) => void
}

export function BattleCard({ battle, onViewBattle, onDeleteBattle, onEditBattle }: BattleCardProps) {
  const { getGameIcon, isValidGameIcon } = useGameIcons()
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteBattle(battle)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEditBattle) {
      onEditBattle(battle)
    }
  }

  // Get the game icon from cache using game_uid
  const gameIcon = getGameIcon(battle.game_uid)

  const getResultColor = (result: string | null) => {
    if (!result) return 'bg-gray-100 text-gray-800'
    
    const lowerResult = result.toLowerCase()
    if (lowerResult.includes('i won') || lowerResult.includes('win')) {
      return 'bg-green-100 text-green-800'
    } else if (lowerResult.includes('draw') || lowerResult.includes('tie')) {
      return 'bg-yellow-100 text-yellow-800'
    } else {
      return 'bg-red-100 text-red-800'
    }
  }

  const getResultText = (result: string | null) => {
    if (!result) return 'No Result'
    
    const lowerResult = result.toLowerCase()
    if (lowerResult.includes('i won') || lowerResult.includes('win')) {
      return 'Win'
    } else if (lowerResult.includes('draw') || lowerResult.includes('tie')) {
      return 'Draw'
    } else {
      return 'Loss'
    }
  }

  return (
    <div 
      className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden hover:shadow-[0_8px_25px_rgba(114,77,221,0.25)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
      onClick={onViewBattle}
    >
      {/* Battle Image */}
      <div className="relative h-48 bg-bg-secondary overflow-hidden">
        {battle.image_url ? (
          <img
            src={battle.image_url}
            alt="Battle image"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              console.warn('Battle image failed to load:', battle.image_url, 'Falling back to game icon')
              target.style.display = 'none'
              const fallback = target.nextElementSibling as HTMLElement
              if (fallback && fallback.classList.contains('game-icon-fallback')) {
                fallback.style.display = 'flex'
              }
            }}
          />
        ) : null}
        
        {/* Game icon fallback */}
        <div 
          className={`game-icon-fallback ${battle.image_url ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}
        >
          {isValidGameIcon(gameIcon) ? (
            <img
              src={gameIcon || ''}
              alt={`${battle.game_name || 'Unknown Game'} icon`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback && fallback.classList.contains('icon-fallback')) {
                  fallback.style.display = 'flex'
                }
              }}
            />
          ) : null}
          <div className={`w-full h-full bg-red-600 flex items-center justify-center icon-fallback ${isValidGameIcon(gameIcon) ? 'hidden' : ''}`}>
            <span className="text-white text-6xl font-bold">
              {battle.game_name?.charAt(0) || '?'}
            </span>
          </div>
        </div>

        {/* Result pill */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(battle.result)}`}>
            {getResultText(battle.result)}
          </span>
        </div>

        {/* Action buttons overlay */}
        <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEditBattle && (
            <button
              onClick={handleEditClick}
              className="bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 transition-colors p-2 rounded-full shadow-sm"
              title="Edit Battle"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDeleteClick}
            className="bg-white/90 hover:bg-white text-red-600 hover:text-red-700 transition-colors p-2 rounded-full shadow-sm"
            title="Delete Battle"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Battle Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-title mb-3 h-14 overflow-hidden">
          <div className="overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {battle.battle_name || 'Untitled Battle'}
          </div>
        </h3>
        
        <div className="space-y-2 text-sm text-secondary-text">
          {/* Game */}
          <div className="flex items-center space-x-2">
            <Gamepad2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{battle.game_name || 'Unknown Game'}</span>
          </div>

          {/* Date */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>
              {battle.date_played ? formatLocalDate(battle.date_played, {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'No date'}
            </span>
          </div>

          {/* Opponent */}
          {battle.opp_name && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">vs {battle.opp_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
