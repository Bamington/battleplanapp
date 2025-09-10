import React, { useState, useEffect } from 'react'
import { Calendar, Package, Users, Globe, User, Moon, Sun, ArrowLeft, Info, BookOpen, Brush } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../hooks/useDarkMode'
import battleplanLogo from '/Battleplan-Logo-Purple.svg'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatLocalDate } from '../utils/timezone'
import { Footer } from './Footer'
import { TabSelector } from './TabSelector'
import { PublicHeader } from './PublicHeader'

interface PublicModelViewProps {
  modelId: string
  onBack?: () => void
  breadcrumbs?: {
    collectionName: string
    collectionId: string
  }
}

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string
  notes: string | null
  public: boolean | null
  lore_name?: string | null
  lore_description?: string | null
  painting_notes?: string | null
  painted_date?: string | null
  purchase_date?: string | null
  user_id: string
  images?: {
    id: string
    model_id: string
    image_url: string
    display_order: number
    is_primary: boolean
    created_at: string
    user_id: string
  }[]
  user?: {
    id: string
    username: string | null
  } | null
  game: {
    id: string
    name: string
    icon: string | null
  } | null
  box: {
    id: string
    name: string
    purchase_date: string
    game: {
      id: string
      name: string
      icon: string | null
      image: string | null
    } | null
  } | null
}

