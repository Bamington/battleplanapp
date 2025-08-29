import React from 'react'
import { LucideIcon } from 'lucide-react'

interface IconTabButtonProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  onClick: () => void
  className?: string
}

export function IconTabButton({ icon: Icon, label, isActive, onClick, className = '' }: IconTabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center py-2 px-3
        transition-all duration-150 ease-out
        transform active:scale-95
        min-w-0 flex-1
        ${className}
      `}
    >
      {/* Icon container with background */}
      <div className={`
        relative w-7 h-7 rounded-full mb-1
        flex items-center justify-center
        transition-all duration-150 ease-out
        ${isActive 
          ? 'bg-brand' 
          : 'bg-transparent'
        }
      `}>
        {/* Active state background with smooth transition */}
        <div className={`
          absolute inset-0 rounded-full bg-brand
          transition-all duration-150 ease-out
          ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
        `} />
        
        {/* Icon with proper z-index to appear above background */}
        <Icon className={`
          relative z-10 w-4 h-4 transition-colors duration-150
          ${isActive ? 'text-white' : 'text-secondary-text hover:text-text'}
        `} />
      </div>
      
      {/* Label */}
      <span className={`
        text-xs font-medium transition-colors duration-150 leading-tight
        ${isActive ? 'text-brand' : 'text-secondary-text hover:text-text'}
      `}>
        {label}
      </span>
    </button>
  )
}