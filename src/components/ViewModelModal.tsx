import React, { useState } from 'react'
import { X, Share2, Edit, Trash2, Calendar, Hash, Palette, FileText, Package, Gamepad2, Info, BookOpen, Brush, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DeleteModelModal } from './DeleteModelModal'
import { EditModelModal } from './EditModelModal'
import { ShareModelModal } from './ShareModelModal'
import { Toast } from './Toast'
import { TabSelector } from './TabSelector'
import { RichTextEditor } from './RichTextEditor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatLocalDate } from '../utils/timezone'
import { getModelBoxes } from '../utils/modelBoxUtils'


interface ViewModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelDeleted?: () => void
  onModelUpdated?: () => void
  onViewBox?: (box: any) => void
  model: {
    id: string
    name: string
    status: string
    count: number
    image_url: string
    game_id: string | null
    notes: string | null
    painted_date: string | null
    purchase_date: string | null
    public: boolean | null
    lore_name?: string | null
    lore_description?: string | null
    painting_notes?: string | null
    images?: {
      id: string
      model_id: string
      image_url: string
      display_order: number
      is_primary: boolean
      created_at: string
      user_id: string
    }[]
    box: {
      id: string
      name: string
      purchase_date: string
      game: {
        name: string
        image?: string
        icon?: string
      } | null
    } | null
    game: {
      name: string
      image?: string
      icon?: string
    } | null
  } | null
}

