import React from 'react'
import { Calendar, MapPin, User, Trophy, FileText } from 'lucide-react'
import { formatLocalDate } from '../utils/timezone'

interface Battle {
  id: number
  battle_name: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
  created_at: string
}

interface BattleCardProps {
  battle: Battle
  onClick?: () => void
  onDeleteBattle?: (battleId: number) => void
}

export function BattleCard({ battle, onClick, onDeleteBattle }: BattleCardProps) {
  const getResultColor = (result: string | null) => {
    if (!result) return 'text-secondary-text'
    
    const lowerResult = result.toLowerCase()
    if (lowerResult.includes('win') || lowerResult.includes('victory')) {
      return 'text-green-600'
    } else if (lowerResult.includes('loss') || lowerResult.includes('defeat')) {
      return 'text-red-600'
    } else if (lowerResult.includes('draw') || lowerResult.includes('tie')) {
      return 'text-yellow-600'
    }
    return 'text-secondary-text'
  }

  return (
    <div 
      className="bg-bg-card rounded-lg shadow-sm border border-border-custom p-4 hover:bg-bg-secondary transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Title and Game */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-title truncate mb-1">
            {battle.battle_name || 'Untitled Battle'}
          </h3>
          {battle.game_name && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{battle.game_name.charAt(0)}</span>
              </div>
              <span className="text-sm text-secondary-text">{battle.game_name}</span>
            </div>
          )}
        </div>
        {onDeleteBattle && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDeleteBattle(battle.id)
            }}
            className="text-red-500 hover:text-red-700 transition-colors ml-2"
          >
            ×
          </button>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center space-x-2 mb-3">
        <Calendar className="w-4 h-4 text-icon" />
        <span className="text-sm text-secondary-text">
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
        <div className="flex items-center space-x-2 mb-3">
          <User className="w-4 h-4 text-icon" />
          <span className="text-sm text-secondary-text">
            vs {battle.opp_name}
          </span>
        </div>
      )}

      {/* Result */}
      {battle.result && (
        <div className="flex items-center space-x-2 mb-3">
          <Trophy className="w-4 h-4 text-icon" />
          <span className={`text-sm font-medium ${getResultColor(battle.result)}`}>
            {battle.result}
          </span>
        </div>
      )}


    </div>
  )
}
