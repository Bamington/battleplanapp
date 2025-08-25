import React from 'react'
import { Package, Calendar } from 'lucide-react'
import { TabButton } from './TabButton'

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
      name: 'Bookings',
      icon: Calendar
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/75 backdrop-blur-md border-t border-border-custom/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex justify-center items-center space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              icon={tab.icon}
              label={tab.name}
              isActive={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </nav>
      </div>
    </div>
  )
}