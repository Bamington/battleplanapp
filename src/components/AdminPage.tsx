import React, { useState } from 'react'
import { ChevronRight, Users, Gamepad2, MapPin, ArrowLeft } from 'lucide-react'
import { ManageUsersPage } from './ManageUsersPage'
import { ManageGamesPage } from './ManageGamesPage'
import { ManageLocationsPage } from './ManageLocationsPage'
import { useAuth } from '../hooks/useAuth'

interface AdminPageProps {
  onBack: () => void
}

export function AdminPage({ onBack }: AdminPageProps) {
  const [currentView, setCurrentView] = useState<'main' | 'users' | 'games' | 'locations'>('main')
  const { user } = useAuth()

  if (currentView === 'users') {
    return <ManageUsersPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'games') {
    return <ManageGamesPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'locations') {
    return <ManageLocationsPage onBack={() => setCurrentView('main')} isLocationAdmin={user?.is_location_admin || false} />
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Collection</span>
        </button>
        <h1 className="text-4xl font-bold text-title">ADMIN PANEL</h1>
      </div>

      <div className="space-y-4 max-w-md">
        {user?.is_admin && (
          <button
            onClick={() => setCurrentView('users')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Users className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Manage Users</span>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary-text" />
          </button>
        )}

        {user?.is_admin && (
          <button
            onClick={() => setCurrentView('games')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Gamepad2 className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Manage Games</span>
            </div>
            <ChevronRight className="w-5 h-5 text-secondary-text" />
          </button>
        )}

        <button
          onClick={() => setCurrentView('locations')}
          className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-4">
            <MapPin className="w-6 h-6 text-secondary-text" />
            <span className="text-lg font-semibold text-text">Manage Locations</span>
          </div>
          <ChevronRight className="w-5 h-5 text-secondary-text" />
        </button>
      </div>
    </div>
  )
}