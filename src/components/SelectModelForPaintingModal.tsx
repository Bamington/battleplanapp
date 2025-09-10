import React, { useState, useEffect } from 'react'
import { X, Search, Palette, Package } from 'lucide-react'
import { useModels } from '../hooks/useModels'
import { useAuth } from '../hooks/useAuth'

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string | null
  game_id: string | null
  game: {
    id: string
    name: string
    icon: string | null
  } | null
  box: {
    id: string
    name: string
  } | null
}

interface SelectModelForPaintingModalProps {
  isOpen: boolean
  onClose: () => void
  onModelSelected: (model: Model, showInspiration?: boolean) => void
  excludeModelIds?: string[] // Models already on painting table
}

export function SelectModelForPaintingModal({ 
  isOpen, 
  onClose, 
  onModelSelected,
  excludeModelIds = []
}: SelectModelForPaintingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { models, loading } = useModels()
  const { user } = useAuth()

  if (!isOpen) return null

  // Filter models based on search, exclude already selected ones, and filter out painted models
  const filteredModels = models.filter(model => {
    const searchLower = searchQuery.toLowerCase()
    const modelNameMatch = model.name.toLowerCase().includes(searchLower)
    const gameNameMatch = model.game?.name?.toLowerCase().includes(searchLower) || false
    const boxNameMatch = model.box?.name?.toLowerCase().includes(searchLower) || false
    const isNotExcluded = !excludeModelIds.includes(model.id)
    const isNotPainted = model.status !== 'Painted'
    
    return (modelNameMatch || gameNameMatch || boxNameMatch) && isNotExcluded && isNotPainted
  })

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleModelSelect = (model: Model) => {
    onModelSelected(model, true) // Show inspiration automatically
    setSearchQuery('')
    onClose()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Painted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'Partially Painted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'Primed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'Assembled': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const getModelImageSrc = (model: Model) => {
    if (model.image_url && 
        typeof model.image_url === 'string' &&
        model.image_url.trim() !== '' && 
        model.image_url !== 'undefined' && 
        model.image_url !== 'null' &&
        (model.image_url.startsWith('http') || model.image_url.startsWith('/'))) {
      return model.image_url
    }
    
    // Try game icon as fallback
    const gameIcon = model.game?.icon
    if (gameIcon && 
        typeof gameIcon === 'string' &&
        gameIcon.trim() !== '' && 
        gameIcon !== 'undefined' && 
        gameIcon !== 'null' &&
        gameIcon.startsWith('http')) {
      return gameIcon
    }
    
    return '/bp-unkown.svg'
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border-custom flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Palette className="w-5 h-5 text-brand" />
            </div>
            <h2 className="text-lg font-bold text-title">Select Model for Painting Table</h2>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <p className="text-sm text-secondary-text mb-6">
            Choose a model from your collection to add to your painting table. You can track your painting progress and notes.
          </p>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by model name, game, or collection..."
              className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm bg-bg-primary text-text placeholder-secondary-text"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
              <p className="text-secondary-text">Loading your models...</p>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                <>
                  <Search className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-title mb-2">No models found</h3>
                  <p className="text-secondary-text">
                    No models match "{searchQuery}". Try adjusting your search.
                  </p>
                </>
              ) : (
                <>
                  <Package className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-title mb-2">No available models</h3>
                  <p className="text-secondary-text">
                    All your models are already on the painting table or you don't have any models yet.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className="bg-bg-card border border-border-custom rounded-lg p-4 hover:border-brand hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={getModelImageSrc(model)}
                      alt={model.name}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/bp-unkown.svg'
                      }}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-title truncate group-hover:text-brand transition-colors">
                        {model.name}
                      </h3>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-secondary-text">
                          {model.count} model{model.count !== 1 ? 's' : ''}
                        </span>
                        
                        {model.status && model.status !== 'None' && (
                          <>
                            <span className="text-xs text-secondary-text">•</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                              {model.status}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        {model.game?.name && (
                          <span className="text-xs text-secondary-text truncate">
                            {model.game.name}
                          </span>
                        )}
                        
                        {model.box?.name && (
                          <>
                            {model.game?.name && <span className="text-xs text-secondary-text">•</span>}
                            <span className="text-xs text-secondary-text truncate">
                              {model.box.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t border-border-custom flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}