export function ViewModelModal({ isOpen, onClose, onModelDeleted, onModelUpdated, onViewBox, model }: ViewModelModalProps) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const [currentModel, setCurrentModel] = React.useState(model)
  const [activeTab, setActiveTab] = React.useState<'details' | 'lore' | 'painting'>('details')
  const [loreData, setLoreData] = React.useState({
    lore_name: '',
    lore_description: ''
  })
  const [originalLoreData, setOriginalLoreData] = React.useState({
    lore_name: '',
    lore_description: ''
  })
  const [paintingData, setPaintingData] = React.useState({
    painting_notes: ''
  })
  const [originalPaintingData, setOriginalPaintingData] = React.useState({
    painting_notes: ''
  })
  const [modelCollections, setModelCollections] = React.useState<Array<{ id: string; name: string; added_at: string; purchase_date: string | null }>>([])
  const [collectionsLoading, setCollectionsLoading] = React.useState(false)
  const [modelImages, setModelImages] = React.useState<{
    id: string
    model_id: string
    image_url: string
    display_order: number
    is_primary: boolean
    created_at: string
    user_id: string
  }[]>([])
  const [imagesLoading, setImagesLoading] = React.useState(false)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)

  // Define tabs configuration
  const tabs = [
    {
      id: 'details',
      label: 'Details',
      icon: Info
    },
    {
      id: 'lore',
      label: 'Lore',
      icon: BookOpen
    },
    {
      id: 'painting',
      label: 'Painting',
      icon: Brush
    }
  ]

  // Fetch model images
  const fetchModelImages = async () => {
    if (!model?.id) return
    
    setImagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('model_images')
        .select('*')
        .eq('model_id', model.id)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error fetching model images:', error)
        setModelImages([])
      } else {
        const images = data || []
        
        // Reorder images: primary first, then rest by creation date
        const primaryImage = images.find(img => img.is_primary)
        const nonPrimaryImages = images.filter(img => !img.is_primary).sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        
        const orderedImages = primaryImage ? [primaryImage, ...nonPrimaryImages] : nonPrimaryImages
        
        setModelImages(orderedImages)
        
        // Always start at index 0 since primary is now always first
        setCurrentImageIndex(0)
      }
    } catch (error) {
      console.error('Error fetching model images:', error)
      setModelImages([])
      setCurrentImageIndex(0)
    } finally {
      setImagesLoading(false)
    }
  }

  // Carousel navigation functions
  const goToPreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? modelImages.length - 1 : prev - 1
    )
  }

  const goToNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === modelImages.length - 1 ? 0 : prev + 1
    )
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Fetch model collections
  const fetchModelCollections = async () => {
    if (!model?.id) return

    setCollectionsLoading(true)
    try {
      const collections = await getModelBoxes(model.id)
      setModelCollections(collections)
    } catch (error) {
      console.error('Error fetching model collections:', error)
      setModelCollections([])
    } finally {
      setCollectionsLoading(false)
    }
  }

  // Update current model when prop changes
  React.useEffect(() => {
    setCurrentModel(model)
    if (model) {
      const newLoreData = {
        lore_name: model.lore_name || '',
        lore_description: model.lore_description || ''
      }
      const newPaintingData = {
        painting_notes: model.painting_notes || ''
      }
      setLoreData(newLoreData)
      setOriginalLoreData(newLoreData)
      setPaintingData(newPaintingData)
      setOriginalPaintingData(newPaintingData)
      
      // Reset to primary image when model changes
      setCurrentImageIndex(0)
      
      // Fetch collections and images when model changes and modal is open
      if (isOpen) {
        fetchModelCollections()
        fetchModelImages()
      }
    }
  }, [model, isOpen])

  // Handle model updates by refreshing the model data
  const handleModelUpdated = async () => {
    // Notify parent component to refresh data
    onModelUpdated?.()
  }

  // Handle clicking on a collection to view it
  const handleViewCollection = (collection: { id: string; name: string; purchase_date: string | null }) => {
    // Close this modal and open the collection view
    onClose()
    // Create a box object in the format expected by onViewBox
    const boxForView = {
      id: collection.id,
      name: collection.name,
      purchase_date: collection.purchase_date,
      image_url: null,
      public: false, // We don't have this info, but it's not critical for viewing
      game: null // We don't have this info either
    }
    onViewBox?.(boxForView)
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

  // Keyboard navigation for carousel
  React.useEffect(() => {
    if (!isOpen || modelImages.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextImage()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, modelImages.length])

  if (!isOpen || !model) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close if edit modal is open
    if (showEditModal) return
    
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

  const getStatusText = (status: string, count: number) => {
    return `${count} Model${count > 1 ? 's' : ''}`
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

  const getPaintedDate = () => {
    // Return the painted date if it exists
    return model?.painted_date || null
  }

  const getPaintNotes = () => {
    return model?.notes || null
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!model) return
    
    setDeleting(true)
    
    try {
      // Delete associated image from storage if it exists
      if (model.image_url && 
          typeof model.image_url === 'string' &&
          model.image_url.includes('supabase')) {
        // Extract the file path from the URL
        const urlParts = model.image_url.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'model-images')
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')
          await supabase.storage
            .from('model-images')
            .remove([filePath])
        }
      }
      
      // Delete the model from the database
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', model.id)
      
      if (error) throw error
      
      // Close modals and refresh data
      setShowDeleteModal(false)
      onClose()
      
      // Notify parent component to refresh the models list
      if (onModelDeleted) {
        onModelDeleted()
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      // You could add error handling UI here
    } finally {
      setDeleting(false)
    }
  }

  const handleShareModel = () => {
    setShowShareModal(true)
  }

  const handleEditSuccess = async () => {
    // Close both edit modal and view modal, return to collections
    setShowEditModal(false)
    onClose()
    
    // Refresh the data in the background
    if (onModelUpdated) {
      await onModelUpdated()
    }
  }

  const handleSaveLore = async () => {
    if (!currentModel) return

    const { error } = await supabase
      .from('models')
      .update({
        lore_name: loreData.lore_name,
        lore_description: loreData.lore_description
      })
      .eq('id', currentModel.id)

    if (error) {
      console.error('Error saving lore:', error)
      // You could add error handling UI here
    } else {
      setCurrentModel(prev => prev ? { ...prev, lore_name: loreData.lore_name, lore_description: loreData.lore_description } : null)
      setOriginalLoreData(loreData)
    }
  }

  const handleSavePainting = async () => {
    if (!currentModel) return

    const { error } = await supabase
      .from('models')
      .update({
        painting_notes: paintingData.painting_notes
      })
      .eq('id', currentModel.id)

    if (error) {
      console.error('Error saving painting notes:', error)
      // You could add error handling UI here
    } else {
      setCurrentModel(prev => prev ? { ...prev, painting_notes: paintingData.painting_notes } : null)
      setOriginalPaintingData(paintingData)
    }
  }

  // Check if lore data has changed
  const hasLoreChanges = loreData.lore_name !== originalLoreData.lore_name || 
                        loreData.lore_description !== originalLoreData.lore_description

  // Check if painting data has changed
  const hasPaintingChanges = paintingData.painting_notes !== originalPaintingData.painting_notes

  if (!isOpen || !currentModel) return null

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black flex items-center justify-center p-0 sm:p-4 z-50 modal-container ${
          showEditModal ? 'bg-opacity-25' : 'bg-opacity-50'
        }`}
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-2xl w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col modal-content">
          {/* Sticky Close Button */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 md:absolute text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 z-20"
          >
            <X className="w-6 h-6 text-icon" />
          </button>

          {/* Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            {/* Image Carousel */}
            <div className="relative">
              {modelImages.length > 0 ? (
                <>
                  {/* Current Image */}
                  <img
                    src={(() => {
                      const currentImage = modelImages[currentImageIndex]
                      if (currentImage?.image_url) {
                        return currentImage.image_url
                      }
                      
                      // Fallback to model.image_url if no images in model_images
                      if (model.image_url && 
                         typeof model.image_url === 'string' &&
                         model.image_url.trim() !== '' && 
                         model.image_url !== 'undefined' && 
                         model.image_url !== 'null') {
                        return model.image_url
                      }
                      
                      // Final fallback
                      return '/bp-unkown.svg'
                    })()}
                    alt={`${model.name} - Image ${currentImageIndex + 1}`}
                    className="w-full object-cover rounded-none sm:rounded-t-lg"
                    style={{ 
                      marginTop: 'calc(-1 * max(1rem, env(safe-area-inset-top)))', 
                      paddingTop: 'max(1rem, env(safe-area-inset-top))'
                    }}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const fallbackUrl = '/bp-unkown.svg'
                      if (target.src !== fallbackUrl) {
                        console.log('Modal image failed to load:', target.src, 'Falling back to default')
                        target.src = fallbackUrl
                      }
                    }}
                  />
                  
                  {/* Carousel Controls - Only show if multiple images */}
                  {modelImages.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <button
                        onClick={goToPreviousImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      
                      {/* Next Button */}
                      <button
                        onClick={goToNextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                        {modelImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex 
                                ? 'bg-white' 
                                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                      
                      {/* Image Counter */}
                      <div className="absolute top-6 right-6 bg-black bg-opacity-25 text-white text-sm px-2 py-1 rounded z-10">
                        {currentImageIndex + 1} / {modelImages.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* Fallback for when no images are found in model_images table */
                <img
                  src={(() => {
                    // Check if we have a valid model image URL
                    if (model.image_url && 
                       typeof model.image_url === 'string' &&
                       model.image_url.trim() !== '' && 
                       model.image_url !== 'undefined' && 
                       model.image_url !== 'null') {
                      return model.image_url
                    }
                    
                    // Try to use the game's icon as fallback
                    const gameIcon = model.box?.game?.icon || model.game?.icon
                    if (gameIcon && 
                        typeof gameIcon === 'string' &&
                        gameIcon.trim() !== '' && 
                        gameIcon !== 'undefined' && 
                        gameIcon !== 'null' &&
                        gameIcon.startsWith('http')) {
                      return gameIcon
                    }
                    
                    // Final fallback to default image
                    return '/bp-unkown.svg'
                  })()}
                  alt={model.name}
                  className="w-full object-cover rounded-none sm:rounded-t-lg"
                  style={{ 
                    marginTop: 'calc(-1 * max(1rem, env(safe-area-inset-top)))', 
                    paddingTop: 'max(1rem, env(safe-area-inset-top))'
                  }}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    const fallbackUrl = '/bp-unkown.svg'
                    if (target.src !== fallbackUrl) {
                      console.log('Modal image failed to load:', target.src, 'Falling back to default')
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
                <h2 className="text-2xl font-bold text-title">{model.name}</h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              {model.box ? (
                <button
                  onClick={() => {
                    onClose()
                    onViewBox?.(model.box)
                  }}
                  className="text-base text-secondary-text mb-3 hover:text-amber-600 transition-colors"
                >
                  {model.box.name}
                </button>
              ) : null}
              <div className="flex items-center justify-center space-x-4">
                {(model.box?.game?.icon || model.game?.icon) ? (
                  <img
                    src={model.box?.game?.icon || model.game?.icon}
                    alt={`${model.box?.game?.name || model.game?.name || 'Unknown Game'} icon`}
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
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: (model.box?.game?.icon || model.game?.icon) ? 'none' : 'flex' }}>
                  <span className="text-white text-xs font-bold">
                    {(model.box?.game?.name || model.game?.name || 'Unknown Game').charAt(0)}
                  </span>
                </div>
                <span className="text-lg font-semibold text-secondary-text">
                  {model.box?.game?.name || model.game?.name || 'Unknown Game'}
                </span>
              </div>
            </div>

            {/* Tab Selector */}
            <TabSelector
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as 'details' | 'lore' | 'painting')}
              className="mb-6"
            />

            {/* Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-3">
                {/* Model Count */}
                <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-secondary-text" />
                  <span className="text-base text-text font-medium">
                    {getStatusText(model.status, model.count)}
                  </span>
                </div>

                {/* Purchase Date */}
                {model.purchase_date && (
                <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-secondary-text" />
                  <span className="text-base text-text font-medium">
                    Purchased {formatDate(model.purchase_date)}
                  </span>
                </div>
                )}

                {/* Painted Date - only show if painted date exists */}
                {getPaintedDate() && (
                  <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-secondary-text" />
                    <span className="text-base text-text font-medium">
                      Painted {formatDate(getPaintedDate()!)}
                    </span>
                  </div>
                )}

                {/* Collections */}
                <div className="bg-bg-secondary rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Package className="w-5 h-5 text-secondary-text" />
                    <span className="text-base text-text font-medium">Collections</span>
                  </div>
                  
                  {collectionsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-brand)]"></div>
                      <span className="ml-2 text-sm text-secondary-text">Loading collections...</span>
                    </div>
                  ) : modelCollections.length > 0 ? (
                    <div className="space-y-2">
                      {modelCollections.map((collection) => (
                        <button 
                          key={collection.id} 
                          onClick={() => handleViewCollection(collection)}
                          className="w-full flex items-center justify-between py-2 px-3 bg-bg-primary rounded-md hover:bg-bg-secondary transition-colors text-left"
                        >
                          <span className="text-sm text-text font-medium">{collection.name}</span>
                          <span className="text-xs text-secondary-text">
                            {collection.purchase_date ? `Purchased ${formatLocalDate(collection.purchase_date)}` : 'No purchase date'}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Package className="w-8 h-8 text-secondary-text mx-auto mb-2" />
                      <p className="text-sm text-secondary-text">Not in any collections</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'lore' && (
              <div className="space-y-3">
                {/* Lore Name */}
                <div className="bg-bg-secondary rounded-lg p-4">
                  <label className="block text-sm font-medium text-text mb-2">
                    Lore Name
                  </label>
                  <input
                    type="text"
                    value={loreData.lore_name}
                    onChange={(e) => setLoreData({ ...loreData, lore_name: e.target.value })}
                    placeholder="Enter lore name..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Lore Description */}
                <div className="bg-bg-secondary rounded-lg p-4">
                  <RichTextEditor
                    value={loreData.lore_description}
                    onChange={(value) => setLoreData({ ...loreData, lore_description: value })}
                    placeholder="Enter lore description..."
                    label="Lore Description"
                    rows={6}
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSaveLore}
                    disabled={!hasLoreChanges}
                    className="btn-secondary btn-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Lore
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'painting' && (
              <div className="space-y-3">
                {/* Painted Date - only show if painted date exists */}
                {getPaintedDate() && (
                  <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                    <Palette className="w-5 h-5 text-secondary-text" />
                    <span className="text-base text-text font-medium">
                      Painted {formatDate(getPaintedDate()!)}
                    </span>
                  </div>
                )}

                {/* Painting Information */}
                <div className="bg-bg-secondary rounded-lg p-4">
                  <RichTextEditor
                    value={paintingData.painting_notes}
                    onChange={(value) => setPaintingData({ ...paintingData, painting_notes: value })}
                    placeholder="Enter painting information..."
                    label="Painting Information"
                    rows={6}
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSavePainting}
                    disabled={!hasPaintingChanges}
                    className="btn-secondary btn-full w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Painting Information
                  </button>
                </div>

                {/* Notes - only show if notes exist */}
                {getPaintNotes() && (
                  <div className="bg-bg-secondary rounded-lg p-4 flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-secondary-text mt-0.5" />
                    <div className="flex-1">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-base text-text">{children}</p>,
                          h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-text">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-text">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-text">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-base text-text">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                          em: ({ children }) => <em className="italic text-text">{children}</em>,
                          code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2 text-text">{children}</blockquote>,
                        }}
                      >
                        {getPaintNotes()}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {!getPaintedDate() && !getPaintNotes() && !paintingData.painting_notes && (
                  <div className="bg-bg-secondary rounded-lg p-4">
                    <div className="text-center text-secondary-text">
                      <Brush className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No painting information available</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-6 modal-actions">
              <div className="space-y-3">
                <button
                  onClick={handleShareModel}
                  className="btn-primary btn-full btn-with-icon w-full"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Model</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="btn-danger-outline w-full"
                >
                  Delete this model
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModelModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        modelName={model.name}
        loading={deleting}
      />

      <EditModelModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onModelUpdated={handleEditSuccess}
        model={model}
      />

      <ShareModelModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onModelUpdated={handleModelUpdated}
        model={currentModel}
      />

      <Toast
        message="A share link has been copied to your clipboard"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}