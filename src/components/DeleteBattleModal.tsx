import React from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface DeleteBattleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function DeleteBattleModal({ isOpen, onClose, onConfirm, loading = false }: DeleteBattleModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-bg-primary rounded-lg shadow-lg max-w-md w-full mx-4 modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-title">Delete Battle</h2>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-base text-secondary-text mb-6">
            Are you sure you want to delete this battle? This action cannot be undone.
          </p>
          
          {/* Actions */}
          <div className="flex space-x-3 modal-actions">
            <button
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 btn-danger"
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Battle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
