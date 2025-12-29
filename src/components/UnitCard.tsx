import React, { useState } from 'react'
import { Edit, Trash2, Users, Image as ImageIcon } from 'lucide-react'
import type { UnitWithModels } from '../hooks/useUnits'
import { useUnits } from '../hooks/useUnits'
import { formatPoints } from '../utils/listUtils'
import { EditUnitModal } from './EditUnitModal'
import { DeleteUnitModal } from './DeleteUnitModal'

interface UnitCardProps {
  unit: UnitWithModels
  listId: string
}

export function UnitCard({ unit, listId }: UnitCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const hasModels = unit.models && unit.models.length > 0

  return (
    <>
      <div className="bg-bg-primary border border-border-custom rounded-lg p-4 hover:border-brand/50 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-base font-semibold text-title">{unit.name}</h3>
              {unit.type && (
                <span className="text-xs px-2 py-1 rounded-full bg-bg-secondary text-secondary-text">
                  {unit.type}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-secondary-text mb-2">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{unit.model_count} model{unit.model_count !== 1 ? 's' : ''}</span>
              </div>
              {unit.cost !== null && unit.cost !== undefined && (
                <div className="font-medium text-text">
                  {formatPoints(unit.cost)} pts
                </div>
              )}
            </div>

            {unit.notes && (
              <p className="text-sm text-secondary-text mb-2 line-clamp-2">{unit.notes}</p>
            )}

            {hasModels && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border-custom">
                <ImageIcon className="w-4 h-4 text-icon" />
                <span className="text-xs text-secondary-text">
                  {unit.models.length} linked model{unit.models.length !== 1 ? 's' : ''}
                </span>
                <div className="flex -space-x-2">
                  {unit.models.slice(0, 3).map((model) => (
                    <div
                      key={model.id}
                      className="w-8 h-8 rounded-full border-2 border-bg-primary overflow-hidden bg-bg-secondary"
                      title={model.name}
                    >
                      {model.image_url ? (
                        <img
                          src={model.image_url}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-icon" />
                        </div>
                      )}
                    </div>
                  ))}
                  {unit.models.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-bg-primary bg-bg-secondary flex items-center justify-center">
                      <span className="text-xs text-secondary-text">+{unit.models.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-icon hover:text-brand transition-colors rounded-lg hover:bg-bg-secondary"
              title="Edit unit"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-icon hover:text-red-500 transition-colors rounded-lg hover:bg-bg-secondary"
              title="Delete unit"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EditUnitModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        unit={unit}
        listId={listId}
      />

      <DeleteUnitModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        unit={unit}
      />
    </>
  )
}
