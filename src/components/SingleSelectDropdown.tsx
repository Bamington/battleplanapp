import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  id: string
  name: string
}

interface SingleSelectDropdownProps {
  options: Option[]
  selectedOption: string
  onSelectionChange: (optionId: string) => void
  placeholder?: string
  className?: string
}

export function SingleSelectDropdown({ 
  options, 
  selectedOption, 
  onSelectionChange, 
  placeholder = "Select option",
  className = ""
}: SingleSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const selectedOptionData = options.find(option => option.id === selectedOption)

  const handleOptionClick = (optionId: string) => {
    onSelectionChange(optionId)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent hover:bg-bg-secondary transition-colors text-left flex items-center justify-between"
      >
        <span className={selectedOptionData ? 'text-text' : 'text-secondary-text'}>
          {selectedOptionData ? selectedOptionData.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-icon transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-bg-primary border border-border-custom rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option.id)}
              className={`w-full p-3 text-left hover:bg-bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg ${
                option.id === selectedOption ? 'bg-brand text-white hover:bg-brand' : 'text-text'
              }`}
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
