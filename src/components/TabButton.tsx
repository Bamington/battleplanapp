import React from 'react'
import { LucideIcon } from 'lucide-react'

interface TabButtonProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  onClick: () => void
}

export function TabButton({ icon: Icon, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
        isActive
          ? '!border-brand !text-brand'
          : 'border-transparent text-secondary-text hover:text-text hover:border-border-custom'
      }`}
    >
      <Icon className={`w-5 h-5 ${
        isActive
          ? 'text-brand'
          : 'text-secondary-text hover:text-text'
      }`} />
      <span>{label}</span>
    </button>
  )
}
