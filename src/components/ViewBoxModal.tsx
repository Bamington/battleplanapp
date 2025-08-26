import React, { useState } from 'react'
import { X, Calendar, DollarSign, FileText, Share2, Edit, Plus, Package, Trash2, ChevronRight } from 'lucide-react'
import { DeleteBoxModal } from './DeleteBoxModal'
import { AddModelsToBoxModal } from './AddModelsToBoxModal'
import { EditBoxModal } from './EditBoxModal'
import { RemoveModelFromBoxModal } from './RemoveModelFromBoxModal'
import { ShareCollectionModal } from './ShareCollectionModal'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../utils/timezone'

interface ViewBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onBoxDeleted?: () => void
  onModelsUpdated?: () => void
  onViewModel?: (model: any) => void
  onAddNewModel?: (boxId: string | null) => void
  box: {
    id: string
    name: string
    purchase_date: string | null
    image_url: string | null
    public: boolean
    game: {
      name: string
      image: string | null
      icon: string | null
    } | null
  } | null
}

export function ViewBoxModal({ isOpen, onClose, onBoxDeleted, onModelsUpdated, onViewModel, onAddNewModel, box }: ViewBoxModalProps) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showAddModelsModal, setShowAddModelsModal] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
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
      const { data, error } = await supabase
        .from('models')
        .select(`
          id,
          name,
          status,
          count,
          image_url,
          game_id,
          notes,
          painted_date,
          purchase_date,
          game:games(
            id,
            name,
            icon
          )
        `)
        .eq('box_id', box.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBoxModels(data || [])
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

  const handleAddNewModel = () => {
    // Close all modals and signal to add new model
    setShowAddModelsModal(false)
    setShouldAddNewModel(true)
    onClose()
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
    if (!removeModelModal.model) return

    setRemovingModel(true)
    try {
      const { error } = await supabase
        .from('models')
        .update({ 
          box_id: null,
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

  const handleViewModelFromBox = (model: any) => {
    // Close this modal and open the view model modal
    onClose()
    onViewModel?.(model)
  }

  const handleBoxUpdated = () => {
    setShowEditModal(false)
    // The parent component should handle refreshing the box data
    // We'll close this modal and let the parent refresh
    onClose()
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

  const handleBackdropClick = (e: React.MouseEvent) => {
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

  const getImageSrc = () => {
    // Check if we have a valid box image URL
    if (box.image_url && 
        typeof box.image_url === 'string' &&
        box.image_url.trim() !== '' && 
        box.image_url !== 'undefined' && 
        box.image_url !== 'null' &&
        (box.image_url.startsWith('http') || box.image_url.startsWith('/'))) {
      return box.image_url
    }
    
    // Try to use the game's image as fallback
    const gameImage = box.game?.image
    if (gameImage && 
        typeof gameImage === 'string' &&
        gameImage.trim() !== '' && 
        gameImage !== 'undefined' && 
        gameImage !== 'null' &&
        gameImage.startsWith('http')) {
      return gameImage
    }
    
    // Final fallback to default image
    return 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
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
    return { src: 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg', isGameFallback: false }
  }

  const handleShareClick = () => {
    setShowShareModal(true)
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
      onClose()
      
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg max-w-2xl w-full overflow-y-auto md:rounded-lg md:max-w-2xl md:max-h-[90vh] fixed inset-0 md:relative md:inset-auto h-screen md:h-auto">
          {/* Header Image */}
          <div className="relative">
            <img
              src={getImageSrc()}
              alt={box.name}
              className="w-full max-h-[60%] object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                const fallbackUrl = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                if (target.src !== fallbackUrl) {
                  console.log('Box modal image failed to load:', target.src, 'Falling back to default')
                  target.src = fallbackUrl
                }
              }}
            />
          </div>

          {/* Sticky Close Button */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 md:absolute text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 z-20"
          >
            <X className="w-6 h-6 text-icon" />
          </button>

          {/* Content */}
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
                    alt={`${box.game.name} icon`}
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
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {boxModels.map((model) => (
                    <div
                      key={model.id}
                      className="bg-bg-secondary rounded-lg p-4 flex items-center justify-between hover:bg-bg-primary transition-colors"
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
                                 target.src = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
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
                          onClick={() => handleRemoveModelFromBox(model)}
                          className="p-2 text-icon hover:text-icon-hover transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewModelFromBox(model)}
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

            {/* Action Buttons */}
            <div className="flex justify-center pt-6">
              <div className="space-y-3 w-full">
                <button
                  onClick={() => setShowAddModelsModal(true)}
                  className="btn-primary btn-full btn-with-icon"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Models to Collection</span>
                </button>
                <button
                  onClick={handleShareClick}
                  className="btn-secondary btn-full btn-with-icon"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Collection</span>
                </button>
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
    </>
  )
}