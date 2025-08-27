import React from 'react'
import { LucideIcon } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
}

interface TabSelectorProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabSelector({ tabs, activeTab, onTabChange, className = '' }: TabSelectorProps) {
  return (
    <div className={`flex space-x-1 bg-bg-secondary rounded-lg p-1 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white text-brand shadow-sm'
                : 'text-secondary-text hover:text-text'
            }`}
          >
            <Icon className={`w-4 h-4 ${
              isActive ? 'text-brand' : 'text-secondary-text'
            }`} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
