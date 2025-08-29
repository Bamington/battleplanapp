import React from 'react'
import { Package, Calendar, Sword, HelpCircle } from 'lucide-react'
import { IconTabButton } from './IconTabButton'
import { ActionButton } from './ActionButton'

interface TabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onAddModel: () => void
  onAddCollection: () => void
  onAddBooking: () => void
}

export function TabBar({ 
  activeTab, 
  onTabChange, 
  onAddModel, 
  onAddCollection, 
  onAddBooking 
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
    <div className="fixed bottom-0 left-0 right-0 z-40 tab-bar-container border-t border-border-custom/30">
      <div className="px-4 pt-2 pb-safe">
        <nav className="flex items-center justify-center" aria-label="Tabs">
          {/* Left tabs */}
          <div className="flex items-center">
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
          <div className="mx-6">
            <ActionButton
              onAddModel={onAddModel}
              onAddCollection={onAddCollection}
              onAddBooking={onAddBooking}
            />
          </div>
          
          {/* Right tabs */}
          <div className="flex items-center">
            {rightTabs.map((tab) => (
              <IconTabButton
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={tab.id === 'soon' ? () => {} : () => onTabChange(tab.id)}
                className=""
              />
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

