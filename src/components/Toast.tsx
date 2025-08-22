import React, { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-2 duration-300">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 flex items-center space-x-3 max-w-sm">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <p className="text-sm font-medium text-green-800 flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}