import React from 'react'
import { ClipboardList, Trophy, AlertCircle } from 'lucide-react'
import type { ListWithGame } from '../hooks/useLists'
import { formatPoints, getPointsStatusColor, isOverPointsLimit } from '../utils/listUtils'

interface ListCardProps {
  list: ListWithGame
  onClick: (list: ListWithGame) => void
}

export function ListCard({ list, onClick }: ListCardProps) {
  const isOverLimit = isOverPointsLimit(list)
  const pointsColor = getPointsStatusColor(list)

  return (
    <div
      onClick={() => onClick(list)}
      className="bg-bg-primary border border-border-custom rounded-lg p-4 hover:border-brand transition-colors cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center group-hover:bg-brand/10 transition-colors">
            <ClipboardList className="w-5 h-5 text-icon group-hover:text-brand transition-colors" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-title group-hover:text-brand transition-colors line-clamp-1">
              {list.name}
            </h3>
            {list.game?.name && (
              <p className="text-xs text-secondary-text">{list.game.name}</p>
            )}
          </div>
        </div>
      </div>

      {list.description && (
        <p className="text-sm text-secondary-text mb-3 line-clamp-2">
          {list.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border-custom">
        <div className="flex items-center space-x-4">
          {/* Points Display */}
          <div className="flex items-center space-x-1">
            {isOverLimit && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${pointsColor}`}>
              {formatPoints(list.points_total || 0)}
              {list.points_limit && ` / ${formatPoints(list.points_limit)}`}
              {' pts'}
            </span>
          </div>
        </div>

        {list.game?.icon && (
          <img
            src={list.game.icon}
            alt={list.game.name}
            className="w-6 h-6 object-contain opacity-60 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>
    </div>
  )
}
