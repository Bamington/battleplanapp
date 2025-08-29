import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X, Check, MapPin } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Option {
  id: string
  name: string
  icon?: string | null
  address?: string // For locations
}

interface MultiSelectDropdownProps {
  options: Option[]
  selectedOptions: string[]
  onSelectionChange: (selectedIds: string[]) => void
  placeholder?: string
  maxSelections?: number
  searchable?: boolean
  type?: 'game' | 'location' | 'role' // To determine icon fallback
}

export function MultiSelectDropdown({ 
  options, 
  selectedOptions, 
  onSelectionChange, 
  placeholder = "Select options", 
  maxSelections = 5,
  searchable = true,
  type = 'game'
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, maxHeight: 400 })
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (option.address && option.address.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Calculate dropdown position
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
      
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const margin = 20 // Margin from edges of screen
      const maxHeight = Math.min(400, spaceBelow - margin) // Max height with margin
      
      // Calculate position accounting for scroll offset
      let top = rect.bottom + scrollTop + 4 // Small gap below input
      let left = rect.left + scrollLeft
      let width = rect.width
      
      // If there's not enough space below, position above the input
      if (spaceBelow < maxHeight + margin && spaceAbove > maxHeight + margin) {
        top = rect.top + scrollTop - maxHeight - 4 // Small gap above input
      }
      
      // Ensure dropdown doesn't go off the left edge
      if (left < margin + scrollLeft) {
        left = margin + scrollLeft
        width = Math.min(rect.width, window.innerWidth - (margin * 2))
      }
      
      // Ensure dropdown doesn't go off the right edge
      if (left + width > window.innerWidth + scrollLeft - margin) {
        left = window.innerWidth + scrollLeft - width - margin
      }
      
      setDropdownPosition({
        top,
        left,
        width,
        maxHeight: Math.max(200, maxHeight) // Minimum height of 200px
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOptionToggle = (optionId: string) => {
    const newSelection = selectedOptions.includes(optionId)
      ? selectedOptions.filter(id => id !== optionId)
      : selectedOptions.length < maxSelections
        ? [...selectedOptions, optionId]
        : selectedOptions

    onSelectionChange(newSelection)
  }

  const handleRemoveOption = (optionId: string) => {
    onSelectionChange(selectedOptions.filter(id => id !== optionId))
  }

  const getSelectedOptionNames = () => {
    return selectedOptions.map(id => options.find(opt => opt.id === id)?.name).filter(Boolean)
  }

  const getIconFallback = () => {
    if (type === 'game') return '🎮'
    if (type === 'location') return '📍'
    if (type === 'role') return '👤'
    return '📍'
  }

  const renderOptionIcon = (option: Option) => {
    if (option.icon) {
      return (
        <img 
          src={option.icon} 
          alt={`${option.name} icon`}
          className="w-6 h-6 rounded object-cover"
        />
      )
    }
    return (
      <div className="w-6 h-6 rounded bg-bg-secondary flex items-center justify-center text-xs">
        {getIconFallback()}
      </div>
    )
  }

  const renderDropdownContent = () => (
    <div
      ref={dropdownRef}
      className="absolute z-[99999] bg-bg-primary border border-border-custom rounded-lg shadow-lg overflow-hidden multiselect-dropdown-portal"
      data-dropdown="true"
      style={{
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        maxHeight: `${dropdownPosition.maxHeight}px`
      }}
    >
      {searchable && (
        <div className="p-3 border-b border-border-custom">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-12 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text text-sm"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-icon hover:text-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="overflow-y-auto" style={{ maxHeight: `${dropdownPosition.maxHeight - 120}px` }}>
        {filteredOptions.length === 0 ? (
          <div className="p-4 text-center text-secondary-text text-sm">
            No options found
          </div>
        ) : (
          filteredOptions.map((option) => {
            const isSelected = selectedOptions.includes(option.id)
            const isDisabled = !isSelected && selectedOptions.length >= maxSelections

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleOptionToggle(option.id)}
                disabled={isDisabled}
                className={`w-full p-3 flex items-center space-x-3 hover:bg-bg-secondary transition-colors ${
                  isSelected ? 'bg-bg-secondary' : ''
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {renderOptionIcon(option)}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-text font-medium truncate">{option.name}</div>
                    {option.address && (
                      <div className="text-secondary-text text-sm truncate">{option.address}</div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-[var(--color-brand)] flex-shrink-0" />
                )}
              </button>
            )
          })
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="p-3 border-t border-border-custom">
          <div className="text-xs text-secondary-text">
            {selectedOptions.length} of {maxSelections} selected
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className="relative" data-dropdown="true">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-border-custom rounded-lg bg-bg-primary text-left hover:border-[var(--color-brand)] transition-colors focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {selectedOptions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {getSelectedOptionNames().map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center space-x-1 bg-bg-secondary px-2 py-1 rounded text-sm"
                  >
                    <span className="truncate max-w-20">{name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveOption(selectedOptions[index])
                      }}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-secondary-text">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-icon transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && createPortal(renderDropdownContent(), document.body)}
    </div>
  )
}
