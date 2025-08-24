import React from 'react'
import { Package, Layers, Clock } from 'lucide-react'

interface CollectionSubMenuProps {
  activeView: 'recent' | 'collections' | 'models'
  onViewChange: (view: 'recent' | 'collections' | 'models') => void
}

export function CollectionSubMenu({ activeView, onViewChange }: CollectionSubMenuProps) {
  const menuItems = [
    {
      id: 'recent' as const,
      label: 'Recent',
      icon: Clock
    },
        {
      id: 'models' as const,
      label: 'Models',
      icon: Layers
    },
    {
      id: 'collections' as const,
      label: 'Collections',
      icon: Package
    }

  ]

  return (
    <div className="bg-bg-secondary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-3">
          <div className="flex space-x-8">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="flex flex-col items-center space-y-2 px-6 py-2 rounded-lg transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-border-custom transition-opacity">
                    <Icon className={`w-4 h-4 transition-opacity ${
                      isActive ? 'text-icon-active opacity-100' : 'text-icon opacity-75'
                    }`} />
                  </div>
                  <span className={`text-lg font-medium transition-colors ${
                    isActive ? 'text-text' : 'text-secondary-text'
                  }`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}