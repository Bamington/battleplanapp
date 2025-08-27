import React, { useState } from 'react'
import { ChevronRight, Users, Gamepad2, MapPin, ArrowLeft, Share2, GitBranch } from 'lucide-react'
import { ManageUsersPage } from './ManageUsersPage'
import { ManageGamesPage } from './ManageGamesPage'
import { ManageLocationsPage } from './ManageLocationsPage'
import { SharePreviewPage } from './SharePreviewPage'
import { Header } from './Header'
import { TabBar } from './TabBar'
import { useAuth } from '../hooks/useAuth'
import { useVersion } from '../hooks/useVersion'

interface AdminPageProps {
  onBack: () => void
}

export function AdminPage({ onBack }: AdminPageProps) {
  const [currentView, setCurrentView] = useState<'main' | 'users' | 'games' | 'locations' | 'share-preview'>('main')
  const { user } = useAuth()
  const { currentVersion, createNewVersion, loading: versionLoading } = useVersion()

  const handleAdminClick = () => {
    // This is a no-op since we're already in admin
  }

  const handleTabChange = (tab: string) => {
    // This is a no-op since we're in admin mode
  }

  if (currentView === 'users') {
    return <ManageUsersPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'games') {
    return <ManageGamesPage onBack={() => setCurrentView('main')} />
  }

  if (currentView === 'locations') {
    return <ManageLocationsPage onBack={() => setCurrentView('main')} isLocationAdmin={user?.is_location_admin || false} />
  }

  if (currentView === 'share-preview') {
    return <SharePreviewPage onBack={() => setCurrentView('main')} />
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header 
        onAddModel={() => {}} 
        onAdminClick={handleAdminClick}
        onSettingsClick={() => {}}
        activeTab="collection"
        onTabChange={handleTabChange}
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
            onClick={() => setCurrentView('locations')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <MapPin className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Manage Locations</span>
            </div>
            <ChevronRight className="w-5 h-5 text-icon" />
          </button>

          <button
            onClick={() => setCurrentView('share-preview')}
            className="w-full bg-bg-card border border-border-custom rounded-lg p-6 hover:bg-bg-secondary transition-colors flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Share2 className="w-6 h-6 text-secondary-text" />
              <span className="text-lg font-semibold text-text">Share Preview</span>
            </div>
            <ChevronRight className="w-5 h-5 text-icon" />
          </button>

          {user?.is_admin && (
            <div className="bg-bg-card border border-border-custom rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                <GitBranch className="w-6 h-6 text-secondary-text" />
                <span className="text-lg font-semibold text-text">Version Management</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-secondary-text">Current Version:</span>
                  <span className="font-mono text-text">
                    {versionLoading ? 'Loading...' : currentVersion ? `v${currentVersion.ver_number}` : 'Unknown'}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await createNewVersion()
                      alert('Version incremented successfully!')
                    } catch (error) {
                      alert('Failed to increment version: ' + error)
                    }
                  }}
                  disabled={versionLoading}
                  className="w-full bg-[var(--color-brand)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-brand)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {versionLoading ? 'Updating...' : 'Increment Version'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <TabBar 
        activeTab="collection" 
        onTabChange={(tab) => {
          // This is a no-op since we're in admin mode
        }} 
      />
    </div>
  )
}