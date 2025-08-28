import React from 'react'
import { X } from 'lucide-react'

interface CancelBookingModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading?: boolean
}

export function CancelBookingModal({ isOpen, onClose, onConfirm, loading = false }: CancelBookingModalProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-container"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6 modal-content">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-title">
            Are you sure you want to cancel this booking?
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-base text-secondary-text mb-6">
          We'll delete this booking and make the table available for someone else.
        </p>

        <div className="flex space-x-3 modal-actions">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost btn-flex"
          >
            No, I'll keep my booking
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn-danger btn-flex"
          >
            {loading ? 'Deleting...' : 'Yes, Delete my booking'}
          </button>
        </div>
      </div>
    </div>
  )
}