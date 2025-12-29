import React from 'react'
import { Trash2, Calendar, User, Gamepad2, Edit } from 'lucide-react'
import { formatLocalDate } from '../utils/timezone'
import { BattleImage } from './BattleImage'

interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
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


  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-bg-secondary transition-colors cursor-pointer border-b border-border-custom last:border-b-0"
      onClick={onViewBattle}
    >
      {/* Left side: Battle info */}
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {/* Battle image */}
        <div className="flex-shrink-0">
          <BattleImage
            battleId={battle.id}
            name={battle.battle_name || 'Untitled Battle'}
            gameImage={null}
            gameIcon={battle.game_icon}
            size="small"
            className="w-10 h-10 object-cover rounded flex-shrink-0"
          />
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
