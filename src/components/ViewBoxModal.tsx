import React, { useState } from 'react'
import { X, Calendar, DollarSign, FileText, Share2, Edit, Plus, Package, Trash2, ChevronRight, Camera, Image, Info, Settings } from 'lucide-react'
import { TabSelector } from './TabSelector'
import { CollectionImage } from './CollectionImage'
import { DeleteBoxModal } from './DeleteBoxModal'
import { AddModelsToBoxModal } from './AddModelsToBoxModal'
import { EditBoxModal } from './EditBoxModal'
import { RemoveModelFromBoxModal } from './RemoveModelFromBoxModal'
import { ShareCollectionModal } from './ShareCollectionModal'
import { ShareScreenshotPreview } from './ShareScreenshotPreview'
import { supabase } from '../lib/supabase'
import { formatLocalDate, formatAustralianDate } from '../utils/timezone'
import { getBoxWithModels, removeModelFromBox } from '../utils/modelBoxUtils'
import { getBoxWithImages, getBoxImageSrc, type BoxWithImages } from '../utils/boxImageUtils'

interface ViewBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onBoxDeleted?: () => void
  onModelsUpdated?: () => void
  onViewModel?: (model: any) => void
  onAddNewModel?: (boxId: string | null) => void
  box: BoxWithImages | null
}

