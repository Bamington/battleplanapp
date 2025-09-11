import React, { useState, useRef, useEffect } from 'react'
import { Menu, X, User, Plus, Settings, Moon, Sun, Shield, Package, Calendar, Ban, Sword, ChevronDown, ChevronRight, Clock, Layers, BarChart3, Brush, Heart, Gamepad2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'
import { useHasCustomGames } from '../hooks/useHasCustomGames'
import { Toast } from './Toast'

interface HeaderProps {
  onAddModel?: () => void
  onAdminClick?: () => void
  onSettingsClick?: () => void
  activeTab?: string
  onTabChange?: (tab: string, subView?: string) => void
  onLogoClick?: () => void
}

export function Header({ onAddModel, onAdminClick, onSettingsClick, activeTab, onTabChange, onLogoClick }: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNavigationMenuOpen, setIsNavigationMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [profileMenuPosition, setProfileMenuPosition] = useState({ top: 0, left: 0 })
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const { user, signOut, isBetaTester } = useAuth()
  const { hasCustomGames } = useHasCustomGames()
  const profileButtonRef = useRef<HTMLButtonElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Calculate profile menu position
  useEffect(() => {
    if (isProfileMenuOpen && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect()
      const menuWidth = 200 // min-w-[200px]
      const menuHeight = 250 // Increased height estimate
      
      // Position below the button
      let left = rect.left
      let top = rect.bottom + 8 // 8px gap
      
      // Prevent going off the right side of screen
      if (left + menuWidth > window.innerWidth - 16) {
        left = window.innerWidth - menuWidth - 16 // 16px margin from edge
      }
      
      // Prevent going off the left side of screen
      if (left < 16) {
        left = 16
      }
      
      // Prevent going off the bottom of screen
      if (top + menuHeight > window.innerHeight - 16) {
        top = rect.top - menuHeight - 8 // Position above the button instead
      }
      
      // Prevent going off the top of screen
      if (top < 16) {
        top = 16
      }
      
      setProfileMenuPosition({ top, left })
    }
  }, [isProfileMenuOpen])

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileButtonRef.current && 
          !profileButtonRef.current.contains(event.target as Node) &&
          profileMenuRef.current &&
          !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...')
      setIsProfileMenuOpen(false)
      const { error } = await signOut()
      console.log('Sign out result:', { error })
      if (error) {
        console.error('Sign out error:', error)
        setToastMessage('Failed to sign out. Please try again.')
        setShowToast(true)
      } else {
        console.log('Sign out successful')
        // Show success message
        setToastMessage('Successfully signed out')
        setShowToast(true)
      }
    } catch (err) {
      console.error('Sign out error:', err)
      setToastMessage('Failed to sign out. Please try again.')
      setShowToast(true)
    }
  }

  const navigationItems = [
    {
      id: 'collection',
      name: 'Collection',
      icon: Package,
      hasSubItems: true,
      subItems: [
        { id: 'collection-recent', name: 'Recent', icon: Clock, parentId: 'collection' },
        { id: 'collection-models', name: 'Models', icon: Layers, parentId: 'collection' },
        { id: 'collection-collections', name: 'Collections', icon: Package, parentId: 'collection' },
        { id: 'collection-statistics', name: 'Statistics', icon: BarChart3, parentId: 'collection' },
        ...(isBetaTester ? [
          { id: 'collection-painting-table', name: 'Painting Table', icon: Brush, parentId: 'collection' },
          { id: 'collection-wishlist', name: 'Wishlist', icon: Heart, parentId: 'collection' }
        ] : [])
      ]
    },
    ...(hasCustomGames ? [{
      id: 'custom-games',
      name: 'Custom Games',
      icon: Gamepad2,
      hasSubItems: false
    }] : []),
    {
      id: 'battles',
      name: 'Battles',
      icon: Sword,
      hasSubItems: true,
      subItems: [
        { id: 'battles-battles', name: 'Battles', icon: Sword, parentId: 'battles' },
        { id: 'battles-statistics', name: 'Statistics', icon: BarChart3, parentId: 'battles' }
      ]
    },
    {
      id: 'battleplan',
      name: 'Battleplan',
      icon: Calendar,
      hasSubItems: false
    }
  ]

  const handleNavigationItemClick = (tabId: string) => {
    setIsNavigationMenuOpen(false)
    onTabChange?.(tabId)
  }

  const handleSubItemClick = (subItemId: string, parentId: string) => {
    setIsNavigationMenuOpen(false)
    // Extract the sub-view from the sub-item ID (e.g., 'collection-recent' -> 'recent')
    const subView = subItemId.replace(`${parentId}-`, '')
    onTabChange?.(parentId, subView)
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const isItemExpanded = (itemId: string) => expandedItems.has(itemId)

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
                  {isNavigationMenuOpen ? <X className="w-6 h-6 text-icon" /> : <Menu className="w-6 h-6 text-icon" />}
                </button>
              )}
            </div>

            {/* Center - Logo */}
            <div className="flex items-center justify-center flex-1">
              <button
                onClick={() => {
                  onLogoClick?.()
                  onTabChange?.('collection')
                }}
                className="hover:opacity-80 transition-opacity focus:outline-none"
              >
                <img 
                  src={isDarkMode ? "Battleplan-Logo-Purple.svg" : "Battleplan-Logo-Purple.svg"}
                  alt="Mini Myths Logo" 
                  className="max-h-[300px] w-auto"
                />
              </button>
            </div>

            {/* Right side - Profile Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Profile Menu Button */}
                  <button
                    ref={profileButtonRef}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="text-secondary-text hover:text-text focus:outline-none"
                  >
                    <User className="w-6 h-6 text-icon hover:text-icon-hover" />
                  </button>
                </>
              ) : null}
            </div>
          </div>


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
                <X className="w-6 h-6 text-icon" />
              </button>
            </div>
            
            {/* Navigation Items */}
            <nav className="flex-1 p-4">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  const isExpanded = isItemExpanded(item.id)
                  
                  return (
                    <div key={item.id} className="space-y-1">
                      {/* Main Navigation Item */}
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            if (item.hasSubItems) {
                              toggleExpanded(item.id)
                            } else {
                              handleNavigationItemClick(item.id)
                            }
                          }}
                          className={`flex-1 flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                            isActive
                              ? 'bg-brand/10 text-brand border border-brand/20'
                              : 'text-secondary-text hover:text-text hover:bg-bg-secondary'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${
                            isActive
                              ? 'text-icon-active'
                              : 'text-icon hover:text-icon-hover'
                          }`} />
                          <span className={`font-medium ${isActive ? 'text-brand' : ''}`}>{item.name}</span>
                        </button>
                        
                        {/* Expand/Collapse Button */}
                        {item.hasSubItems && (
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="p-2 text-secondary-text hover:text-text transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* Sub Items */}
                      {item.hasSubItems && isExpanded && (
                        <div className="ml-4 space-y-1">
                          {item.subItems?.map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                              <button
                                key={subItem.id}
                                onClick={() => handleSubItemClick(subItem.id, subItem.parentId)}
                                className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors text-sm text-secondary-text hover:text-text hover:bg-bg-secondary"
                              >
                                <SubIcon className="w-4 h-4 text-icon" />
                                <span>{subItem.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
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
                  <User className="w-5 h-5 text-icon hover:text-icon-hover" />
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
                          ? 'bg-brand/10 text-brand border border-brand/20'
                          : 'text-secondary-text hover:text-text hover:bg-bg-secondary'
                      }`}
                    >
                      <Calendar className={`w-5 h-5 ${
                        activeTab === 'all-bookings'
                          ? 'text-icon-active'
                          : 'text-icon hover:text-icon-hover'
                      }`} />
                      <span className={`font-medium ${activeTab === 'all-bookings' ? 'text-brand' : ''}`}>All Bookings</span>
                    </button>

                    {/* Blocked Dates Item */}
                    <button
                      onClick={() => {
                        setIsNavigationMenuOpen(false)
                        onTabChange?.('blocked-dates')
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === 'blocked-dates'
                          ? 'bg-brand/10 text-brand border border-brand/20'
                          : 'text-secondary-text hover:text-text hover:bg-bg-secondary'
                      }`}
                    >
                      <Ban className={`w-5 h-5 ${
                        activeTab === 'blocked-dates'
                          ? 'text-icon-active'
                          : 'text-icon hover:text-icon-hover'
                      }`} />
                      <span className={`font-medium ${activeTab === 'blocked-dates' ? 'text-brand' : ''}`}>Blocked Dates</span>
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
      
      {/* Profile Menu Dropdown */}
      {user && (
        <div 
          ref={profileMenuRef}
          className={`fixed bg-bg-primary border border-border-custom rounded-lg shadow-lg py-2 z-[70] min-w-[200px] transition-opacity duration-200 ease-in-out ${
            isProfileMenuOpen 
              ? 'opacity-100' 
              : 'opacity-0 pointer-events-none'
          }`}
          style={{
            top: `${profileMenuPosition.top}px`,
            left: `${profileMenuPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* User info */}
          <div className="px-4 py-2 border-b border-border-custom">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-icon" />
              <span className="text-base text-text">{user.user_name_public || user.email}</span>
            </div>
          </div>
          
                     <button
             onClick={(e) => {
               e.stopPropagation()
               setIsProfileMenuOpen(false)
               onAdminClick?.()
             }}
             className={`flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors ${
               (user?.is_admin || user?.is_location_admin) ? '' : 'hidden'
             }`}
           >
            <Shield className="w-5 h-5 text-icon hover:text-icon-hover" />
            <span>Admin</span>
          </button>
          
                     <button
             onClick={(e) => {
               e.stopPropagation()
               setIsProfileMenuOpen(false)
               onSettingsClick?.()
             }}
             className="flex items-center space-x-3 w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
           >
            <Settings className="w-5 h-5 text-icon hover:text-icon-hover" />
            <span>Settings</span>
          </button>
          
          <div className="flex items-center justify-between px-4 py-2 hover:bg-bg-secondary transition-colors">
            <div className="flex items-center space-x-3">
              {isDarkMode ? <Moon className="w-5 h-5 text-icon hover:text-icon-hover" /> : <Sun className="w-5 h-5 text-icon hover:text-icon-hover" />}
              <span className="text-base font-semibold text-text">
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
                         <button
               onClick={(e) => {
                 e.stopPropagation()
                 toggleDarkMode()
               }}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring---color-brand focus:ring-offset-2 ${
                 isDarkMode ? 'bg-brand' : 'bg-gray-200'
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
             onClick={(e) => {
               e.stopPropagation()
               handleSignOut()
             }}
             className="block w-full text-left px-4 py-2 text-base font-semibold text-text hover:bg-bg-secondary transition-colors"
           >
            Sign Out
          </button>
        </div>
      )}

      {/* Backdrop for profile menu */}
      {user && (
        <div 
          className={`fixed inset-0 bg-black z-60 transition-opacity duration-200 ease-in-out ${
            isProfileMenuOpen
              ? 'bg-opacity-25 pointer-events-auto' 
              : 'bg-opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            setIsProfileMenuOpen(false)
          }}
        />
      )}

      {/* Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}