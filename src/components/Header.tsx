import React, { useState } from 'react'
import { Menu, X, User, Plus, Settings, Moon, Sun, Shield, Package, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'

interface HeaderProps {
  onAddModel?: () => void
  onAdminClick?: () => void
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function Header({ onAddModel, onAdminClick, activeTab, onTabChange }: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNavigationMenuOpen, setIsNavigationMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false)
    await signOut()
  }

  const navigationItems = [
    {
      id: 'collection',
      name: 'Collection',
      icon: Package
    },
    {
      id: 'battleplan',
      name: 'Battleplan',
      icon: Calendar
    }
  ]

  const handleNavigationItemClick = (tabId: string) => {
    setIsNavigationMenuOpen(false)
    onTabChange?.(tabId)
  }

  return (
    <>
      <header className="bg-bg-primary shadow-sm border-b border-border-custom relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Navigation Menu */}
            <div className="flex items-center">
              {user && (
                <button
                  onClick={() => setIsNavigationMenuOpen(!isNavigationMenuOpen)}
                  className="text-secondary-text hover:text-text focus:outline-none mr-4"
                >
                  {isNavigationMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center flex-1">
              <img 
                src={isDarkMode ? "Battleplan-Logo-Purple.svg" : "Battleplan-Logo-Purple.svg"}
                alt="Mini Myths Logo" 
                className="max-h-[300px] w-auto"
              />
            </div>

            {/* Right side - Profile Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Profile Menu Button */}
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="text-secondary-text hover:text-text focus:outline-none"
                  >
                    <User className="w-6 h-6" />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Profile Menu Dropdown */}
          {user && (
            <div className={`absolute right-4 top-16 bg-bg-primary border border-border-custom rounded-lg shadow-lg py-2 z-50 min-w-[200px] transition-all duration-200 ease-in-out ${
              isProfileMenuOpen 
                ? 'opacity-100 scale-100 translate-y-0' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}>
              {/* User info */}
              <div className="px-4 py-2 border-b border-border-custom">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-base text-text">{user.email}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  onAdminClick?.()
                }}
                className={`flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors ${
                  (user?.is_admin || user?.is_location_admin) ? '' : 'hidden'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Admin</span>
              </button>
              
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false)
                  // TODO: Navigate to settings page when created
                }}
                className="flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              
              <div className="flex items-center justify-between px-4 py-2 hover:bg-bg-secondary transition-colors">
                <div className="flex items-center space-x-3">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <span className="text-base font-semibold text-text">
                    {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                    isDarkMode ? 'bg-amber-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation Drawer */}
      {user && (
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-bg-primary border-r border-border-custom shadow-lg transform transition-transform duration-300 ease-in-out ${
          isNavigationMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-custom">
              <h2 className="text-lg font-semibold text-title">Navigation</h2>
              <button
                onClick={() => setIsNavigationMenuOpen(false)}
                className="text-secondary-text hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navigation Items */}
            <nav className="flex-1 p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigationItemClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'text-secondary-text hover:text-text hover:bg-bg-secondary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  )
                })}
                
                {/* Divider */}
                <div className="border-t border-border-custom my-4"></div>
                
                {/* About Item */}
                <button
                  onClick={() => {
                    setIsNavigationMenuOpen(false)
                    onTabChange?.('about')
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors text-secondary-text hover:text-text hover:bg-bg-secondary"
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">About</span>
                </button>
                
                {/* Admin Tools Section - Only show to admins */}
                {(user?.is_admin || user?.is_location_admin) && (
                  <>
                    {/* Divider */}
                    <div className="border-t border-border-custom my-4"></div>
                    
                    {/* Admin Tools Label */}
                    <div className="px-4 py-2">
                      <span className="text-xs font-semibold text-secondary-text uppercase tracking-wide">
                        Admin Tools
                      </span>
                    </div>
                    
                    {/* All Bookings Item */}
                    <button
                      onClick={() => {
                        setIsNavigationMenuOpen(false)
                        onTabChange?.('all-bookings')
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === 'all-bookings'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'text-secondary-text hover:text-text hover:bg-bg-secondary'
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">All Bookings</span>
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Backdrop for menus */}
      {user && (
        <div 
          className={`fixed inset-0 bg-black z-30 transition-opacity duration-300 ease-in-out ${
            isNavigationMenuOpen
              ? 'bg-opacity-50 pointer-events-auto' 
              : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsNavigationMenuOpen(false)}
        />
      )}
      
      {/* Backdrop for profile menu */}
      {user && (
        <div 
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-200 ease-in-out ${
            isProfileMenuOpen
              ? 'bg-opacity-25 pointer-events-auto' 
              : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            setIsProfileMenuOpen(false)
          }}
        />
      )}
    </>
  )
}