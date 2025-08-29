import React, { useState, useRef, useEffect } from 'react'
import { Plus, Package, FolderPlus, CalendarPlus } from 'lucide-react'

interface ActionOption {
  id: string
  label: string
  icon: React.ComponentType<any>
  onClick: () => void
}

interface ActionButtonProps {
  onAddModel: () => void
  onAddCollection: () => void
  onAddBooking: () => void
  className?: string
}

export function ActionButton({ onAddModel, onAddCollection, onAddBooking, className = '' }: ActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)

  const options: ActionOption[] = [
    {
      id: 'model',
      label: 'Model',
      icon: Package,
      onClick: () => {
        onAddModel()
        setIsOpen(false)
      }
    },
    {
      id: 'collection',
      label: 'Collection', 
      icon: FolderPlus,
      onClick: () => {
        onAddCollection()
        setIsOpen(false)
      }
    },
    {
      id: 'booking',
      label: 'Booking',
      icon: CalendarPlus,
      onClick: () => {
        onAddBooking()
        setIsOpen(false)
      }
    }
  ]

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close menu on escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div ref={buttonRef} className={`relative z-50 ${className}`}>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[45] bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Options Menu */}
      {isOpen && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-modal-bg border border-border-custom rounded-2xl shadow-lg py-2 min-w-[140px] animate-menu-slide-in">
            {options.map((option, index) => {
              const IconComponent = option.icon
              return (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className="w-full px-4 py-3 flex items-center space-x-3 text-left hover:bg-bg-secondary transition-colors duration-150"
                >
                  <div className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-icon" />
                  </div>
                  <span className="text-sm font-medium text-text">{option.label}</span>
                </button>
              )
            })}
          </div>
          
          {/* Arrow pointing down to button */}
          <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2">
            <div className="w-3 h-3 bg-modal-bg border-b border-r border-border-custom transform rotate-45"></div>
          </div>
        </div>
      )}

      {/* Main Action Button - Halfway outside tab bar */}
      <div className="flex flex-col items-center justify-center px-1 min-w-0 flex-1 relative">
        {/* Elevated button positioned 60px above tab bar */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleToggle}
            className={`
              floating-action-button
              relative w-14 h-14 rounded-full bg-brand
              flex items-center justify-center
              transition-all duration-150 ease-out
              transform active:scale-95
              hover:bg-brand-hover
              border-4 border-bg-primary dark:border-bg-primary
              ${isOpen ? 'scale-105' : 'scale-100'}
            `}
          >
            <Plus className={`w-7 h-7 text-white transition-transform duration-150 ${
              isOpen ? 'rotate-45' : 'rotate-0'
            }`} />
          </button>
        </div>
      </div>
    </div>
  )
}