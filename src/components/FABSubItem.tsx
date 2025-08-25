import React from 'react'
import { LucideIcon } from 'lucide-react'

interface FABSubItemProps {
  icon: LucideIcon
  label: string
  onClick: () => void
  animationClass?: string
}

export function FABSubItem({ icon: Icon, label, onClick, animationClass = 'animate-fab-slide-in' }: FABSubItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 bg-brand hover:bg-brand-hover text-white px-8 py-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${animationClass}`}
    >
      <Icon className="w-8 h-8" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
