import React from 'react'
import { Plus, X } from 'lucide-react'

interface FABButtonProps {
  isExpanded: boolean
  onClick: () => void
}

export function FABButton({ isExpanded, onClick }: FABButtonProps) {
  return (
    <button
      onClick={onClick}
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
  )
}
