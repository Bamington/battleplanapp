import React from 'react'
import { X } from 'lucide-react'

interface ModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  children: React.ReactNode
  className?: string
}

export function ModalWrapper({ 
  isOpen, 
  onClose, 
  title, 
  maxWidth = 'lg',
  children, 
  className = '' 
}: ModalWrapperProps) {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }[maxWidth]

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-container"
      onClick={handleBackdropClick}
    >
      <div className={`bg-modal-bg rounded-lg w-full ${maxWidthClass} modal-content ${className}`}>
        {title && (
          <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
            <h2 className="text-lg font-bold text-secondary-text uppercase tracking-wide">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6 text-icon" />
            </button>
          </div>
        )}
        
        <div className="modal-form-content px-6">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ModalActionsProps {
  children: React.ReactNode
  className?: string
}

export function ModalActions({ children, className = '' }: ModalActionsProps) {
  return (
    <div className={`modal-actions px-6 ${className}`}>
      {children}
    </div>
  )
}