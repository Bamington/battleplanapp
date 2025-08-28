import React from 'react'
import { Trash2, Calendar, User, Gamepad2 } from 'lucide-react'
import { formatLocalDate } from '../utils/timezone'

interface Battle {
  id: number
  battle_name: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
  created_at: string
}

interface BattleListItemProps {
  battle: Battle
  onViewBattle: () => void
  onDeleteBattle: (battleId: number) => void
}

export function BattleListItem({ battle, onViewBattle, onDeleteBattle }: BattleListItemProps) {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDeleteBattle(battle.id)
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
                 {/* Game icon/placeholder */}
         <div className="flex-shrink-0">
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

        {/* Battle details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-title truncate mb-1">
            {battle.battle_name || 'Untitled Battle'}
          </h3>
          
          <div className="flex items-center space-x-4 text-sm text-secondary-text">
            {/* Game */}
            <div className="flex items-center space-x-1">
              <Gamepad2 className="w-4 h-4" />
              <span className="truncate">{battle.game_name || 'Unknown Game'}</span>
            </div>

            {/* Date */}
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
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
              <div className="flex items-center space-x-1">
                <User className="w-4 h-4" />
                <span className="truncate">vs {battle.opp_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Delete button */}
      <div className="flex-shrink-0 ml-4">
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
