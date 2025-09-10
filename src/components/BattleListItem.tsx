import React from 'react'
import { Trash2, Calendar, User, Gamepad2, Edit } from 'lucide-react'
import { formatLocalDate } from '../utils/timezone'

interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  opp_name: string | null // Keep for backward compatibility
  opp_id: string[] | null
  opponent_id: number | null
  opponent?: {
    id: number
    opp_name: string | null
    opp_rel_uuid: string | null
    created_by: string | null
    created_at: string
  } | null
  result: string | null
  user_id: string | null
  created_at: string
}

interface BattleListItemProps {
  battle: Battle
  onViewBattle: () => void
  onDeleteBattle: (battleId: number) => void
  onEditBattle?: (battle: Battle) => void
}

export function BattleListItem({ battle, onViewBattle, onDeleteBattle, onEditBattle }: BattleListItemProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteBattle(battle.id)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEditBattle) {
      onEditBattle(battle)
    }
  }

  const isValidGameIcon = (iconUrl: string | null | undefined): boolean => {
    return !!(iconUrl && 
      typeof iconUrl === 'string' &&
      iconUrl.trim() !== '' && 
      iconUrl !== 'undefined' && 
      iconUrl !== 'null' &&
      iconUrl.startsWith('http') &&
      iconUrl.includes('game-assets'))
  }

  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-bg-secondary transition-colors cursor-pointer border-b border-border-custom last:border-b-0"
      onClick={onViewBattle}
    >
      {/* Left side: Battle info */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Battle image or game icon/placeholder */}
        <div className="flex-shrink-0">
          {battle.image_url ? (
            // Show battle image if available
            <img
              src={battle.image_url}
              alt="Battle image"
              className="w-10 h-10 object-cover rounded flex-shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                console.warn('Battle image failed to load:', battle.image_url, 'Falling back to game icon')
                // Hide the broken image and show game icon fallback
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback && fallback.classList.contains('game-icon-fallback')) {
                  fallback.style.display = 'block'
                }
              }}
            />
          ) : null}
          
          {/* Game icon fallback (shown when no battle image or battle image fails to load) */}
          <div 
            className="game-icon-fallback"
            style={{ display: battle.image_url ? 'none' : 'block' }}
          >
            {isValidGameIcon(battle.game_icon) ? (
              <>
                <img
                  src={battle.game_icon || ''}
                  alt={`${battle.game_name || 'Unknown Game'} icon`}
                  className="w-10 h-10 object-contain rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    console.warn('Game icon failed to load:', battle.game_icon, 'Falling back to letter icon')
                    // Hide the broken image and show fallback
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'flex'
                    }
                  }}
                  onLoad={(e) => {
                    // Hide fallback when image loads successfully
                    const target = e.target as HTMLImageElement
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'none'
                    }
                  }}
                />
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center icon-fallback">
                  <span className="text-white text-sm font-bold">
                    {battle.game_name?.charAt(0) || '?'}
                  </span>
                </div>
              </>
            ) : (
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {battle.game_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Battle details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-title break-words mb-2">
            {battle.battle_name || 'Untitled Battle'}
          </h3>
          
          {/* Mobile: Only show Date, Desktop: Show Game, Date, and Opponent */}
          <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4 text-sm text-secondary-text">
            {/* Game - Hidden on mobile */}
            <div className="hidden sm:flex items-center space-x-1">
              <Gamepad2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{battle.game_name || 'Unknown Game'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center space-x-1">
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

            {/* Opponent - Hidden on mobile */}
            {(battle.opponent?.opp_name || battle.opp_name) && (
              <div className="hidden sm:flex items-center space-x-1">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">vs {battle.opponent?.opp_name || battle.opp_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
        {/* Edit button - Hidden on mobile */}
        {onEditBattle && (
          <button
            onClick={handleEditClick}
            className="hidden sm:block text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
            title="Edit Battle"
          >
            <Edit className="w-5 h-5" />
          </button>
        )}
        
        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-full hover:bg-red-50"
          title="Delete Battle"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
