import React, { useState } from 'react'
import { ChevronRight, Users, Gamepad2, MapPin, ArrowLeft, GitBranch, Package, Palette, FolderOpen, Mail, Activity, Paintbrush } from 'lucide-react'
import { ManageUsersPage } from './ManageUsersPage'
import { ManageGamesPage } from './ManageGamesPage'
import { ManageModelsPage } from './ManageModelsPage'
import { ManageLocationsPage } from './ManageLocationsPage'
import { ManageCollectionsPage } from './ManageCollectionsPage'
import { ManageHobbyItemsPage } from './ManageHobbyItemsPage'
import { ReleaseManagementPage } from './ReleaseManagementPage'
import { ThemeEditor } from './ThemeEditor'
import { StoreEmailManagement } from './StoreEmailManagement'
import { AdminActivityPage } from './AdminActivityPage'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { useAuth } from '../hooks/useAuth'

interface AdminPageProps {
  onBack: () => void
  onLogoClick?: () => void
  onTabChange?: (tab: string) => void
}

export function AdminPage({ onBack, onLogoClick, onTabChange }: AdminPageProps) {
  console.log('=== AdminPage rendering ===')
  const [currentView, setCurrentView] = useState<'main' | 'users' | 'games' | 'models' | 'collections' | 'locations' | 'hobby-items' | 'release-management' | 'theme-editor' | 'store-emails' | 'activity'>('main')
  const { user } = useAuth()
  
  console.log('AdminPage user:', user)
  console.log('AdminPage user is_admin:', user?.is_admin)
  console.log('AdminPage currentView:', currentView)

  const handleAdminClick = () => {
    // This is a no-op since we're already in admin
  }

  const handleTabChange = (tab: string) => {
    // Close admin panel and switch to the requested tab
    if (onTabChange) {
      onTabChange(tab)
    }
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

  if (currentView === 'collections') {
    return <ManageCollectionsPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'hobby-items') {
    return <ManageHobbyItemsPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'locations') {
    return <ManageLocationsPage onBack={() => setCurrentView('main')} isLocationAdmin={user?.is_location_admin || false} />
  }

  if (currentView === 'activity') {
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
        <AdminActivityPage onBack={() => setCurrentView('main')} />
        <TabBar
          activeTab="collection"
          onTabChange={handleTabChange}
        />
      </div>
    )
  }

  if (currentView === 'store-emails') {
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
              onClick={() => setCurrentView('main')}
              className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Admin</span>
            </button>
          </div>
          <StoreEmailManagement />
        </div>
        <TabBar
          activeTab="collection"
          onTabChange={handleTabChange}
        />
      </div>
    )
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
          onTabChange={handleTabChange}
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
              onClick={() => setCurrentView('activity')}
              className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <Activity className="w-6 h-6 text-secondary-text" />
                <span className="text-lg font-semibold text-text">App Activity</span>
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
            onClick={() => setCurrentView('hobby-items')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Paintbrush className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Manage Hobby Items</span>
            </div>
            <ChevronRight className="w-5 h-5 text-icon" />
          </button>

          {user?.is_admin && (
            <button
              onClick={() => setCurrentView('collections')}
              className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <FolderOpen className="w-6 h-6 text-secondary-text" />
                <span className="text-lg font-semibold text-text">Collection Manager</span>
              </div>
              <ChevronRight className="w-5 h-5 text-icon" />
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

          {user?.is_admin && (
            <button
              onClick={() => setCurrentView('store-emails')}
              className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <Mail className="w-6 h-6 text-secondary-text" />
                <span className="text-lg font-semibold text-text">Store Email Management</span>
              </div>
              <ChevronRight className="w-5 h-5 text-icon" />
            </button>
          )}
        </div>
      </div>
      <TabBar
        activeTab="collection"
        onTabChange={handleTabChange}
      />
    </div>
  )
}