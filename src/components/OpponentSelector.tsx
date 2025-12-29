import React, { useState, useEffect } from 'react'
import { User, Plus, ChevronDown } from 'lucide-react'
import { Opponent } from '../hooks/useOpponents'

interface OpponentSelectorProps {
  selectedOpponentId: number | null
  onOpponentChange: (opponentId: number | null, opponentName: string | null) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  opponents: Opponent[]
  loading: boolean
  findOrCreateOpponent: (name: string) => Promise<Opponent | null>
}

export function OpponentSelector({ 
  selectedOpponentId, 
  onOpponentChange, 
  disabled = false,
  placeholder = "Select or create opponent...",
  className = "",
  opponents,
  loading,
  findOrCreateOpponent
}: OpponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateOption, setShowCreateOption] = useState(false)

  // Debug logging
  React.useEffect(() => {
    console.log('OpponentSelector mounted/updated:', {
      selectedOpponentId,
      opponentsCount: opponents?.length || 0,
      loading,
      opponents: (opponents || []).map(opp => ({ id: opp.id, name: opp.opp_name }))
    })
  }, [selectedOpponentId, opponents, loading])

  const selectedOpponent = opponents?.find(opp => opp.id === selectedOpponentId)

  // Filter opponents based on search term
  const filteredOpponents = (opponents || []).filter(opp =>
    opp.opp_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if we should show the "Create new" option
  useEffect(() => {
    if (searchTerm.trim() && !filteredOpponents.some(opp => 
      opp.opp_name?.toLowerCase() === searchTerm.toLowerCase()
    )) {
      setShowCreateOption(true)
    } else {
      setShowCreateOption(false)
    }
  }, [searchTerm, filteredOpponents])

  const handleOpponentSelect = (opponent: Opponent) => {
    console.log('Opponent selected:', opponent)
    onOpponentChange(opponent.id, opponent.opp_name)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleCreateOpponent = async () => {
    if (!searchTerm.trim()) {
      console.log('Cannot create opponent: empty search term')
      return
    }

    console.log('Creating opponent:', searchTerm.trim())
    try {
      const newOpponent = await findOrCreateOpponent(searchTerm.trim())
      if (newOpponent) {
        console.log('Opponent created successfully:', newOpponent)
        onOpponentChange(newOpponent.id, newOpponent.opp_name)
        setIsOpen(false)
        setSearchTerm('')
      } else {
        console.log('Failed to create opponent - findOrCreateOpponent returned null')
      }
    } catch (error) {
      console.error('Error in handleCreateOpponent:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && showCreateOption && searchTerm.trim()) {
      e.preventDefault()
      handleCreateOpponent()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    }
  }


  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
        <input
          type="text"
          value={isOpen ? searchTerm : (selectedOpponent?.opp_name || '')}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text ${className}`}
          disabled={disabled}
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-primary border border-border-custom rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-secondary-text">Loading opponents...</div>
          ) : (
            <>
              {filteredOpponents.map((opponent) => (
                <button
                  key={opponent.id}
                  onMouseDown={(e) => {
                    e.preventDefault() // Prevent input blur
                    handleOpponentSelect(opponent)
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-bg-secondary text-text flex items-center"
                >
                  <User className="w-4 h-4 mr-3 text-icon" />
                  {opponent.opp_name}
                </button>
              ))}
              
              {showCreateOption && (
                <button
                  onMouseDown={(e) => {
                    e.preventDefault() // Prevent input blur
                    handleCreateOpponent()
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-bg-secondary text-text flex items-center border-t border-border-custom"
                >
                  <Plus className="w-4 h-4 mr-3 text-icon" />
                  Create "{searchTerm.trim()}"
                </button>
              )}
              
              {filteredOpponents.length === 0 && !showCreateOption && (
                <div className="px-4 py-3 text-secondary-text">
                  No opponents found
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={(e) => {
            // Don't close if clicking on the dropdown itself
            if (e.target === e.currentTarget) {
              setIsOpen(false)
              setSearchTerm('')
            }
          }}
        />
      )}
    </div>
  )
}
