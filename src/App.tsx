import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
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
import { AllBookingsPage } from './components/AllBookingsPage'
import { ViewModelModal } from './components/ViewModelModal'
import { ViewBoxModal } from './components/ViewBoxModal'
import { PasswordResetModal } from './components/PasswordResetModal'
import { AuthCallback } from './components/AuthCallback'
import { useAuth } from './hooks/useAuth'
import { useModels } from './hooks/useModels'
import { useBoxes } from './hooks/useBoxes'
import { supabase } from './lib/supabase'
import { getBuildInfo } from './utils/buildTimestamp'
import { ModelFilters } from './components/ModelFilters'
import { BoxFilters } from './components/BoxFilters'
import { PublicCollectionView } from './components/PublicCollectionView'

function App() {
  // Check if we're on the auth callback route
  const isAuthCallback = window.location.pathname === '/auth/callback'

  // Check if we're on a shared collection route
  const sharedCollectionMatch = window.location.pathname.match(/^\/shared\/collection\/(.+)$/)
  const sharedCollectionId = sharedCollectionMatch ? sharedCollectionMatch[1] : null

  // Show auth callback component if on callback route
  if (isAuthCallback) {
    return <AuthCallback />
  }

  // Show shared collection view if on shared collection route
  if (sharedCollectionId) {
    return <PublicCollectionView collectionId={sharedCollectionId as string} />
  }

  const [activeTab, setActiveTab] = useState('collection')
  const [collectionView, setCollectionView] = useState<'recent' | 'models' | 'collections'>('recent')
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
  const [showAdminPage, setShowAdminPage] = useState(false)
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false)
  const [preselectedBoxId, setPreselectedBoxId] = useState<string | null>(null)
  const [viewModelModal, setViewModelModal] = useState<{
    isOpen: boolean
    model: any | null
  }>({
    isOpen: false,
    model: null
  })
  const [viewBoxModal, setViewBoxModal] = useState<{
    isOpen: boolean
    box: any | null
  }>({
    isOpen: false,
    box: null
  })
  
  const { user, loading: authLoading, needsPasswordReset } = useAuth()
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

  // For Recent view, only show painted models
  const recentModels = models.filter(model => model.status === 'Painted')

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
  const boxTotalPages = Math.ceil(filteredBoxes.length / itemsPerPage)

  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const paginatedRecentModels = recentModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const paginatedBoxes = filteredBoxes.slice(
    (boxCurrentPage - 1) * itemsPerPage,
    boxCurrentPage * itemsPerPage
  )

  const handleModelAdded = () => {
    refetchModels()
    refetchBoxes()
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

  // Show password reset modal if user needs to set a new password
  useEffect(() => {
    if (needsPasswordReset) {
      setShowPasswordResetModal(true)
    }
  }, [needsPasswordReset])

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
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-bg-card rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-title mb-4">Welcome to the Mini Myths App Beta</h1>
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
        <Header 
          onAddModel={() => setAddModelModal(true)} 
          onAdminClick={handleAdminClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <AdminPage onBack={() => setShowAdminPage(false)} />
        <TabBar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setShowAdminPage(false)
            setActiveTab(tab)
          }} 
        />
      </div>
    )
  }

  // Render About page
  if (activeTab === 'about') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => setAddModelModal(true)} 
          onAdminClick={handleAdminClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <AboutPage onBack={() => setActiveTab('collection')} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  // Render All Bookings page (Admin only)
  if (activeTab === 'all-bookings') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => setAddModelModal(true)} 
          onAdminClick={handleAdminClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <AllBookingsPage onBack={() => setActiveTab('collection')} />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  // Render Battleplan page
  if (activeTab === 'battleplan') {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <Header 
          onAddModel={() => setAddModelModal(true)} 
          onAdminClick={handleAdminClick}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <BattleplanPage />
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <Header 
        onAddModel={() => setAddModelModal(true)} 
        onAdminClick={handleAdminClick}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Collection Sub-menu - only show on collection tab */}
      {activeTab === 'collection' && (
        <CollectionSubMenu
          activeView={collectionView}
          onViewChange={setCollectionView}
        />
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

        {/* Recent View */}
        {collectionView === 'recent' && (
          <>
            {/* Recent Models Section */}
            <section className="mb-16">
              {models.filter(model => model.status === 'Painted').length > 0 && (
                <div className="flex flex-col items-center mb-8">
                  <h2 className="text-lg font-bold text-secondary-text text-center mb-4">RECENT MODELS</h2>
                  <button
                    onClick={() => setAddModelModal(true)}
                    className="btn-primary-sm btn-with-icon-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Model</span>
                  </button>
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
                  <p className="text-base text-secondary-text mb-4">No painted models in your collection yet.</p>
                  <button 
                    onClick={() => setAddModelModal(true)}
                    className="btn-primary"
                  >
                    Add Your First Model
                  </button>
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
                   <h2 className="text-lg font-bold text-secondary-text text-center mb-4">RECENT COLLECTIONS</h2>
                  <button
                    onClick={() => setAddBoxModal(true)}
                    className="btn-primary-sm btn-with-icon-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Collection</span>
                  </button>
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
              ) : boxes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-base text-secondary-text mb-4">No collections in your collection yet.</p>
                  <button 
                    onClick={() => setAddBoxModal(true)}
                    className="btn-primary"
                  >
                    Add Your First Box
                  </button>
                </div>
                ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedBoxes.map((box) => (
                      <BoxCard
                        key={box.id}
                        name={box.name}
                        gameName={box.game?.name || 'Unknown Game'}
                        purchaseDate={box.purchase_date}
                        imageUrl={box.image_url}
                        gameImage={box.game?.image}
                        gameIcon={box.game?.icon}
                        onViewBox={() => handleViewBox(box)}
                      />
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
          </>
        )}

                 {/* Collections Only View */}
         {collectionView === 'collections' && (
          <section>
            {boxes.length > 0 && (
              <div className="flex flex-col items-center mb-8">
                <button
                  onClick={() => setAddBoxModal(true)}
                  className="btn-primary-sm btn-with-icon-sm"
                >
                  <Plus className="w-4 h-4" />
                                     <span>Add Collection</span>
                </button>
              </div>
            )}

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
            ) : models.filter(model => model.status === 'Painted').length === 0 ? (
              <div className="text-center py-12">
                <p className="text-base text-secondary-text mb-4">No painted models in your collection yet.</p>
                <button 
                  onClick={() => setAddBoxModal(true)}
                  className="btn-primary"
                >
                  Add Your First Painted Model
                </button>
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
                          {box.purchase_date && (
                            <p className="text-xs text-secondary-text mt-1">
                              Purchased: {new Date(box.purchase_date).toLocaleDateString()}
                            </p>
                          )}
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
          {models.length > 0 && (
            <div className="flex flex-col items-center mb-8">
                          <button
              onClick={() => setAddModelModal(true)}
              className="btn-primary-sm btn-with-icon-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Model</span>
            </button>
            </div>
          )}

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
              <button 
                onClick={() => setAddModelModal(true)}
                className="btn-primary"
              >
                Add Your First Model
              </button>
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
                          
                          const gameImage = model.box?.game?.image || model.game?.image
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
                              src={model.box?.game?.icon || model.game?.icon}
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
      </main>

      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

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
    </div>
  )
}

export default App