export function PublicModelView({ modelId, onBack, breadcrumbs }: PublicModelViewProps) {
  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'lore' | 'painting'>('details')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  const allTabs = [
    { id: 'details', label: 'Details', icon: Info },
    { id: 'lore', label: 'Lore', icon: BookOpen },
    { id: 'painting', label: 'Painting', icon: Brush }
  ]

  // Determine which tabs should be shown based on available data
  const getAvailableTabs = () => {
    if (!model) return allTabs

    const availableTabs = []

    // Details tab is always available
    availableTabs.push(allTabs[0])

    // Lore tab - show if there's lore name or description
    if (model.lore_name || model.lore_description) {
      availableTabs.push(allTabs[1])
    }

    // Painting tab - show if there's painted date or painting notes
    if (model.painted_date || model.painting_notes) {
      availableTabs.push(allTabs[2])
    }

    return availableTabs
  }

  const availableTabs = getAvailableTabs()

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isProfileMenuOpen && !target.closest('.profile-dropdown')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  useEffect(() => {
    fetchModel()
  }, [modelId])

  // Ensure active tab is valid when available tabs change
  useEffect(() => {
    if (model && availableTabs.length > 0) {
      const currentTabExists = availableTabs.some(tab => tab.id === activeTab)
      if (!currentTabExists) {
        setActiveTab(availableTabs[0].id as 'details' | 'lore' | 'painting')
      }
    }
  }, [model, availableTabs, activeTab])

  const fetchModel = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the model details - only public models
      const { data: modelData, error: modelError } = await supabase
        .from('models')
        .select(`
          id,
          name,
          status,
          count,
          image_url,
          notes,
          public,
          lore_name,
          lore_description,
          painting_notes,
          painted_date,
          purchase_date,
          user_id,
          game:games(
            id,
            name,
            icon
          ),
          box:boxes(
            id,
            name,
            purchase_date,
            game:games(id, name, icon, image)
          ),
          images:model_images(
            id,
            model_id,
            image_url,
            display_order,
            is_primary,
            created_at,
            user_id
          )
        `)
        .eq('id', modelId)
        .eq('public', true)
        .single()

      if (modelError) {
        if (modelError.code === 'PGRST116') {
          // No rows returned - model not found or not public
          setError('Model not found or not publicly accessible')
        } else {
          throw modelError
        }
        return
      }

      // Transform the data to handle array responses from Supabase
      const transformedModel = {
        ...modelData,
        game: modelData.game && Array.isArray(modelData.game) ? modelData.game[0] : modelData.game,
        box: modelData.box && Array.isArray(modelData.box) ? modelData.box[0] : modelData.box
      }

      // Fetch user information separately
      if (modelData.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('public_usernames')
          .select('id, user_name_public')
          .eq('id', modelData.user_id)
          .single()

        if (!userError && userData) {
          transformedModel.user = {
            id: userData.id,
            username: userData.user_name_public
          }
        }
      }

      setModel(transformedModel)
      setCurrentImageIndex(0) // Reset to first image when model changes

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

  // Helper functions for image gallery
  const getAvailableImages = () => {
    if (!model) return []
    
    // Get images from the images array, sorted by display_order
    const images = model.images || []
    const sortedImages = images.sort((a, b) => a.display_order - b.display_order)
    
    // If no images in array, fall back to legacy image_url
    if (sortedImages.length === 0 && model.image_url) {
      return [{
        id: 'legacy',
        image_url: model.image_url,
        is_primary: true,
        display_order: 0
      }]
    }
    
    return sortedImages
  }

  const getCurrentImage = () => {
    const images = getAvailableImages()
    if (images.length === 0) return null
    return images[currentImageIndex] || images[0]
  }

  const nextImage = () => {
    const images = getAvailableImages()
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    const images = getAvailableImages()
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-border-custom rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-border-custom rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-border-custom rounded w-3/4"></div>
              <div className="h-4 bg-border-custom rounded w-1/2"></div>
              <div className="h-4 bg-border-custom rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !model) {
    return (
      <div className="min-h-screen bg-bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text mb-4">Model Not Found</h1>
            <p className="text-secondary-text mb-6">
              {error || 'The requested model could not be found.'}
            </p>
            <button
              onClick={onBack}
              className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-hover transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <PublicHeader />
      <div className="px-[10%] pt-6">
        {/* Preview Banner */}
        {onBack && (
          <div className="bg-brand text-white px-4 py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <span className="text-sm font-medium">This is just a preview.</span>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs && (
          <div className="mb-4">
            <nav className="flex items-center space-x-2 text-sm text-secondary-text">
              <a 
                href={`/shared/collection/${breadcrumbs.collectionId}`}
                className="hover:text-text transition-colors"
              >
                {breadcrumbs.collectionName}
              </a>
              <span>/</span>
              <span className="text-text">{model?.name || 'Loading...'}</span>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main>
          {/* Image Gallery */}
          <div className="w-full relative">
            {(() => {
              const currentImage = getCurrentImage()
              const availableImages = getAvailableImages()
              
              if (!currentImage) {
                // Fallback to game icon or default
                const gameIcon = model.box?.game?.icon || model.game?.icon
                const fallbackSrc = (gameIcon && 
                  typeof gameIcon === 'string' &&
                  gameIcon.trim() !== '' && 
                  gameIcon !== 'undefined' && 
                  gameIcon !== 'null' &&
                  gameIcon.startsWith('http')) ? gameIcon : '/bp-unkown.svg'
                
                return (
                  <img
                    src={fallbackSrc}
                    alt={model.name}
                    className="w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/bp-unkown.svg'
                    }}
                  />
                )
              }
              
              return (
                <>
                  <img
                    src={currentImage.image_url}
                    alt={model.name}
                    className="w-full max-h-[70vh] object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/bp-unkown.svg'
                    }}
                  />
                  
                  {/* Image Gallery Navigation */}
                  {availableImages.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Next Button */}
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {availableImages.length}
                      </div>
                    </>
                  )}
                </>
              )
            })()}
          </div>

          {/* Content Container */}
          <div className="max-w-4xl mx-auto py-8">
            {/* Model Header */}
            <div className="bg-bg-card border border-border-custom rounded-lg p-6 mb-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-title mb-2">{model.name}</h1>
                {model.user?.username && (
                  <p className="text-secondary-text mb-3">by {model.user.username}</p>
                )}
                {model.game && (
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    {model.game.icon && (
                      <img
                        src={model.game.icon}
                        alt={model.game?.name || 'Unknown Game'}
                        className="w-6 h-6"
                      />
                    )}
                    <span className="text-secondary-text">{model.game?.name || 'Unknown Game'}</span>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-4 text-sm text-secondary-text">
                  <span>Status: {model.status}</span>
                  <span>Count: {model.count}</span>
                </div>
              </div>
            </div>

            {/* Tab Selector - only show if more than one tab is available */}
            {availableTabs.length > 1 && (
              <TabSelector
                tabs={availableTabs}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as 'details' | 'lore' | 'painting')}
                className="mb-6"
              />
            )}

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Model Count */}
                <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-secondary-text" />
                    <span className="text-base text-text font-medium">
                      {model.count} model{model.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Purchase Date - only show if purchase date exists */}
                {model.purchase_date && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-secondary-text" />
                      <span className="text-base text-text font-medium">
                        Purchased {formatDate(model.purchase_date)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes - only show if notes exist */}
                {model.notes && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-title mb-4">Notes</h2>
                    <div className="prose prose-sm max-w-none text-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {model.notes}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'lore' && (
              <div className="space-y-6">
                {/* Lore Name - only show if lore name exists */}
                {model.lore_name && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-title mb-4">Lore Name</h2>
                    <p className="text-text">{model.lore_name}</p>
                  </div>
                )}

                {/* Lore Description - only show if lore description exists */}
                {model.lore_description && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-title mb-4">Lore Description</h2>
                    <div className="prose prose-sm max-w-none text-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {model.lore_description}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!model.lore_name && !model.lore_description && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <div className="text-center text-secondary-text">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No lore information available</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'painting' && (
              <div className="space-y-6">
                {/* Painted Date - only show if painted date exists */}
                {model.painted_date && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <Brush className="w-5 h-5 text-secondary-text" />
                      <span className="text-base text-text font-medium">
                        Painted {formatDate(model.painted_date)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Painting Information - only show if painting notes exist */}
                {model.painting_notes && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-title mb-4">Painting Information</h2>
                    <div className="prose prose-sm max-w-none text-text">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {model.painting_notes}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!model.painted_date && !model.painting_notes && (
                  <div className="bg-bg-card border border-border-custom rounded-lg p-6">
                    <div className="text-center text-secondary-text">
                      <Brush className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No painting information available</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Footer />
          </div>
        </main>
      </div>
    </div>
  )
}
