import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
  description?: string
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  id
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  const selectedOption = options.find(option => option.value === value)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && focusedIndex >= 0) {
          onChange(options[focusedIndex].value)
          setIsOpen(false)
          setFocusedIndex(-1)
        } else {
          setIsOpen(!isOpen)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0)
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, options.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(options.length - 1)
        } else {
          setFocusedIndex(prev => Math.max(prev - 1, 0))
        }
        break
      case 'Tab':
        setIsOpen(false)
        setFocusedIndex(-1)
        break
    }
  }

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest'
      })
    }
  }, [focusedIndex])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      setFocusedIndex(-1)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setFocusedIndex(-1)
  }

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      {/* Select Button */}
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-bg-primary border border-border-custom rounded-lg
          transition-colors duration-200
          flex items-center justify-between
          focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)]
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-bg-secondary' 
            : 'hover:bg-bg-secondary cursor-pointer'
          }
          ${isOpen ? 'ring-2 ring-[var(--color-brand)] border-[var(--color-brand)]' : ''}
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={`block truncate ${!selectedOption ? 'text-secondary-text' : 'text-text'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-secondary-text transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-modal-bg border border-border-custom rounded-lg shadow-lg max-h-60 overflow-auto">
          <div role="listbox" className="py-1">
            {options.map((option, index) => (
              <div
                key={option.value}
                ref={el => optionRefs.current[index] = el}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleOptionClick(option.value)}
                className={`
                  px-4 py-3 cursor-pointer flex items-center justify-between
                  transition-colors duration-150
                  ${focusedIndex === index ? 'bg-bg-secondary' : ''}
                  ${option.value === value ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'text-text hover:bg-bg-secondary'}
                `}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-sm text-secondary-text truncate">
                      {option.description}
                    </div>
                  )}
                </div>
                {option.value === value && (
                  <Check className="w-4 h-4 text-[var(--color-brand)] flex-shrink-0 ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}