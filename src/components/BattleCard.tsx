import React from 'react'
import { Trash2, Calendar, User, Gamepad2, Edit, Flag } from 'lucide-react'
import { formatLocalDate } from '../utils/timezone'
import { useGameIcons } from '../hooks/useGameIcons'
import { BattleImage } from './BattleImage'

interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  location: string | null
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
  campaign_id: string | null
  campaign?: {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
  } | null
}

interface BattleCardProps {
  battle: Battle
  onViewBattle: () => void
  onDeleteBattle: (battle: Battle) => void
  onEditBattle?: (battle: Battle) => void
  imageRefreshKey?: number
}

export function BattleCard({ battle, onViewBattle, onDeleteBattle, onEditBattle, imageRefreshKey }: BattleCardProps) {
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
        <BattleImage
          battleId={battle.id}
          name={battle.battle_name || 'Untitled Battle'}
          gameImage={null} // Let the hook handle game images as fallback
          gameIcon={gameIcon}
          size="large"
          className=""
          refreshKey={imageRefreshKey}
        />

        {/* Result pill */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(battle.result)}`}>
            {getResultText(battle.result)}
          </span>
        </div>
      </div>

      {/* Battle Details */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-title mb-2 h-14 overflow-hidden">
          <div className="overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {battle.battle_name || 'Untitled Battle'}
          </div>
        </h3>

        {/* Campaign */}
        {battle.campaign && (
          <div className="flex items-center space-x-2 mb-3">
            <Flag className="w-4 h-4 flex-shrink-0 text-brand" />
            <span className="text-sm text-brand font-medium truncate">{battle.campaign.name}</span>
          </div>
        )}
        
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
          {(battle.opponent?.opp_name || battle.opp_name) && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">vs {battle.opponent?.opp_name || battle.opp_name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