export function ViewBoxModal({ isOpen, onClose, onBoxDeleted, onModelsUpdated, onViewModel, onAddNewModel, box }: ViewBoxModalProps) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showAddModelsModal, setShowAddModelsModal] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = React.useState(false)
  const [removeModelModal, setRemoveModelModal] = React.useState<{
    isOpen: boolean
    model: any | null
  }>({
    isOpen: false,
    model: null
  })
  const [shouldAddNewModel, setShouldAddNewModel] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [removingModel, setRemovingModel] = React.useState(false)
  const [boxModels, setBoxModels] = React.useState<any[]>([])
  const [modelsLoading, setModelsLoading] = React.useState(true)
  const [modelsError, setModelsError] = React.useState<string | null>(null)
  const [boxWithImages, setBoxWithImages] = React.useState<BoxWithImages | null>(null)
  const [showCarousel, setShowCarousel] = React.useState(box?.show_carousel || false)
  const [originalShowCarousel, setOriginalShowCarousel] = React.useState(box?.show_carousel || false)
  const [savingToggle, setSavingToggle] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'details' | 'settings'>('details')
  const [sortBy, setSortBy] = React.useState<'date-added' | 'painted-status' | 'alphabetical'>('date-added')

  const tabs = [
    {
      id: 'details',
      label: 'Details',
      icon: Info
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ]

  // Sorting function for models
  const sortModels = (models: any[], sortType: 'date-added' | 'painted-status' | 'alphabetical') => {
    return [...models].sort((a, b) => {
      switch (sortType) {
        case 'date-added':
          // Sort by created_at date (newest first)
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA

        case 'painted-status':
          // Sort by painted status (painted models first, then by status priority)
          const statusPriority = {
            'Painted': 1,
            'Base Coated': 2,
            'Primed': 3,
            'Part Painted': 4,
            'None': 5,
            '': 6
          } as const

          const priorityA = statusPriority[a.status as keyof typeof statusPriority] || 6
          const priorityB = statusPriority[b.status as keyof typeof statusPriority] || 6

          if (priorityA !== priorityB) {
            return priorityA - priorityB
          }
          // If same status, sort alphabetically by name
          return a.name.localeCompare(b.name)

        case 'alphabetical':
          // Sort alphabetically by name
          return a.name.localeCompare(b.name)

        default:
          return 0
      }
    })
  }

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Update local state when box changes
  React.useEffect(() => {
    if (box) {
      setShowCarousel(box.show_carousel || false)
      setOriginalShowCarousel(box.show_carousel || false)
    }
  }, [box])

  // Fetch models when modal opens or box changes
  React.useEffect(() => {
    if (isOpen && box) {
      fetchBoxModels()
    }
  }, [isOpen, box])

  const fetchBoxModels = async () => {
    if (!box) return

    setModelsLoading(true)
    setModelsError(null)

    try {
      const [boxWithModels, boxImagesData] = await Promise.all([
        getBoxWithModels(box.id),
        getBoxWithImages(box.id)
      ])

      if (boxWithModels) {
        setBoxModels(boxWithModels.models || [])
      }

      if (boxImagesData) {
        setBoxWithImages(boxImagesData)
      }
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setModelsLoading(false)
    }
  }

  const handleModelsAdded = () => {
    setShowAddModelsModal(false)
    // Refresh the box models list and main collection
    fetchBoxModels()
    // Refresh the main models collection
    onModelsUpdated?.()
  }

  const handleAddNewModel = async () => {
    // Close all modals and signal to add new model
    setShowAddModelsModal(false)
    setShouldAddNewModel(true)
    await handleClose()
  }

  // Effect to trigger add model modal when shouldAddNewModel is true
  React.useEffect(() => {
    if (shouldAddNewModel && !isOpen) {
      // Reset the flag and trigger the add model flow
      setShouldAddNewModel(false)
      onAddNewModel?.(box?.id || null)
    }
  }, [shouldAddNewModel, isOpen, onAddNewModel, box?.id])

  const handleRemoveModelFromBox = (model: any) => {
    setRemoveModelModal({
      isOpen: true,
      model
    })
  }

  const handleConfirmRemoveModel = async () => {
    if (!removeModelModal.model || !box) return

    setRemovingModel(true)
    try {
      // Remove model from this specific box using many-to-many relationship
      await removeModelFromBox(removeModelModal.model.id, box.id)

      // Optionally update model visibility if it's no longer in any public boxes
      // This logic can be expanded based on your business requirements
      const { error } = await supabase
        .from('models')
        .update({ 
          public: false
        })
        .eq('id', removeModelModal.model.id)

      if (error) throw error

      // Refresh the box models list and main collection
      fetchBoxModels()
      onModelsUpdated?.()
      setRemoveModelModal({ isOpen: false, model: null })
    } catch (error) {
      console.error('Error removing model from box:', error)
      // You could add error handling UI here
    } finally {
      setRemovingModel(false)
    }
  }

  const handleViewModelFromBox = async (model: any) => {
    // Close this modal and open the view model modal
    await handleClose()
    onViewModel?.(model)
  }

  const handleBoxUpdated = async () => {
    setShowEditModal(false)
    // The parent component should handle refreshing the box data
    // We'll close this modal and let the parent refresh
    await handleClose()
    // Trigger a refresh of the boxes list
    if (onModelsUpdated) {
      onModelsUpdated()
    }
  }

  const handleCollectionShared = () => {
    // Just refresh the box data without closing the modal
    if (onModelsUpdated) {
      onModelsUpdated()
    }
  }

  if (!isOpen || !box) return null

  const handleClose = async () => {
    const hadChanges = showCarousel !== originalShowCarousel
    const saveSuccessful = await saveToggleSelection()

    // Only refresh if the save was successful and there were changes
    if (saveSuccessful && onModelsUpdated) {
      // Small delay to ensure database transaction is fully committed
      setTimeout(() => {
        onModelsUpdated()
      }, 100)
    }

    onClose()
  }

  const handleBackdropClick = async (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      await handleClose()
    }
  }

  const formatDate = (dateString: string) => {
    return formatAustralianDate(dateString)
  }

  // Check if both collection image and model images are available
  const hasCollectionImage = () => {
    // Check for new multi-image system first
    if (boxWithImages?.images && boxWithImages.images.length > 0) {
      return true
    }

    // Fallback to legacy single image check
    return box?.image_url &&
           typeof box.image_url === 'string' &&
           box.image_url.trim() !== '' &&
           box.image_url !== 'undefined' &&
           box.image_url !== 'null' &&
           (box.image_url.startsWith('http') || box.image_url.startsWith('/'))
  }

  const hasModelImages = () => {
    return boxModels.some(model => {
      // Check if model has a valid image
      return model.image_url &&
             typeof model.image_url === 'string' &&
             model.image_url.trim() !== '' &&
             model.image_url !== 'undefined' &&
             model.image_url !== 'null' &&
             (model.image_url.startsWith('http') || model.image_url.startsWith('/'))
    })
  }

  const shouldShowToggle = () => {
    return hasCollectionImage() && hasModelImages()
  }

  const handleToggleChange = (useCarousel: boolean) => {
    if (!box || savingToggle) return
    setShowCarousel(useCarousel)
  }

  const saveToggleSelection = async (): Promise<boolean> => {
    if (!box || showCarousel === originalShowCarousel) {
      return false
    }

    setSavingToggle(true)
    try {
      const { error } = await supabase
        .from('boxes')
        .update({ show_carousel: showCarousel })
        .eq('id', box.id)

      if (error) throw error

      // Update the original value to reflect the saved state
      setOriginalShowCarousel(showCarousel)
      return true
    } catch (err) {
      console.error('Error updating carousel setting:', err)
      // Revert to original state on error
      setShowCarousel(originalShowCarousel)
      return false
    } finally {
      setSavingToggle(false)
    }
  }

  const getImageSrc = () => {
    // Use the new multi-image utility if we have image data
    if (boxWithImages) {
      return getBoxImageSrc(boxWithImages).src
    }

    // Fallback to original logic if images haven't loaded yet
    if (box?.image_url &&
        typeof box.image_url === 'string' &&
        box.image_url.trim() !== '' &&
        box.image_url !== 'undefined' &&
        box.image_url !== 'null' &&
        (box.image_url.startsWith('http') || box.image_url.startsWith('/'))) {
      return box.image_url
    }

    // Try to use the game's image as fallback
    const gameImage = box?.game?.image
    if (gameImage &&
        typeof gameImage === 'string' &&
        gameImage.trim() !== '' &&
        gameImage !== 'undefined' &&
        gameImage !== 'null' &&
        gameImage.startsWith('http')) {
      return gameImage
    }

    // Final fallback to default image
    return '/bp-unkown.svg'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Painted': return 'bg-green-100 text-green-800'
      case 'Partially Painted': return 'bg-yellow-100 text-yellow-800'
      case 'Primed': return 'bg-blue-100 text-blue-800'
      case 'Assembled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getModelImageSrc = (model: any) => {
    // Check if we have a valid model image URL
    if (model.image_url && 
        typeof model.image_url === 'string' &&
        model.image_url.trim() !== '' && 
        model.image_url !== 'undefined' && 
        model.image_url !== 'null' &&
        (model.image_url.startsWith('http') || model.image_url.startsWith('/'))) {
      return { src: model.image_url, isGameFallback: false }
    }
    
    // Try to use the game's icon as fallback
    const gameIcon = model.game?.icon
    if (gameIcon && 
        typeof gameIcon === 'string' &&
        gameIcon.trim() !== '' && 
        gameIcon !== 'undefined' && 
        gameIcon !== 'null' &&
        gameIcon.startsWith('http')) {
      return { src: gameIcon, isGameFallback: true }
    }
    
    // Fallback to default image
    return { src: '/bp-unkown.svg', isGameFallback: false }
  }

  const handleShareClick = () => {
    setShowShareModal(true)
  }

  const handleScreenshotShareClick = () => {
    setShowScreenshotModal(true)
  }

  const isUserUploadedImage = (imageUrl: string | null) => {
    if (!imageUrl || typeof imageUrl !== 'string') return false

    // Check if it's a Supabase storage URL (user-uploaded)
    return imageUrl.includes('supabase') && imageUrl.includes('storage')
  }

  const shouldShowScreenshotButton = () => {
    // Check for user-uploaded images in the multi-image system
    if (boxWithImages?.images && boxWithImages.images.length > 0) {
      return boxWithImages.images.some(img => isUserUploadedImage(img.image_url))
    }

    // Fallback to legacy single image check
    return isUserUploadedImage(box?.image_url || null)
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!box) return
    
    setDeleting(true)
    
    try {
      // Delete associated image from storage if it exists
      if (box.image_url && 
          typeof box.image_url === 'string' &&
          box.image_url.includes('supabase')) {
        // Extract the file path from the URL
        const urlParts = box.image_url.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'model-images')
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')
          await supabase.storage
            .from('model-images')
            .remove([filePath])
        }
      }
      
      // Delete the box from the database
      const { error } = await supabase
        .from('boxes')
        .delete()
        .eq('id', box.id)
      
      if (error) throw error
      
      // Close modals and refresh data
      setShowDeleteModal(false)
      await handleClose()
      
      // Notify parent component to refresh the boxes list
      if (onBoxDeleted) {
        onBoxDeleted()
      }
    } catch (error) {
      console.error('Error deleting box:', error)
      // You could add error handling UI here
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50 modal-container"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-2xl w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col modal-content">
          {/* Sticky Close Button */}
          <button
            onClick={handleClose}
            className="fixed top-4 right-4 md:absolute text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 z-20"
          >
            <X className="w-6 h-6 text-icon" />
          </button>

          {/* Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            {/* Header Image - Now scrolls with content */}
            <div className="relative">
              {showCarousel ? (
                <div
                  className="w-full"
                  style={{
                    height: 'max(30vh, 200px)',
                    marginTop: 'calc(-1 * max(1rem, env(safe-area-inset-top)))',
                    paddingTop: 'max(1rem, env(safe-area-inset-top))'
                  }}
                >
                  <CollectionImage
                    boxId={box.id}
                    name={box.name}
                    gameImage={box.game?.image || null}
                    gameIcon={box.game?.icon || null}
                    size="large"
                    className="w-full h-full object-cover rounded-none sm:rounded-t-lg"
                    forceCarousel={true}
                  />
                </div>
              ) : (
                <img
                  src={getImageSrc()}
                  alt={box.name}
                  className="w-full object-cover rounded-none sm:rounded-t-lg"
                  style={{
                    height: 'max(30vh, 200px)',
                    marginTop: 'calc(-1 * max(1rem, env(safe-area-inset-top)))',
                    paddingTop: 'max(1rem, env(safe-area-inset-top))'
                  }}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    const fallbackUrl = '/bp-unkown.svg'
                    if (target.src !== fallbackUrl) {
                      console.log('Box modal image failed to load:', target.src, 'Falling back to default')
                      target.src = fallbackUrl
                    }
                  }}
                />
              )}
            </div>
            
            <div className="p-6">
            {/* Title Section */}
            <div className="text-center mb-6 relative">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-title">{box.name}</h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-center space-x-4">
                {box.game?.icon ? (
                  <img
                    src={box.game.icon}
                    alt={`${box.game?.name || 'Unknown Game'} icon`}
                    className="object-cover rounded max-h-[32px]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      console.warn('Game icon failed to load:', target.src, 'Falling back to letter icon')
                      // Hide the broken image and show fallback
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback && fallback.classList.contains('icon-fallback')) {
                        fallback.style.display = 'flex'
                      }
                    }}
                    onLoad={(e) => {
                      // Hide fallback when image loads successfully
                      const target = e.target as HTMLImageElement
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback && fallback.classList.contains('icon-fallback')) {
                        fallback.style.display = 'none'
                      }
                    }}
                  />
                ) : null}
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: box.game?.icon ? 'none' : 'flex' }}>
                  <span className="text-white text-xs font-bold">
                    {(box.game?.name || 'Unknown Game').charAt(0)}
                  </span>
                </div>
                <span className="text-lg font-semibold text-secondary-text">
                  {box.game?.name || 'Unknown Game'}
                </span>
              </div>
            </div>

            {/* Tab Selector */}
            <TabSelector
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as 'details' | 'settings')}
              className="mb-6"
            />

            {/* Tab Content */}
            {activeTab === 'details' && (
              <>
                {/* Details Cards */}
            <div className="space-y-3">
              {/* Purchase Date - only show if purchase date exists */}
              {box.purchase_date && (
                <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-secondary-text" />
                  <span className="text-base text-text font-medium">
                    Purchased {formatDate(box.purchase_date)}
                  </span>
                </div>
              )}
            </div>

            {/* Models in this Collection Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-title mb-4">Models in this Collection</h3>
              
              {modelsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-bg-secondary rounded-lg p-4 animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-secondary-text opacity-20 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-secondary-text opacity-20 rounded w-3/4"></div>
                          <div className="h-3 bg-secondary-text opacity-20 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : modelsError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{modelsError}</p>
                </div>
              ) : boxModels.length === 0 ? (
                <div className="text-center py-8 bg-bg-secondary rounded-lg">
                  <Package className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                  <p className="text-secondary-text">No models in this collection yet.</p>
                  <p className="text-sm text-secondary-text mt-2">Use the "Add Models to Collection" button to add some!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortModels(boxModels, sortBy).map((model) => (
                    <div
                      key={model.id}
                      className="bg-bg-secondary rounded-lg p-4 flex items-center justify-between hover:bg-bg-primary transition-colors cursor-pointer"
                      onClick={() => handleViewModelFromBox(model)}
                    >
                                             <div className="flex items-center space-x-3 flex-1 min-w-0">
                         {(() => {
                           const imageData = getModelImageSrc(model)
                           return (
                                                           <img
                                src={imageData.src}
                                alt={model.name}
                                className={`w-12 h-12 object-cover rounded ${imageData.isGameFallback ? 'opacity-10' : ''}`}
                                onError={(e) => {
                                 const target = e.target as HTMLImageElement
                                 target.src = '/bp-unkown.svg'
                               }}
                             />
                           )
                         })()}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text truncate">{model.name}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-secondary-text">
                              {model.count} model{model.count !== 1 ? 's' : ''}
                            </span>
                            {model.status !== 'None' && (
                              <>
                                <span className="text-xs text-secondary-text">•</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                                  {model.status}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveModelFromBox(model)
                          }}
                          className="p-2 text-icon hover:text-icon-hover transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewModelFromBox(model)
                          }}
                          className="p-2 text-secondary-text hover:text-text transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Model Sorting Setting */}
                <div className="bg-bg-secondary rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-title mb-4">Model Sorting</h3>
                  <p className="text-sm text-secondary-text mb-4">
                    Choose how models are sorted in this collection.
                  </p>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-secondary-text">Sort by</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'date-added' | 'painted-status' | 'alphabetical')}
                      className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors"
                    >
                      <option value="date-added">Date Added (newest first)</option>
                      <option value="painted-status">Painted Status (painted first)</option>
                      <option value="alphabetical">Alphabetical (A-Z)</option>
                    </select>
                  </div>
                </div>

                {/* Image Display Setting */}
                {shouldShowToggle() && (
                  <div className="bg-bg-secondary rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-title mb-4">Image Display</h3>
                    <p className="text-sm text-secondary-text mb-4">
                      Choose how this collection's image is displayed throughout the app.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleToggleChange(false)}
                        disabled={savingToggle}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          !showCarousel
                            ? 'bg-brand text-white shadow-md'
                            : 'bg-bg-primary text-secondary-text hover:bg-white border border-border'
                        } ${savingToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Image className="w-4 h-4" />
                        <span>Collection image</span>
                      </button>
                      <button
                        onClick={() => handleToggleChange(true)}
                        disabled={savingToggle}
                        className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                          showCarousel
                            ? 'bg-brand text-white shadow-md'
                            : 'bg-bg-primary text-secondary-text hover:bg-white border border-border'
                        } ${savingToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Package className="w-4 h-4" />
                        <span>Model images</span>
                      </button>
                    </div>
                    {showCarousel !== originalShowCarousel && (
                      <div className="mt-3 text-xs text-orange-600 text-center">
                        You'll need to reload the app to see this change take effect.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center pt-6 modal-actions">
              <div className="space-y-3 w-full">
                <button
                  onClick={() => setShowAddModelsModal(true)}
                  className="btn-primary btn-full btn-with-icon"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Models to Collection</span>
                </button>
                {shouldShowScreenshotButton() ? (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleShareClick}
                      className="btn-secondary btn-full btn-with-icon"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Collection</span>
                    </button>
                    <button
                      onClick={handleScreenshotShareClick}
                      className="btn-secondary btn-full btn-with-icon"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Share Screenshot</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleShareClick}
                    className="btn-secondary btn-full btn-with-icon"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Collection</span>
                  </button>
                )}
                <button
                  onClick={handleDeleteClick}
                  className="btn-danger-outline btn-full"
                >
                  Delete Collection
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteBoxModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        boxName={box.name}
        loading={deleting}
      />

      <AddModelsToBoxModal
        isOpen={showAddModelsModal}
        onClose={() => setShowAddModelsModal(false)}
        onModelsAdded={handleModelsAdded}
        onAddNewModel={handleAddNewModel}
        box={box}
      />

      <EditBoxModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onBoxUpdated={handleBoxUpdated}
        box={box}
      />

      <RemoveModelFromBoxModal
        isOpen={removeModelModal.isOpen}
        onClose={() => setRemoveModelModal({ isOpen: false, model: null })}
        onConfirm={handleConfirmRemoveModel}
        modelName={removeModelModal.model?.name || ''}
        boxName={box?.name || ''}
        loading={removingModel}
      />

      <ShareCollectionModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCollectionUpdated={handleCollectionShared}
        box={box}
      />

      <ShareScreenshotPreview
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        model={boxWithImages ? {
          id: boxWithImages.id,
          name: boxWithImages.name,
          image_url: boxWithImages.image_url,
          painted_date: boxWithImages.purchase_date,
          images: boxWithImages.images,
          box: null, // Collections don't have a parent box
          game: boxWithImages.game ? {
            id: '', // We don't have game ID in box
            name: boxWithImages.game.name,
            icon: boxWithImages.game.icon,
            default_theme: null
          } : null
        } : null}
      />
    </>
  )
}