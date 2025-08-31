import React from 'react'
import { Package, Calendar, Sword, Heart, HelpCircle } from 'lucide-react'
import { IconTabButton } from './IconTabButton'
import { ActionButton } from './ActionButton'

interface TabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onAddModel: () => void
  onAddCollection: () => void
  onAddBooking: () => void
  onAddWishlist?: () => void
  onAddBattle?: () => void
  isBetaTester?: boolean
}

export function TabBar({ 
  activeTab, 
  onTabChange, 
  onAddModel, 
  onAddCollection, 
  onAddBooking,
  onAddWishlist,
  onAddBattle,
  isBetaTester = false
}: TabBarProps) {
  const leftTabs = [
    {
      id: 'collection',
      label: 'Collection',
      icon: Package
    },
    {
      id: 'battles',
      label: 'Battles',
      icon: Sword
    }
  ]

  const rightTabs = [
    {
      id: 'battleplan',
      label: 'Bookings',
      icon: Calendar
    },
    {
      id: 'soon',
      label: 'Soon...',
      icon: HelpCircle
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-bg-primary border-t border-border-custom">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-safe">
        <nav className="flex items-center justify-between" aria-label="Tabs">
          {/* Left tabs */}
          <div className="flex items-center justify-between flex-1">
            {leftTabs.map((tab) => (
              <IconTabButton
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
                className=""
              />
            ))}
          </div>
          
          {/* Center action button */}
          <div>
            <ActionButton
              onAddModel={onAddModel}
              onAddCollection={onAddCollection}
              onAddBooking={onAddBooking}
              onAddWishlist={onAddWishlist}
              onAddBattle={onAddBattle}
              isBetaTester={isBetaTester}
            />
          </div>
          
                     {/* Right tabs */}
           <div className="flex items-center justify-between flex-1">
             {rightTabs.map((tab) => (
               <IconTabButton
                 key={tab.id}
                 icon={tab.icon}
                 label={tab.label}
                 isActive={activeTab === tab.id}
                 onClick={tab.id === 'soon' ? undefined : () => onTabChange(tab.id)}
                 className={tab.id === 'soon' ? 'cursor-default opacity-50' : ''}
               />
             ))}
           </div>
        </nav>
      </div>
    </div>
  )
}

