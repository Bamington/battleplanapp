import React, { useState } from 'react'
import { Plus, X, Package, User } from 'lucide-react'

interface ExpandableFABProps {
  onAddModel: () => void
  onAddCollection: () => void
}

export function ExpandableFAB({ onAddModel, onAddCollection }: ExpandableFABProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleAddModel = () => {
    setIsExpanded(false)
    onAddModel()
  }

  const handleAddCollection = () => {
    setIsExpanded(false)
    onAddCollection()
  }

  return (
    <div className="fixed bottom-20 right-2 z-50">
      {/* Expanded Options */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 flex flex-col space-y-3">
          {/* Add Model Option */}
          <button
            onClick={handleAddModel}
            className="flex items-center space-x-3 bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 animate-fab-slide-in-delayed"
          >
            <User className="w-8 h-8" />
            <span className="text-sm font-medium">Add Model</span>
          </button>
          
          {/* Add Collection Option */}
          <button
            onClick={handleAddCollection}
            className="flex items-center space-x-3 bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 animate-fab-slide-in"
          >
            <Package className="w-8 h-8" />
            <span className="text-sm font-medium">Add Collection</span>
          </button>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={toggleExpanded}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center ${
          isExpanded 
            ? 'bg-brand-hover text-white' 
            : 'bg-brand hover:bg-brand-hover text-white'
        }`}
      >
        {isExpanded ? (
          <X className="w-6 h-6 transition-transform duration-200" />
        ) : (
          <Plus className="w-6 h-6 transition-transform duration-200" />
        )}
      </button>
    </div>
  )
}
