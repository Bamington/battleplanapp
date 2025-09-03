import React, { useState, useEffect, useCallback } from 'react'
import { HelpCircle, Settings } from 'lucide-react'
import { Header } from './components/Header'
import { TabBar } from './components/TabBar'
import { CollectionSubMenu } from './components/CollectionSubMenu'
import { BattleplanPage } from './components/BattleplanPage'
import { ModelCard } from './components/ModelCard'
import { BoxCard } from './components/BoxCard'
import { Pagination } from './components/Pagination'
import { AuthModal } from './components/AuthModal'
import { AddModelModal } from './components/AddModelModal'
import { AddBoxModal } from './components/AddBoxModal'
import { AdminPage } from './components/AdminPage'
import { AboutPage } from './components/AboutPage'
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage'
import { TermsOfServicePage } from './components/TermsOfServicePage'
import { AllBookingsPage } from './components/AllBookingsPage'
import { BlockedDatesPage } from './components/BlockedDatesPage'
import { BattlesPage } from './components/BattlesPage'
import { WishlistPage } from './components/WishlistPage'
import { ViewModelModal } from './components/ViewModelModal'
import { ViewBoxModal } from './components/ViewBoxModal'
import { PasswordResetModal } from './components/PasswordResetModal'
import { NewBookingModal } from './components/NewBookingModal'
import { NewBattleModal } from './components/NewBattleModal'
import { RecentViewSettingsModal, RecentViewSettings } from './components/RecentViewSettingsModal'
import { AuthCallback } from './components/AuthCallback'

import { useAuth } from './hooks/useAuth'
import { useModels } from './hooks/useModels'
import { useBoxes } from './hooks/useBoxes'
import { useGameIcons } from './hooks/useGameIcons'
import { supabase } from './lib/supabase'
import { getBuildInfo } from './utils/buildTimestamp'
import { ModelFilters } from './components/ModelFilters'
import { BoxFilters } from './components/BoxFilters'
import { PublicCollectionView } from './components/PublicCollectionView'
import { PublicModelView } from './components/PublicModelView'
import { OnboardingModal } from './components/OnboardingModal'
import { SettingsPage } from './components/SettingsPage'
import { Footer } from './components/Footer'

