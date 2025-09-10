import React from 'react'
import { X } from 'lucide-react'

interface DeleteGameModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  gameName: string
  loading?: boolean
}

export function DeleteGameModal({ isOpen, onClose, onConfirm, gameName, loading = false }: DeleteGameModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-title">
            Are you sure you want to delete "{gameName}"?
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-base text-secondary-text mb-6">
          This cannot be undone. Any models or collections associated with this game will need to be reassigned to another game.
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
            className="btn-danger btn-flex"
          >
            {loading ? 'Deleting...' : 'Delete Game'}
          </button>
        </div>
      </div>
    </div>
  )
}

