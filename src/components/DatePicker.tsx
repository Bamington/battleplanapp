import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getTodayLocalDate, formatDateToLocalString } from '../utils/timezone'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  minDate?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({ 
  value, 
  onChange, 
  minDate = getTodayLocalDate(),
  placeholder = "Select date",
  className = "",
  disabled = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        // Add a small delay to prevent interference with button clicks
        setTimeout(() => {
          setIsOpen(false)
        }, 10)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value))
      setCurrentMonth(new Date(value))
    } else {
      // Clear selected date when value is empty
      setSelectedDate(null)
    }
  }, [value])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const formatDate = (date: Date) => {
    return formatDateToLocalString(date)
  }

  const isDateDisabled = (date: Date) => {
    const minDateObj = new Date(minDate)
    minDateObj.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    return date < minDateObj
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false
    return formatDate(date) === formatDate(selectedDate)
  }

  const handleDateClick = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDateDisabled(date)) return
    
    setSelectedDate(date)
    onChange(formatDate(date))
    setIsOpen(false)
  }

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('Previous month clicked')
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('Next month clicked')
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDate(null)
    onChange('')
    setIsOpen(false)
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Input Field */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
        <input
          type="text"
          value={selectedDate ? selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : ''}
          placeholder={placeholder}
          onClick={(e) => {
            e.stopPropagation()
            if (!disabled) setIsOpen(!isOpen)
          }}
          readOnly
          disabled={disabled}
          className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand bg-bg-primary text-text cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {selectedDate && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-text hover:text-text"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Date Picker Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 bg-bg-primary border border-border-custom rounded-lg shadow-lg z-[70] min-w-[280px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-custom">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-bg-secondary rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-icon" />
            </button>
            <h3 className="text-sm font-semibold text-text">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-bg-secondary rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-icon" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs text-secondary-text text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="text-center">
                  {day ? (
                    <button
                      onClick={(e) => handleDateClick(day, e)}
                      disabled={isDateDisabled(day)}
                      className={`w-8 h-8 text-sm rounded-full transition-colors ${
                        isDateSelected(day)
                          ? 'bg-brand text-white'
                          : isDateDisabled(day)
                          ? 'text-secondary-text cursor-not-allowed'
                          : 'hover:bg-bg-secondary text-text'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
