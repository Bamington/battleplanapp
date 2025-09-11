import React, { useState, useEffect } from 'react'
import { X, Package, Check, Plus, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from './Button'
import { addModelsToBox, getModelsNotInBoxes } from '../utils/modelBoxUtils'

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string
  game_id: string | null
  box_id: string | null
  purchase_date: string | null
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
}

interface AddModelsToBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onModelsAdded: () => void
  onAddNewModel: () => void
  box: {
    id: string
    name: string
    public: boolean
    purchase_date: string | null
      game: {
      id: string
      name: string
      icon: string | null
      image: string | null
    } | null
  }
}

export function AddModelsToBoxModal({ isOpen, onClose, onModelsAdded, onAddNewModel, box }: AddModelsToBoxModalProps) {
  const [models, setModels] = useState<Model[]>([])
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchModels()
    }
  }, [isOpen, user])

  const fetchModels = async () => {
    try {
      setLoading(true)
      if (!user?.id) return

      // Get models that are available to add to boxes (either not in any box, or can be in multiple boxes)
      const availableModels = await getModelsNotInBoxes(user.id)
      
      // Convert to the expected format and add box_id for backward compatibility
      const modelsWithBoxId = availableModels.map(model => ({
        ...model,
        box_id: null, // These models are not in any box
        game: model.game
      }))

      // Sort models: same game first, then others
      const sortedModels = modelsWithBoxId.sort((a, b) => {
        // Check if model matches the box's game
        const aIsSameGame = box.game?.id && a.game_id === box.game.id
        const bIsSameGame = box.game?.id && b.game_id === box.game.id
        
        if (aIsSameGame && !bIsSameGame) return -1
        if (!aIsSameGame && bIsSameGame) return 1
        
        // If both are same game or both are different, sort by name
        return a.name.localeCompare(b.name)
      })

      setModels(sortedModels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(modelId)) {
        newSet.delete(modelId)
      } else {
        newSet.add(modelId)
      }
      return newSet
    })
  }

  const handleAddModels = async () => {
    if (selectedModels.size === 0) return

    setAdding(true)
    setError(null)

    try {
      const modelIds = Array.from(selectedModels)
      
      // Add models to box using many-to-many relationship
      // This will automatically update purchase dates to earliest collection date
      await addModelsToBox(modelIds, box.id)

      // Update model properties if needed
      const updates = modelIds.map(modelId => {
        const updateData: any = {
          public: box.public
        }
        
        return { id: modelId, updateData }
      })

      // Update models one by one to handle different update data
      for (const { id, updateData } of updates) {
        const { error } = await supabase
          .from('models')
          .update(updateData)
          .eq('id', id)
        
        if (error) throw error
      }

      onModelsAdded()
      onClose()
      setSelectedModels(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add models to box')
    } finally {
      setAdding(false)
    }
  }

  const handleAddNewModel = () => {
    // Store the current box in localStorage for the new model modal
    try {
      localStorage.setItem('mini-myths-temp-box-context', JSON.stringify({
        id: box.id,
        name: box.name,
        game: box.game,
      }))
    } catch (error) {
      console.error('Error storing box context:', error)
    }
    onAddNewModel()
    onClose()
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

  const getModelImageSrc = (model: Model) => {
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

  // Filter models by search query (search by model name, game name, and custom game)
  const filteredModels = models.filter(model => {
    const searchLower = searchQuery.toLowerCase()
    const modelNameMatch = model.name.toLowerCase().includes(searchLower)
    const gameNameMatch = model.game?.name?.toLowerCase().includes(searchLower) || false
    return modelNameMatch || gameNameMatch
  })
  
  const sameGameModels = filteredModels.filter(model => 
    box.game?.id && model.game_id === box.game.id
  )
  const otherModels = filteredModels.filter(model => 
    !(box.game?.id && model.game_id === box.game.id)
  )

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border-custom flex-shrink-0">
          <h2 className="text-lg font-bold text-title">Add Models to Collection: {box.name}</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)] mx-auto mb-4"></div>
            <p className="text-secondary-text">Loading models...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-secondary-text mx-auto mb-4" />
            <p className="text-secondary-text mb-4">No unboxed models found in your collection.</p>
            <p className="text-sm text-secondary-text">All your models are already assigned to collections.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-secondary-text mb-4">
              Select models to add to this box. Models will be moved from their current unboxed state.
            </p>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by model name or game..."
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] text-sm bg-bg-primary text-text"
              />
            </div>

            {/* No search results */}
            {searchQuery && sameGameModels.length === 0 && otherModels.length === 0 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                <p className="text-secondary-text mb-2">No models found matching "{searchQuery}"</p>
                <p className="text-sm text-secondary-text">Try adjusting your search or clear the search to see all models.</p>
              </div>
            )}

            <div className="space-y-6 mb-6">
              {/* Same Game Models */}
              {sameGameModels.length > 0 && (
                <div>
                                     <h3 className="text-sm font-semibold text-title mb-3 uppercase tracking-wide">
                     {box.game?.name || 'Same Game'} Models
                   </h3>
                   <div className="space-y-2">
                     {sameGameModels.map((model) => (
                       <div
                         key={model.id}
                         className="flex items-center space-x-3 p-3 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors"
                       >
                         <button
                           type="button"
                           onClick={() => handleModelToggle(model.id)}
                           className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                             selectedModels.has(model.id)
                               ? 'bg-brand border---color-brand text-white'
                               : 'border-border-custom hover:border---color-brand'
                           }`}
                         >
                           {selectedModels.has(model.id) && <Check className="w-3 h-3" />}
                         </button>
                         
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
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                                {model.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Models */}
              {otherModels.length > 0 && (
                <div>
                                     <h3 className="text-sm font-semibold text-title mb-3 uppercase tracking-wide">
                     Other Models
                   </h3>
                   <div className="space-y-2">
                     {otherModels.map((model) => (
                       <div
                         key={model.id}
                         className="flex items-center space-x-3 p-3 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors"
                       >
                         <button
                           type="button"
                           onClick={() => handleModelToggle(model.id)}
                           className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                             selectedModels.has(model.id)
                               ? 'bg-brand border---color-brand text-white'
                               : 'border-border-custom hover:border---color-brand'
                           }`}
                         >
                           {selectedModels.has(model.id) && <Check className="w-3 h-3" />}
                         </button>
                         
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
                              {model.game?.name || 'Unknown Game'}
                            </span>
                            <span className="text-xs text-secondary-text">•</span>
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
                    ))}
                  </div>
                </div>
              )}
            </div>

          </>
        )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t border-border-custom flex-shrink-0">
          {/* New Model Button - Always show at top */}
          <div className="mb-4">
            <Button
              onClick={handleAddNewModel}
              variant="secondary"
              width="full"
              withIcon
            >
              <Plus className="w-4 h-4" />
              <span>New Model</span>
            </Button>
          </div>

          {/* Action Buttons */}
          {models.length === 0 ? (
            /* Footer for no models case */
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="btn-ghost btn-flex"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Footer for normal case */
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                disabled={adding}
                className="btn-ghost btn-flex"
              >
                Cancel
              </button>
              <button
                onClick={handleAddModels}
                disabled={selectedModels.size === 0 || adding}
                className="btn-primary btn-flex"
              >
                {adding ? 'Adding...' : `Add ${selectedModels.size} Model${selectedModels.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}