function App() {
  
  // Check if we're on the auth callback route
  const isAuthCallback = window.location.pathname.endsWith('/auth/callback')

  // Check if we're on a shared collection route
  // Handle both with and without base path for flexibility
  const sharedCollectionMatch = window.location.pathname.match(/\/shared\/collection\/(.+)$/)
  const sharedCollectionId = sharedCollectionMatch ? sharedCollectionMatch[1] : null

  // Check if we're on a shared model route
  // Handle both with and without base path for flexibility
  const sharedModelMatch = window.location.pathname.match(/\/shared\/model\/(.+)$/)
  const sharedModelId = sharedModelMatch ? sharedModelMatch[1] : null

  // Check if we're on the privacy policy route
  const isPrivacyPolicyRoute = window.location.pathname.endsWith('/privacy-policy')

  // Check if we're on the terms of service route
  const isTermsOfServiceRoute = window.location.pathname.endsWith('/terms-of-service')

  // Show auth callback component if on callback route
  if (isAuthCallback) {
    return <AuthCallback />
  }

  // Show shared collection view if on shared collection route
  if (sharedCollectionId) {
    return <PublicCollectionView collectionId={sharedCollectionId as string} />
  }

  // Show shared model view if on shared model route
  if (sharedModelId) {
    // Check if we came from a collection page by looking at URL parameters or referrer
    const urlParams = new URLSearchParams(window.location.search)
    const fromCollection = urlParams.get('from')
    const collectionName = urlParams.get('collectionName')
    
    let breadcrumbs = undefined
    if (fromCollection && collectionName) {
      breadcrumbs = {
        collectionId: fromCollection,
        collectionName: decodeURIComponent(collectionName)
      }
    }
    
    return <PublicModelView 
      modelId={sharedModelId as string} 
      breadcrumbs={breadcrumbs}
    />
  }

  const [activeTab, setActiveTab] = useState('collection')
  const [collectionView, setCollectionView] = useState<'recent' | 'models' | 'collections' | 'wishlist'>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [boxCurrentPage, setBoxCurrentPage] = useState(1)
  
  // Filter states
  const [modelFilters, setModelFilters] = useState({
    selectedBoxes: [] as string[],
    selectedGames: [] as string[],
    selectedStatuses: [] as string[],
    searchQuery: ''
  })
  const [boxFilters, setBoxFilters] = useState({
    selectedGames: [] as string[],
    searchQuery: ''
  })
  const [games, setGames] = useState<any[]>([])
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'login'
  })
  const [addModelModal, setAddModelModal] = useState(false)
  const [addBoxModal, setAddBoxModal] = useState(false)
  const [showNewBookingModal, setShowNewBookingModal] = useState(false)
  const [showNewBattleModal, setShowNewBattleModal] = useState(false)
  const [battlesRefetch, setBattlesRefetch] = useState<(() => void) | null>(null)
  
  // Stable callback to avoid infinite re-renders
  const handleBattlesRefetchReady = useCallback((refetchFn: () => void) => {
    setBattlesRefetch(() => refetchFn)
  }, [])
  const [showAddWishlistModal, setShowAddWishlistModal] = useState(false)
  const [showRecentViewSettingsModal, setShowRecentViewSettingsModal] = useState(false)
  const [recentViewSettings, setRecentViewSettings] = useState<RecentViewSettings>({
    showPainted: true,
    showPartiallyPainted: true,
    showPrimed: true,
    showAssembled: true,
    showUnassembled: false,
    sortOrder: 'mostRecentlyPainted'
  })
  const [showAdminPage, setShowAdminPage] = useState(false)
  const [showSettingsPage, setShowSettingsPage] = useState(false)
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [preselectedBoxId, setPreselectedBoxId] = useState<string | null>(null)
  const [viewModelModal, setViewModelModal] = useState<{
    isOpen: boolean
    model: any | null
  }>({
    isOpen: false,
    model: null
  })
  const [refreshBookingsTrigger, setRefreshBookingsTrigger] = useState(0)
  const [viewBoxModal, setViewBoxModal] = useState<{
    isOpen: boolean
    box: any | null
  }>({
    isOpen: false,
    box: null
  })
  
  const { user, loading: authLoading, needsPasswordReset, isBetaTester } = useAuth()
  
  // Initialize game icons cache on app startup
  useGameIcons()
  const { models, loading: modelsLoading, refetch: refetchModels } = useModels()
  const { boxes, loading: boxesLoading, refetch: refetchBoxes } = useBoxes()



  // Fetch games for filters
  useEffect(() => {
    if (user) {
      fetchGames()
    }
  }, [user])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, icon')
        .order('name')

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error('Error fetching games:', err)
    }
  }

  const itemsPerPage = 6

  // Filter functions
  const handleModelBoxesFilter = (boxIds: string[]) => {
    setModelFilters(prev => ({ ...prev, selectedBoxes: boxIds }))
    setCurrentPage(1)
  }

  const handleModelGamesFilter = (gameIds: string[]) => {
    setModelFilters(prev => ({ ...prev, selectedGames: gameIds }))
    setCurrentPage(1)
  }

  const handleModelStatusesFilter = (statuses: string[]) => {
    setModelFilters(prev => ({ ...prev, selectedStatuses: statuses }))
    setCurrentPage(1)
  }

  const handleModelClearFilters = () => {
    setModelFilters({ selectedBoxes: [], selectedGames: [], selectedStatuses: [], searchQuery: '' })
    setCurrentPage(1)
  }

  const handleBoxGamesFilter = (gameIds: string[]) => {
    setBoxFilters(prev => ({ ...prev, selectedGames: gameIds }))
    setBoxCurrentPage(1)
  }

  const handleBoxClearFilters = () => {
    setBoxFilters({ selectedGames: [], searchQuery: '' })
    setBoxCurrentPage(1)
  }

  // Search handlers
  const handleModelSearchChange = (query: string) => {
    setModelFilters(prev => ({ ...prev, searchQuery: query }))
    setCurrentPage(1)
  }

  const handleBoxSearchChange = (query: string) => {
    setBoxFilters(prev => ({ ...prev, searchQuery: query }))
    setBoxCurrentPage(1)
  }

  // Filtered data
  const filteredModels = models.filter(model => {
    // Search filter
    if (modelFilters.searchQuery && !model.name.toLowerCase().includes(modelFilters.searchQuery.toLowerCase())) {
      return false
    }
    
    // Box filter
    if (modelFilters.selectedBoxes.length > 0 && !modelFilters.selectedBoxes.includes(model.box?.id || '')) return false
    
    // Game filter
    if (modelFilters.selectedGames.length > 0 && 
        !modelFilters.selectedGames.includes(model.box?.game?.id || '') && 
        !modelFilters.selectedGames.includes(model.game?.id || '')) return false
    
    // Status filter
    if (modelFilters.selectedStatuses.length > 0 && !modelFilters.selectedStatuses.includes(model.status)) return false
    
    return true
  })

  // For Recent view, filter models based on settings and apply sorting
  const recentModels = models
    .filter(model => {
      // Filter by painted status based on settings
      switch (model.status) {
        case 'Painted':
          return recentViewSettings.showPainted
        case 'Partially Painted':
          return recentViewSettings.showPartiallyPainted
        case 'Primed':
          return recentViewSettings.showPrimed
        case 'Assembled':
          return recentViewSettings.showAssembled
        case 'None':
        case 'Unassembled':
        default:
          return recentViewSettings.showUnassembled
      }
    })
    .sort((a, b) => {
      if (recentViewSettings.sortOrder === 'mostRecentlyAdded') {
        // Sort by creation date (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        // Sort by painted date (most recent first), fallback to creation date
        if (a.painted_date && b.painted_date) {
          return new Date(b.painted_date).getTime() - new Date(a.painted_date).getTime()
        }
        // If only one has a painted date, prioritize the one with painted date
        if (a.painted_date && !b.painted_date) {
          return -1
        }
        if (!a.painted_date && b.painted_date) {
          return 1
        }
        // If neither has a painted date, sort by creation date (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  // For Recent Collections view, just show all collections with basic sorting
  const recentCollections = boxes
    .sort((a, b) => {
      // Sort by creation date (most recent first) 
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const filteredBoxes = boxes.filter(box => {
    // Search filter
    if (boxFilters.searchQuery && !box.name.toLowerCase().includes(boxFilters.searchQuery.toLowerCase())) {
      return false
    }
    
    // Game filter
    if (boxFilters.selectedGames.length > 0 && !boxFilters.selectedGames.includes(box.game?.id || '')) return false
    
    return true
  })

  const totalPages = Math.ceil(filteredModels.length / itemsPerPage)
  const recentTotalPages = Math.ceil(recentModels.length / itemsPerPage)
  const recentCollectionsTotalPages = Math.ceil(recentCollections.length / itemsPerPage)
  const boxTotalPages = Math.ceil(filteredBoxes.length / itemsPerPage)

  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const paginatedRecentModels = recentModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const paginatedRecentCollections = recentCollections.slice(
    (boxCurrentPage - 1) * itemsPerPage,
    boxCurrentPage * itemsPerPage
  )

  const paginatedBoxes = filteredBoxes.slice(
    (boxCurrentPage - 1) * itemsPerPage,
    boxCurrentPage * itemsPerPage
  )

  const handleModelAdded = () => {
    refetchModels()
    refetchBoxes()
    
    // Check if we came from the Add Models to Box Modal flow
    try {
      const storedBoxContext = localStorage.getItem('mini-myths-temp-box-context')
      if (storedBoxContext) {
        const boxContext = JSON.parse(storedBoxContext)
        
        // Find the box in our current boxes data
        const box = boxes.find(b => b.id === boxContext.id)
        if (box) {
          // Open the View Box Modal for the box we came from
          setViewBoxModal({
            isOpen: true,
            box
          })
        }
        
        // Clear the stored context
        localStorage.removeItem('mini-myths-temp-box-context')
      }
    } catch (error) {
      console.error('Error handling return to box modal:', error)
      // Clear the stored context on error
      localStorage.removeItem('mini-myths-temp-box-context')
    }
    
    setPreselectedBoxId(null)
  }

  const handleViewModel = (model: any) => {
    setViewModelModal({
      isOpen: true,
      model
    })
  }

  const handleViewBox = (box: any) => {
    setViewBoxModal({
      isOpen: true,
      box
    })
  }

  const handleModelDeleted = () => {
    refetchModels()
    refetchBoxes()
  }

  const handleModelUpdated = async () => {
    await refetchModels()
    await refetchBoxes()
  }

  const handleBoxDeleted = () => {
    refetchBoxes()
    refetchModels()
  }

  const handleBoxUpdated = () => {
    refetchBoxes()
    refetchModels()
  }

  const handleAddModelsToBox = (boxId: string) => {
    setPreselectedBoxId(boxId)
    setAddModelModal(true)
  }

  const handleAddNewModelToBox = (boxId: string | null) => {
    setPreselectedBoxId(boxId)
    setAddModelModal(true)
  }

  const handleAdminClick = () => {
    setShowAdminPage(true)
  }

  const handleSettingsClick = () => {
    setShowSettingsPage(true)
  }

  const handleLogoClick = () => {
    // Close all overlays and modals
    setShowAdminPage(false)
    setShowSettingsPage(false)
    setAddModelModal(false)
    setAddBoxModal(false)
    setShowNewBookingModal(false)
    setShowPasswordResetModal(false)
    setShowOnboardingModal(false)
    setViewModelModal({ isOpen: false, model: null })
    setViewBoxModal({ isOpen: false, box: null })
  }

  // Show Privacy Policy page
  if (isPrivacyPolicyRoute) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header onLogoClick={handleLogoClick} />
        <PrivacyPolicyPage onBack={() => window.history.back()} />
        <Footer />
      </div>
    )
  }

  // Show Terms of Service page
  if (isTermsOfServiceRoute) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header onLogoClick={handleLogoClick} />
        <TermsOfServicePage onBack={() => window.history.back()} />
        <Footer />
      </div>
    )
  }

  // Show password reset modal if user needs to set a new password
  useEffect(() => {
    if (needsPasswordReset) {
      setShowPasswordResetModal(true)
    }
  }, [needsPasswordReset])

  // Add onboarding modal state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  
  // Check if user needs onboarding
  useEffect(() => {
    if (user && !authLoading && user.onboarded === false) {
      setShowOnboardingModal(true)
    }
  }, [user, authLoading])

  // Load saved recent view settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('recentViewSettings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        // Merge with defaults to handle any missing properties
        setRecentViewSettings({
          showPainted: parsedSettings.showPainted ?? true,
          showPartiallyPainted: parsedSettings.showPartiallyPainted ?? true,
          showPrimed: parsedSettings.showPrimed ?? true,
          showAssembled: parsedSettings.showAssembled ?? true,
          showUnassembled: parsedSettings.showUnassembled ?? false,
          sortOrder: parsedSettings.sortOrder ?? 'mostRecentlyPainted'
        })
      } catch (error) {
        console.error('Error parsing saved recent view settings:', error)
      }
    }
  }, [])

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false)
    // Refresh user data to get updated onboarded status
    window.location.reload()
  }

  const handleRecentViewSettingsUpdate = (newSettings: RecentViewSettings) => {
    setRecentViewSettings(newSettings)
    // Could save to localStorage or user preferences here
    localStorage.setItem('recentViewSettings', JSON.stringify(newSettings))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-brand)] mx-auto mb-4"></div>
          <p className="text-base text-secondary-text">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header onSettingsClick={handleSettingsClick} onLogoClick={handleLogoClick} />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-bg-card rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-title mb-4">Welcome to the Battleplan App Beta</h1>
            <p className="text-xs text-secondary-text mb-2">
              Last updated: {getBuildInfo().date} at {getBuildInfo().time}
            </p>
            <p className="text-base text-secondary-text mb-8">
              Track your miniatures and book a table at your favourite gaming store.<br /><br />
              Make sure to report any bugs and issues on the Discord!
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'login' })}
                className="btn-secondary"
              >
                Log In
              </button>
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                className="btn-primary"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
                 <Footer />
         <AuthModal
          isOpen={authModal.isOpen}
          onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
          mode={authModal.mode}
        />
      </div>
    )
  }

  // Show Admin page
  if (showAdminPage) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <AdminPage onBack={() => setShowAdminPage(false)} onLogoClick={handleLogoClick} />
        <Footer />
      </div>
    )
  }

  // Show Settings page
  if (showSettingsPage) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <SettingsPage onBack={() => setShowSettingsPage(false)} />
        <Footer />
      </div>
    )
  }

  // Render About page
  if (activeTab === 'about') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <AboutPage onBack={() => setActiveTab('collection')} />
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />
      </div>
    )
  }



  // Render All Bookings page (Admin only)
  if (activeTab === 'all-bookings') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <AllBookingsPage onBack={() => setActiveTab('collection')} />
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />
      </div>
    )
  }

  // Render Blocked Dates page (Admin only)
  if (activeTab === 'blocked-dates') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <BlockedDatesPage onBack={() => setActiveTab('collection')} />
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />
      </div>
    )
  }

  // Render Help page (placeholder)
  if (activeTab === 'help') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <div className="text-center py-16">
            <HelpCircle className="w-16 h-16 text-secondary-text mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-title mb-2">Help & Support</h2>
            <p className="text-secondary-text">Coming soon...</p>
          </div>
        </main>
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />
      </div>
    )
  }

  // Render Battles page
  if (activeTab === 'battles') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <BattlesPage 
          onBack={() => setActiveTab('collection')} 
          onRefetchReady={handleBattlesRefetchReady}
        />
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />

        {/* New Battle Modal for battles view */}
        <NewBattleModal
          isOpen={showNewBattleModal}
          onClose={() => setShowNewBattleModal(false)}
          onBattleCreated={() => {
            setShowNewBattleModal(false)
            // Refetch battles to show the new battle immediately
            if (battlesRefetch) {
              battlesRefetch()
            }
          }}
        />

      </div>
    )
  }

  // Render Battleplan page
  if (activeTab === 'battleplan') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <BattleplanPage 
          refreshTrigger={refreshBookingsTrigger}
          onNewBooking={() => setShowNewBookingModal(true)}
        />
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />
        


        {/* New Booking Modal for battleplan tab */}
        <NewBookingModal
          isOpen={showNewBookingModal}
          onClose={() => setShowNewBookingModal(false)}
          onBookingCreated={() => {
            // Trigger refresh of bookings data
            setRefreshBookingsTrigger(prev => prev + 1)
            setShowNewBookingModal(false)
          }}
          lastSelectedLocation=""
          onLocationSelected={(locationId) => {
            // Handle location selection if needed
            console.log('Location selected:', locationId)
          }}
        />

        {/* New Battle Modal for battleplan view */}
        <NewBattleModal
          isOpen={showNewBattleModal}
          onClose={() => setShowNewBattleModal(false)}
          onBattleCreated={() => {
            setShowNewBattleModal(false)
            // Refetch battles to show the new battle immediately
            if (battlesRefetch) {
              battlesRefetch()
            }
          }}
        />

      </div>
    )
  }

  // Render Wishlist page
  if (activeTab === 'wishlist') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }} 
          onAdminClick={handleAdminClick}
          onSettingsClick={handleSettingsClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogoClick={handleLogoClick}
        />
        <WishlistPage 
          showAddModal={showAddWishlistModal}
          onCloseAddModal={() => setShowAddWishlistModal(false)}
          onAddItemSuccess={() => setShowAddWishlistModal(false)}
        />
        <Footer />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
          onAddCollection={() => {
            setActiveTab('collection')
            setAddBoxModal(true)
          }}
          onAddBooking={() => {
            setActiveTab('battleplan')
            setShowNewBookingModal(true)
          }}
          onAddWishlist={() => {
            setActiveTab('wishlist')
            setShowAddWishlistModal(true)
          }}
          onAddBattle={() => {
            setActiveTab('battles')
            setShowNewBattleModal(true)
          }}
          isBetaTester={isBetaTester}
        />

        {/* New Battle Modal for wishlist view */}
        <NewBattleModal
          isOpen={showNewBattleModal}
          onClose={() => setShowNewBattleModal(false)}
          onBattleCreated={() => {
            setShowNewBattleModal(false)
            // Refetch battles to show the new battle immediately
            if (battlesRefetch) {
              battlesRefetch()
            }
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header 
        onAddModel={() => setAddModelModal(true)} 
        onAdminClick={handleAdminClick}
        onSettingsClick={handleSettingsClick}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogoClick={handleLogoClick}
      />
      
      {/* Collection Sub-menu - only show on collection tab */}
      {activeTab === 'collection' && (
        <CollectionSubMenu
          activeView={collectionView}
          onViewChange={setCollectionView}
          isBetaTester={isBetaTester}
        />
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

        {/* Recent View */}
        {collectionView === 'recent' && (
          <>
            {/* Recent Models Section */}
            <section className="mb-16">
              {models.length > 0 && (
                <div className="flex flex-col items-center mb-8">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <button
                      onClick={() => setShowRecentViewSettingsModal(true)}
                      className="p-1.5 text-secondary-text hover:text-text hover:bg-bg-secondary rounded-lg transition-colors"
                      title="Recent view settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <h2 className="text-lg font-bold text-secondary-text">RECENT MODELS</h2>
                  </div>
                </div>
              )}
              
              {modelsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden animate-pulse">
                      <div className="h-48 bg-secondary-text opacity-20"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-secondary-text opacity-20 rounded"></div>
                        <div className="h-3 bg-secondary-text opacity-20 rounded w-2/3"></div>
                        <div className="h-8 bg-secondary-text opacity-20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentModels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-base text-secondary-text mb-4">No models match your current filter settings.</p>
                  <p className="text-sm text-secondary-text">Try adjusting the settings using the ⚙️ icon above.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedRecentModels.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        name={model.name}
                                                 boxName={model.box?.name || 'Unknown Collection'}
                        gameName={model.box?.game?.name || model.game?.name || 'Unknown Game'}
                        gameIcon={model.box?.game?.icon || model.game?.icon || null}
                        status={model.status}
                        count={model.count}
                        imageUrl={model.image_url}
                        paintedDate={model.painted_date}
                        onViewModel={() => handleViewModel(model)}
                        onViewBox={handleViewBox}
                      />
                    ))}
                  </div>
                  
                  {recentTotalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={recentTotalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </section>

                         {/* Recent Collections Section */}
             <section>
               {boxes.length > 0 && (
                 <div className="flex flex-col items-center mb-8">
                   <div className="flex items-center justify-center space-x-3 mb-4">
                     <button
                       onClick={() => setShowRecentViewSettingsModal(true)}
                       className="p-1.5 text-secondary-text hover:text-text hover:bg-bg-secondary rounded-lg transition-colors"
                       title="Recent view settings"
                     >
                       <Settings className="w-4 h-4" />
                     </button>
                     <h2 className="text-lg font-bold text-secondary-text">RECENT COLLECTIONS</h2>
                   </div>
                 </div>
               )}
              
              {boxesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden animate-pulse">
                      <div className="h-48 bg-secondary-text opacity-20"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-secondary-text opacity-20 rounded"></div>
                        <div className="h-3 bg-secondary-text opacity-20 rounded w-2/3"></div>
                        <div className="h-8 bg-secondary-text opacity-20 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentCollections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-base text-secondary-text mb-4">No collections in your collection yet.</p>
                </div>
                ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedRecentCollections.map((box) => (
                      <BoxCard
                        key={box.id}
                        name={box.name}
                        gameName={box.game?.name || 'Unknown Game'}
                        modelCount={box.models_count || 0}
                        imageUrl={box.image_url || null}
                        gameImage={box.game?.image || null}
                        gameIcon={box.game?.icon || null}
                        onViewBox={() => handleViewBox(box)}
                      />
                    ))}
                  </div>
                  
                  {recentCollectionsTotalPages > 1 && (
                    <Pagination
                      currentPage={boxCurrentPage}
                      totalPages={recentCollectionsTotalPages}
                      onPageChange={setBoxCurrentPage}
                    />
                  )}
                </>
              )}
            </section>
          </>
        )}

                 {/* Collections Only View */}
         {collectionView === 'collections' && (
          <section>

            {/* Box Filters */}
            {boxes.length > 0 && (
                           <BoxFilters
               games={games}
               boxes={boxes}
               selectedGames={boxFilters.selectedGames}
               searchQuery={boxFilters.searchQuery}
               onGamesChange={handleBoxGamesFilter}
               onSearchChange={handleBoxSearchChange}
               onClearFilters={handleBoxClearFilters}
             />
            )}
            
            {boxesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-bg-card rounded-lg border border-border-custom p-4 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-secondary-text opacity-20 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-secondary-text opacity-20 rounded w-3/4"></div>
                        <div className="h-3 bg-secondary-text opacity-20 rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-8 bg-secondary-text opacity-20 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : boxes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-base text-secondary-text mb-4">No collections in your collection yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedBoxes.map((box) => (
                    <div
                      key={box.id}
                      className="bg-bg-card rounded-lg border border-border-custom p-4 hover:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => handleViewBox(box)}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={(() => {
                            if (box.image_url && 
                                typeof box.image_url === 'string' &&
                                box.image_url.trim() !== '' && 
                                box.image_url !== 'undefined' && 
                                box.image_url !== 'null' &&
                                (box.image_url.startsWith('http') || box.image_url.startsWith('/'))) {
                              return box.image_url
                            }
                            
                            const gameImage = box.game?.image
                            if (gameImage && 
                                typeof gameImage === 'string' &&
                                gameImage.trim() !== '' && 
                                gameImage !== 'undefined' && 
                                gameImage !== 'null' &&
                                gameImage.startsWith('http')) {
                              return gameImage
                            }
                            
                            return 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                          })()}
                          alt={box.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            const fallbackUrl = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                            if (target.src !== fallbackUrl) {
                              target.src = fallbackUrl
                            }
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-title truncate">{box.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {box.game?.icon ? (
                              <img
                                src={box.game.icon}
                                alt={`${box.game.name} icon`}
                                className="w-4 h-4 object-contain rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const fallback = target.nextElementSibling as HTMLElement
                                  if (fallback && fallback.classList.contains('icon-fallback')) {
                                    fallback.style.display = 'flex'
                                  }
                                }}
                              />
                            ) : null}
                            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: box.game?.icon ? 'none' : 'flex' }}>
                              <span className="text-white text-xs font-bold">{(box.game?.name || 'Unknown Game').charAt(0)}</span>
                            </div>
                            <span className="text-sm text-secondary-text">{box.game?.name || 'Unknown Game'}</span>
                          </div>
                          <p className="text-xs text-secondary-text mt-1">
                            {box.models_count || 0} Model{(box.models_count || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {boxTotalPages > 1 && (
                  <Pagination
                    currentPage={boxCurrentPage}
                    totalPages={boxTotalPages}
                    onPageChange={setBoxCurrentPage}
                  />
                )}
              </>
            )}
          </section>
        )}

        {/* Models Only View */}
        {collectionView === 'models' && (
          <section>

          {/* Model Filters */}
          {models.length > 0 && (
                         <ModelFilters
               games={games}
               boxes={boxes}
               models={models}
               selectedBoxes={modelFilters.selectedBoxes}
               selectedGames={modelFilters.selectedGames}
               selectedStatuses={modelFilters.selectedStatuses}
               searchQuery={modelFilters.searchQuery}
               onBoxesChange={handleModelBoxesFilter}
               onGamesChange={handleModelGamesFilter}
               onStatusesChange={handleModelStatusesFilter}
               onSearchChange={handleModelSearchChange}
               onClearFilters={handleModelClearFilters}
             />
          )}
          
          {modelsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-bg-card rounded-lg border border-border-custom p-4 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-secondary-text opacity-20 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-secondary-text opacity-20 rounded w-3/4"></div>
                      <div className="h-3 bg-secondary-text opacity-20 rounded w-1/2"></div>
                    </div>
                    <div className="w-20 h-8 bg-secondary-text opacity-20 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base text-secondary-text mb-4">No models in your collection yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedModels.map((model) => (
                  <div
                    key={model.id}
                    className="bg-bg-card rounded-lg border border-border-custom p-4 hover:bg-bg-secondary transition-colors cursor-pointer"
                    onClick={() => handleViewModel(model)}
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={(() => {
                          if (model.image_url && 
                              typeof model.image_url === 'string' &&
                              model.image_url.trim() !== '' && 
                              model.image_url !== 'undefined' && 
                              model.image_url !== 'null' &&
                              (model.image_url.startsWith('http') || model.image_url.startsWith('/'))) {
                            return model.image_url
                          }
                          
                          const gameIcon = model.box?.game?.icon || model.game?.icon
                          if (gameIcon && 
                              typeof gameIcon === 'string' &&
                              gameIcon.trim() !== '' && 
                              gameIcon !== 'undefined' && 
                              gameIcon !== 'null' &&
                              gameIcon.startsWith('http')) {
                            return gameIcon
                          }
                          
                          return 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                        })()}
                        alt={model.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          const fallbackUrl = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl
                          }
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-title truncate">{model.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {(model.box?.game?.icon || model.game?.icon) ? (
                            <img
                              src={model.box?.game?.icon || model.game?.icon || undefined}
                              alt={`${model.box?.game?.name || model.game?.name || 'Unknown Game'} icon`}
                              className="w-4 h-4 object-contain rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const fallback = target.nextElementSibling as HTMLElement
                                if (fallback && fallback.classList.contains('icon-fallback')) {
                                  fallback.style.display = 'flex'
                                }
                              }}
                            />
                          ) : null}
                          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: (model.box?.game?.icon || model.game?.icon) ? 'none' : 'flex' }}>
                            <span className="text-white text-xs font-bold">{(model.box?.game?.name || model.game?.name || 'Unknown Game').charAt(0)}</span>
                          </div>
                          <span className="text-sm text-secondary-text">{model.box?.game?.name || model.game?.name || 'Unknown Game'}</span>
                        </div>
                        {model.status !== 'None' && (
                          <div className="mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(() => {
                              switch (model.status) {
                                case 'Painted': return 'bg-green-100 text-green-800'
                                case 'Partially Painted': return 'bg-yellow-100 text-yellow-800'
                                case 'Primed': return 'bg-blue-100 text-blue-800'
                                case 'Assembled': return 'bg-yellow-100 text-yellow-800'
                                default: return 'bg-gray-100 text-gray-800'
                              }
                            })()}`}>
                              {model.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
          </section>
        )}

        {/* Wishlist View */}
        {collectionView === 'wishlist' && isBetaTester && (
          <WishlistPage 
            showAddModal={showAddWishlistModal}
            onCloseAddModal={() => setShowAddWishlistModal(false)}
            onAddItemSuccess={() => setShowAddWishlistModal(false)}
          />
        )}

      </main>

      <Footer />

      <TabBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddModel={() => {
          setActiveTab('collection')
          setAddModelModal(true)
        }}
        onAddCollection={() => {
          setActiveTab('collection')
          setAddBoxModal(true)
        }}
        onAddBooking={() => {
          setActiveTab('battleplan')
          setShowNewBookingModal(true)
        }}
        onAddWishlist={() => {
          setActiveTab('wishlist')
          setShowAddWishlistModal(true)
        }}
        onAddBattle={() => {
          setActiveTab('battles')
          setShowNewBattleModal(true)
        }}
        isBetaTester={isBetaTester}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ isOpen: false, mode: 'login' })}
        mode={authModal.mode}
      />

      <AddModelModal
        isOpen={addModelModal}
        onClose={() => setAddModelModal(false)}
        onSuccess={handleModelAdded}
        preselectedBoxId={preselectedBoxId}
      />

      <AddBoxModal
        isOpen={addBoxModal}
        onClose={() => setAddBoxModal(false)}
        onSuccess={handleModelAdded}
        onAddModelsToBox={handleAddModelsToBox}
      />

      <ViewModelModal
        isOpen={viewModelModal.isOpen}
        onClose={() => setViewModelModal({ isOpen: false, model: null })}
        onModelDeleted={handleModelDeleted}
        onModelUpdated={handleModelUpdated}
        onViewBox={handleViewBox}
        model={viewModelModal.model}
      />

      <ViewBoxModal
        isOpen={viewBoxModal.isOpen}
        onClose={() => setViewBoxModal({ isOpen: false, box: null })}
        onBoxDeleted={handleBoxDeleted}
        onModelsUpdated={handleBoxUpdated}
        onViewModel={handleViewModel}
        onAddNewModel={handleAddNewModelToBox}
        box={viewBoxModal.box}
      />

      {/* Add Password Reset Modal */}
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
      />

      {/* Add New Booking Modal */}
      <NewBookingModal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        onBookingCreated={() => {
          // Trigger refresh of bookings data
          setRefreshBookingsTrigger(prev => prev + 1)
          setShowNewBookingModal(false)
        }}
        lastSelectedLocation=""
        onLocationSelected={(locationId) => {
          // Handle location selection if needed
          console.log('Location selected:', locationId)
        }}
      />

      {/* Add New Battle Modal */}
      <NewBattleModal
        isOpen={showNewBattleModal}
        onClose={() => setShowNewBattleModal(false)}
        onBattleCreated={() => {
          setShowNewBattleModal(false)
          // Refetch battles to show the new battle immediately
          if (battlesRefetch) {
            battlesRefetch()
          }
        }}
      />

      {/* Recent View Settings Modal */}
      <RecentViewSettingsModal
        isOpen={showRecentViewSettingsModal}
        onClose={() => setShowRecentViewSettingsModal(false)}
        onSave={handleRecentViewSettingsUpdate}
        currentSettings={recentViewSettings}
      />

      {/* Add onboarding modal */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleOnboardingComplete}
      />

    </div>
  )
}

export default App