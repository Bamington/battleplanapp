import React from 'react'
import { Package, Layers, Clock, Heart, Brush, BarChart3 } from 'lucide-react'

interface CollectionSubMenuProps {
  activeView: 'painting-table' | 'recent' | 'collections' | 'models' | 'wishlist' | 'statistics'
  onViewChange: (view: 'painting-table' | 'recent' | 'collections' | 'models' | 'wishlist' | 'statistics') => void
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
    },
    {
      id: 'statistics' as const,
      label: 'Statistics',
      icon: BarChart3
    }
  ]

  const paintingTableItem = {
    id: 'painting-table' as const,
    label: 'Painting Table',
    icon: Brush
  }

  const wishlistItem = {
    id: 'wishlist' as const,
    label: 'Wishlist',
    icon: Heart
  }

  // Build menu items based on user role
  let menuItems = [...baseMenuItems]
  if (isBetaTester) {
    menuItems = [paintingTableItem, ...menuItems, wishlistItem]
  }

  return (
    <div className="bg-bg-secondary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2">
          {/* Mobile: Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto scrollbar-hide md:hidden">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeView === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-300 ease-in-out flex-shrink-0 group min-w-[80px]"
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
          
          {/* Desktop: Grid layout */}
          <div className={`hidden md:flex justify-center items-center`}>
            <div className={`grid gap-6 w-full ${isBetaTester ? 'grid-cols-6 max-w-4xl' : 'grid-cols-4 max-w-2xl'}`}>
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
    </div>
  )
}