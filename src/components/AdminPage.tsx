import React, { useState } from 'react'
import { ChevronRight, Users, Gamepad2, MapPin, ArrowLeft, GitBranch, Package, Palette } from 'lucide-react'
import { ManageUsersPage } from './ManageUsersPage'
import { ManageGamesPage } from './ManageGamesPage'
import { ManageModelsPage } from './ManageModelsPage'
import { ManageLocationsPage } from './ManageLocationsPage'
import { ReleaseManagementPage } from './ReleaseManagementPage'
import { ThemeEditor } from './ThemeEditor'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { useAuth } from '../hooks/useAuth'

interface AdminPageProps {
  onBack: () => void
  onLogoClick?: () => void
}

export function AdminPage({ onBack, onLogoClick }: AdminPageProps) {
  console.log('=== AdminPage rendering ===')
  const [currentView, setCurrentView] = useState<'main' | 'users' | 'games' | 'models' | 'locations' | 'release-management' | 'theme-editor'>('main')
  const { user } = useAuth()
  
  console.log('AdminPage user:', user)
  console.log('AdminPage user is_admin:', user?.is_admin)
  console.log('AdminPage currentView:', currentView)

  const handleAdminClick = () => {
    // This is a no-op since we're already in admin
  }

  const handleTabChange = (_tab: string) => {
    // This is a no-op since we're in admin mode
  }

  if (currentView === 'users') {
    return <ManageUsersPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'games') {
    return <ManageGamesPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'models') {
    return <ManageModelsPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'locations') {
    return <ManageLocationsPage onBack={() => setCurrentView('main')} isLocationAdmin={user?.is_location_admin || false} />
  }


  if (currentView === 'release-management') {
    console.log('Rendering ReleaseManagementPage')
    return <ReleaseManagementPage onBack={() => setCurrentView('main')} onLogoClick={onLogoClick} />
  }

  if (currentView === 'theme-editor') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {}} 
          onAdminClick={handleAdminClick}
          onSettingsClick={() => {}}
          activeTab="collection"
          onTabChange={handleTabChange}
          onLogoClick={onLogoClick}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <ThemeEditor onBack={() => setCurrentView('main')} />
        </div>
        <TabBar 
          activeTab="collection" 
          onTabChange={(_tab) => {
            // This is a no-op since we're in admin mode
          }} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header 
        onAddModel={() => {}} 
        onAdminClick={handleAdminClick}
        onSettingsClick={() => {}}
        activeTab="collection"
        onTabChange={handleTabChange}
        onLogoClick={onLogoClick}
      />
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
              <ChevronRight className="w-5 h-5 text-icon" />
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
              <ChevronRight className="w-5 h-5 text-icon" />
            </button>
          )}

          <button
            onClick={() => setCurrentView('models')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Package className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Manage Models</span>
            </div>
            <ChevronRight className="w-5 h-5 text-icon" />
          </button>

          <button
            onClick={() => setCurrentView('locations')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <MapPin className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Manage Locations</span>
            </div>
            <ChevronRight className="w-5 h-5 text-icon" />
          </button>

          {user?.is_admin && (
            <button
              onClick={() => setCurrentView('theme-editor')}
              className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <Palette className="w-6 h-6 text-secondary-text" />
                <span className="text-lg font-semibold text-text">Theme Editor</span>
              </div>
              <ChevronRight className="w-5 h-5 text-icon" />
            </button>
          )}

          {user?.is_admin && (
            <button
              onClick={() => {
                console.log('Release Management button clicked!')
                setCurrentView('release-management')
              }}
              className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <GitBranch className="w-6 h-6 text-secondary-text" />
                <span className="text-lg font-semibold text-text">Release Management</span>
              </div>
              <ChevronRight className="w-5 h-5 text-icon" />
            </button>
          )}
        </div>
      </div>
      <TabBar 
        activeTab="collection" 
        onTabChange={(_tab) => {
          // This is a no-op since we're in admin mode
        }} 
      />
    </div>
  )
}