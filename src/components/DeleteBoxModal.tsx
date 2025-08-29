import React from 'react'
import { X } from 'lucide-react'

interface DeleteBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  boxName: string
  loading?: boolean
}

export function DeleteBoxModal({ isOpen, onClose, onConfirm, boxName, loading = false }: DeleteBoxModalProps) {
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
            Are you sure you want to delete {boxName}?
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-base text-secondary-text mb-6">
          This cannot be undone. If you've added images or notes, these will be deleted as well.
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
            {loading ? 'Deleting...' : 'Delete Box'}
          </button>
        </div>
      </div>
    </div>
  )
}