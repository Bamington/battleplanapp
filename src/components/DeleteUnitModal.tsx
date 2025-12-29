import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useUnits, type UnitWithModels } from '../hooks/useUnits'

interface DeleteUnitModalProps {
  isOpen: boolean
  onClose: () => void
  unit: UnitWithModels
}

export function DeleteUnitModal({ isOpen, onClose, unit }: DeleteUnitModalProps) {
  const { deleteUnit } = useUnits(unit.list_id)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const success = await deleteUnit(unit.id)
    setDeleting(false)

    if (success) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[80]">
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-title">Delete Unit</h2>
            <p className="text-sm text-secondary-text">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-text mb-6">
          Are you sure you want to delete <strong>{unit.name}</strong>?
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="btn-danger flex-1"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Unit'}
          </button>
        </div>
      </div>
    </div>
  )
}
