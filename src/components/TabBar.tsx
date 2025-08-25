import React from 'react'
import { Package, Calendar } from 'lucide-react'

interface TabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs = [
    {
      id: 'collection',
      name: 'Collection',
      icon: Package
    },
    {
      id: 'battleplan',
      name: 'Battleplan',
      icon: Calendar
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/75 backdrop-blur-md border-t border-border-custom/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-center items-center space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border---color-brand text-brand'
                    : 'border-transparent text-secondary-text hover:text-text hover:border-border-custom'
                }`}
              >
                <Icon className={`w-5 h-5 ${
                  isActive
                    ? 'text-icon-active'
                    : 'text-icon hover:text-icon-hover'
                }`} />
                <span className={isActive ? 'text-brand' : ''}>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}