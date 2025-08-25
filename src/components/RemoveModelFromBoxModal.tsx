import React from 'react'
import { X } from 'lucide-react'

interface RemoveModelFromBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  modelName: string
  boxName: string
  loading?: boolean
}

export function RemoveModelFromBoxModal({ isOpen, onClose, onConfirm, modelName, boxName, loading = false }: RemoveModelFromBoxModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-title">
            Remove {modelName} from {boxName}?
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-base text-secondary-text mb-6">
          Are you sure you want to remove this model from this box? This won't delete the model or the box from your collection.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost btn-flex"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary btn-flex"
          >
            {loading ? 'Removing...' : 'Remove from Box'}
          </button>
        </div>
      </div>
    </div>
  )
}