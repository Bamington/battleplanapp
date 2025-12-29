import React, { useState } from 'react'
import { X, Edit, Trash2, Plus, Copy, Users } from 'lucide-react'
import type { ListWithGame } from '../hooks/useLists'
import { useLists } from '../hooks/useLists'
import { useUnits } from '../hooks/useUnits'
import { formatPoints, getPointsStatusColor, isOverPointsLimit } from '../utils/listUtils'
import { EditListModal } from './EditListModal'
import { DeleteListModal } from './DeleteListModal'
import { AddUnitModal } from './AddUnitModal'
import { UnitCard } from './UnitCard'

interface ViewListModalProps {
  isOpen: boolean
  onClose: () => void
  list: ListWithGame | null
}

export function ViewListModal({ isOpen, onClose, list }: ViewListModalProps) {
  const { duplicateList } = useLists()
  const { units, isLoading: unitsLoading } = useUnits(list?.id || null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddUnitModal, setShowAddUnitModal] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  if (!isOpen || !list) return null

  const handleDuplicate = async () => {
    setDuplicating(true)
    const result = await duplicateList(list.id)
    setDuplicating(false)
    if (result) {
      onClose()
    }
  }

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false)
    onClose()
  }

  const isOverLimit = isOverPointsLimit(list)
  const pointsColor = getPointsStatusColor(list)

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-modal-bg rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border-custom">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-title mb-2">{list.name}</h2>
                {list.game?.name && (
                  <p className="text-sm text-secondary-text">{list.game.name}</p>
                )}
                {list.description && (
                  <p className="text-sm text-secondary-text mt-2">{list.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-secondary-text hover:text-text transition-colors ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Points Summary */}
            <div className="mt-4 flex items-center justify-between bg-bg-secondary rounded-lg p-4">
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-xs text-secondary-text mb-1">Total Points</p>
                  <p className={`text-xl font-bold ${pointsColor}`}>
                    {formatPoints(list.points_total || 0)}
                    {list.points_limit && ` / ${formatPoints(list.points_limit)}`}
                  </p>
                  {isOverLimit && (
                    <p className="text-xs text-red-500 mt-1">Over limit!</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-secondary-text mb-1">Units</p>
                  <p className="text-xl font-bold text-text">{units.length}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddUnitModal(true)}
                  className="btn-primary btn-with-icon"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Unit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Units List */}
          <div className="flex-1 overflow-y-auto p-6">
            {unitsLoading ? (
              <div className="text-center py-8 text-secondary-text">
                Loading units...
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-12 bg-bg-primary rounded-lg border border-border-custom">
                <Users className="w-16 h-16 text-icon mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-title mb-2">No Units Yet</h3>
                <p className="text-secondary-text mb-6">
                  Add your first unit to this list
                </p>
                <button
                  onClick={() => setShowAddUnitModal(true)}
                  className="btn-primary btn-with-icon"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Unit</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {units.map((unit) => (
                  <UnitCard
                    key={unit.id}
                    unit={unit}
                    listId={list.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border-custom bg-bg-secondary">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary btn-with-icon"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className="btn-secondary btn-with-icon"
                >
                  <Copy className="w-4 h-4" />
                  <span>{duplicating ? 'Duplicating...' : 'Duplicate'}</span>
                </button>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="btn-danger btn-with-icon"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <EditListModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        list={list}
      />

      <DeleteListModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        list={list}
        onDeleted={handleDeleteSuccess}
      />

      <AddUnitModal
        isOpen={showAddUnitModal}
        onClose={() => setShowAddUnitModal(false)}
        listId={list.id}
      />
    </>
  )
}
