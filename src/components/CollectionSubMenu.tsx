import React from 'react'
import { Package, Layers, Clock, Heart } from 'lucide-react'

interface CollectionSubMenuProps {
  activeView: 'recent' | 'collections' | 'models' | 'wishlist'
  onViewChange: (view: 'recent' | 'collections' | 'models' | 'wishlist') => void
  isBetaTester?: boolean
}

export function CollectionSubMenu({ activeView, onViewChange, isBetaTester = false }: CollectionSubMenuProps) {
  const baseMenuItems = [
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

  const wishlistItem = {
    id: 'wishlist' as const,
    label: 'Wishlist',
    icon: Heart
  }

  const menuItems = isBetaTester ? [...baseMenuItems, wishlistItem] : baseMenuItems

  return (
    <div className="bg-bg-secondary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-2">
          <div className={`grid gap-6 w-full ${isBetaTester ? 'grid-cols-4 max-w-lg' : 'grid-cols-3 max-w-md'}`}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-300 ease-in-out w-full group"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out mb-1 ${
                    isActive 
                      ? 'bg-[var(--color-brand)]/20 scale-110 opacity-100 shadow-[0_0px_16px_rgba(114,77,221,0.44)]' 
                      : 'bg-border-custom opacity-75 group-hover:opacity-90 group-hover:scale-105'
                  }`}>
                    <Icon className={`w-4 h-4 transition-all duration-300 ease-in-out ${
                      isActive 
                        ? 'text-icon-active opacity-100 scale-110' 
                        : 'text-icon opacity-75 group-hover:opacity-90'
                    }`} />
                  </div>
                  <span className={`text-xs font-medium transition-all duration-300 ease-in-out text-center leading-tight ${
                    isActive 
                      ? 'text-text opacity-100 scale-105' 
                      : 'text-secondary-text opacity-75 group-hover:opacity-90'
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