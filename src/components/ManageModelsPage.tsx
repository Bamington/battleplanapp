import React, { useState, useEffect } from 'react'
import { ArrowLeft, Package, Edit, Filter, X, Search, Check, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useModels } from '../hooks/useModels'
import { useGames } from '../hooks/useGames'
import { EditModelModal } from './EditModelModal'
import { MultiSelectDropdown } from './MultiSelectDropdown'
import { GameDropdown } from './GameDropdown'
import { DeleteModelModal } from './DeleteModelModal'

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string | null
  game_id: string | null
  notes: string | null
  painted_date: string | null
  purchase_date: string | null
  created_at: string
  lore_name?: string | null
  lore_description?: string | null
  painting_notes?: string | null
  public?: boolean | null
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
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
}

interface ManageModelsPageProps {
  onBack: () => void
}

export function ManageModelsPage({ onBack }: ManageModelsPageProps) {
  const { models: basicModels, loading: basicLoading, error: basicError, refetch, clearCache: clearModelsCache } = useModels()
  const { games } = useGames()
  const [models, setModels] = useState<Model[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  
  // Filter states
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [selectedCollectionStatus, setSelectedCollectionStatus] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    model: Model | null
  }>({
    isOpen: false,
    model: null
  })

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    model: Model | null
  }>({
    isOpen: false,
    model: null
  })

  // Bulk selection state
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [bulkAssignGame, setBulkAssignGame] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchModelsWithDetails()
  }, [basicModels, basicLoading, basicError])

  // Apply filters whenever models or filter states change
  useEffect(() => {
    applyFilters()
  }, [models, selectedGames, selectedCollectionStatus, searchQuery])

  const fetchModelsWithDetails = async () => {
    // If still loading, keep loading state
    if (basicLoading) {
      setLoading(true)
      return
    }
    
    // If there's an error, show it
    if (basicError) {
      setError(basicError)
      setLoading(false)
      return
    }
    
    // Loading is complete, process the data
    try {
      // Get full model details with game and box info since the basic hook already includes it
      // We can use the basic models directly as they already have all the needed data
      setModels(basicModels)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...models]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.game?.name?.toLowerCase().includes(query) ||
        model.box?.name?.toLowerCase().includes(query) ||
        model.notes?.toLowerCase().includes(query)
      )
    }

    // Apply game filter
    if (selectedGames.length > 0) {
      filtered = filtered.filter(model => {
        const modelGameId = model.game?.id || model.box?.game?.id
        
        // Handle 'none' filter - models with no game assigned
        if (selectedGames.includes('none') && !modelGameId) {
          return true
        }
        
        // Handle other filters
        return selectedGames.includes(modelGameId || '')
      })
    }

    // Apply collection status filter
    if (selectedCollectionStatus.length > 0) {
      filtered = filtered.filter(model => {
        const isInCollection = !!model.box
        if (selectedCollectionStatus.includes('in-collection') && isInCollection) return true
        if (selectedCollectionStatus.includes('loose') && !isInCollection) return true
        return false
      })
    }

    setFilteredModels(filtered)
  }

  const clearFilters = () => {
    setSelectedGames([])
    setSelectedCollectionStatus([])
    setSearchQuery('')
  }

  const hasActiveFilters = selectedGames.length > 0 || selectedCollectionStatus.length > 0 || searchQuery.length > 0

  // Get available games with counts
  const getAvailableGames = () => {
    const gameCounts = new Map<string, { name: string; count: number }>()
    
    models.forEach(model => {
      const gameId = model.game?.id || model.box?.game?.id
      const gameName = model.game?.name || model.box?.game?.name
      
      if (gameName && gameId) {
        const current = gameCounts.get(gameId) || { name: gameName, count: 0 }
        current.count++
        gameCounts.set(gameId, current)
      }
    })
    
    return Array.from(gameCounts.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
  }

  const availableGames = getAvailableGames()

  // Get count of models with no game assigned
  const noGameCount = models.filter(model => !model.game?.id && !model.box?.game?.id).length

  // Find the 'Other' game from the database
  const otherGame = games.find(game => game.name.toLowerCase() === 'other')
  
  // Convert to MultiSelectDropdown format
  const gameOptions = [
    {
      id: 'none',
      name: `None (${noGameCount})`,
      icon: null
    },
    // Add the real 'Other' game from database if it exists
    ...(otherGame ? [{
      id: otherGame.id,
      name: (() => {
        const otherGameData = availableGames.find(game => game.id === otherGame.id)
        return otherGameData ? `Other (${otherGameData.count})` : 'Other'
      })(),
      icon: otherGame.icon || '/bp-unkown.svg'
    }] : []),
    ...availableGames.filter(game => game.id !== otherGame?.id).map(game => {
      const gameData = games.find(g => g.id === game.id)
      return {
        id: game.id,
        name: `${game.name} (${game.count})`,
        icon: gameData?.icon || null
      }
    })
  ]

  const collectionStatusOptions = [
    { id: 'in-collection', name: 'In Collection' },
    { id: 'loose', name: 'Loose Models' }
  ]

  const handleEditModel = (model: Model) => {
    setEditModal({
      isOpen: true,
      model
    })
  }

  const handleModelUpdated = async () => {
    // Clear caches first to ensure fresh data
    clearModelsCache()
    
    // Refetch data
    refetch() // Refetch the basic models data
    fetchModelsWithDetails() // Also refetch the detailed data
    setEditModal({ isOpen: false, model: null })
  }

  const handleDeleteModel = (model: Model) => {
    setDeleteModal({
      isOpen: true,
      model
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.model) return
    
    setDeleting(true)
    
    try {
      // Delete associated image from storage if it exists
      if (deleteModal.model.image_url && 
          typeof deleteModal.model.image_url === 'string' &&
          deleteModal.model.image_url.includes('supabase')) {
        // Extract the file path from the URL
        const urlParts = deleteModal.model.image_url.split('/')
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
        .eq('id', deleteModal.model.id)
      
      if (error) throw error
      
      // Close modal and refresh data
      setDeleteModal({ isOpen: false, model: null })
      clearModelsCache()
      refetch()
      fetchModelsWithDetails()
      
      // Clear selection if the deleted model was selected
      if (selectedModels.has(deleteModal.model.id)) {
        const newSelection = new Set(selectedModels)
        newSelection.delete(deleteModal.model.id)
        setSelectedModels(newSelection)
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      setError('Failed to delete model')
    } finally {
      setDeleting(false)
    }
  }

  // Bulk selection handlers
  const toggleModelSelection = (modelId: string) => {
    const newSelection = new Set(selectedModels)
    if (newSelection.has(modelId)) {
      newSelection.delete(modelId)
    } else {
      newSelection.add(modelId)
    }
    setSelectedModels(newSelection)
  }

  const toggleAllSelection = () => {
    if (selectedModels.size === filteredModels.length) {
      setSelectedModels(new Set())
    } else {
      setSelectedModels(new Set(filteredModels.map(m => m.id)))
    }
  }

  const clearSelection = () => {
    setSelectedModels(new Set())
    setBulkAssignGame('')
  }

  const handleBulkAssignGame = async () => {
    if (!bulkAssignGame || selectedModels.size === 0) return

    try {
      const selectedModelIds = Array.from(selectedModels)
      
      // Handle new game creation if needed
      let gameId = bulkAssignGame
      if (bulkAssignGame.startsWith('new:')) {
        const newGameName = bulkAssignGame.replace('new:', '')
        const { data: newGame, error: gameError } = await supabase
          .from('games')
          .insert({
            name: newGameName,
            official: false,
            supported: true
          })
          .select()
          .single()

        if (gameError) throw gameError
        gameId = newGame.id
      }

      // Update all selected models
      const { error } = await supabase
        .from('models')
        .update({ game_id: gameId === otherGame?.id ? null : gameId })
        .in('id', selectedModelIds)

      if (error) throw error

      // Clear selection and refresh data
      clearSelection()
      clearModelsCache()
      refetch()
      fetchModelsWithDetails()
    } catch (error) {
      console.error('Error assigning games:', error)
      setError('Failed to assign games to selected models')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={onBack}
              className="btn-ghost btn-with-icon"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-text">Manage Models</h1>
          </div>
          
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={onBack}
            className="btn-ghost btn-with-icon"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-bold text-text">Manage Models</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-bg-card rounded-lg border border-border-custom p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-icon" />
              <span className="text-lg font-semibold text-text">Filters</span>
              {hasActiveFilters && (
                <span className="bg-[var(--color-brand)] text-white text-xs px-2 py-1 rounded-full">
                  {selectedGames.length + selectedCollectionStatus.length + (searchQuery ? 1 : 0)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-secondary-text hover:text-text transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="text-sm text-secondary-text hover:text-text transition-colors"
              >
                {isFiltersExpanded ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>

          {isFiltersExpanded && (
            <>
              {/* Search Field */}
              <div className="mt-4 mb-4">
                <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                  Search Models
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by model name, game, collection, or notes..."
                    className="w-full pl-10 pr-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Game Filter */}
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Games
                  </label>
                  <MultiSelectDropdown
                    options={gameOptions}
                    selectedOptions={selectedGames}
                    onSelectionChange={setSelectedGames}
                    placeholder="Select games..."
                    maxSelections={10}
                    searchable={true}
                    type="game"
                  />
                </div>

                {/* Collection Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Collection Status
                  </label>
                  <MultiSelectDropdown
                    options={collectionStatusOptions}
                    selectedOptions={selectedCollectionStatus}
                    onSelectionChange={setSelectedCollectionStatus}
                    placeholder="Select status..."
                    maxSelections={2}
                    searchable={false}
                    type="game"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Results counter and bulk actions */}
        {!loading && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-secondary-text">
              Showing {filteredModels.length} of {models.length} models
              {hasActiveFilters && ' (filtered)'}
              {selectedModels.size > 0 && (
                <span className="ml-2 text-brand font-medium">
                  • {selectedModels.size} selected
                </span>
              )}
            </p>
            
            {selectedModels.size > 0 && (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <GameDropdown
                    games={games}
                    selectedGame={bulkAssignGame}
                    onGameSelect={setBulkAssignGame}
                    placeholder="Select game to assign"
                  />
                  <button
                    onClick={handleBulkAssignGame}
                    disabled={!bulkAssignGame}
                    className="btn-primary btn-with-icon disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    <span>Assign to {selectedModels.size}</span>
                  </button>
                </div>
                <button
                  onClick={clearSelection}
                  className="text-sm text-secondary-text hover:text-text transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {/* Select all checkbox */}
        {filteredModels.length > 0 && (
          <div className="mb-4 flex items-center space-x-3 px-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedModels.size === filteredModels.length && filteredModels.length > 0}
                onChange={toggleAllSelection}
                className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2"
              />
              <span className="text-sm text-secondary-text">
                Select all {filteredModels.length} models
              </span>
            </label>
          </div>
        )}

        <div className="space-y-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => toggleModelSelection(model.id)}
              className={`bg-bg-card border rounded-lg p-6 flex items-center justify-between gap-6 transition-colors cursor-pointer ${
                selectedModels.has(model.id) 
                  ? 'border-brand bg-brand/5' 
                  : 'border-border-custom hover:border-brand/50'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedModels.has(model.id)}
                    onChange={() => {}} // Handled by row click
                    className="w-4 h-4 text-brand bg-bg-primary border-border-custom rounded focus:ring-brand focus:ring-2 pointer-events-none"
                  />
                </div>
                {model.image_url ? (
                  <img
                    src={model.image_url}
                    alt={`${model.name} image`}
                    className="w-12 h-12 object-cover rounded"
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
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: model.image_url ? 'none' : 'flex' }}>
                  <span className="text-white text-sm font-bold">{model.name.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-text truncate">{model.name}</h3>
                  <div className="flex items-center space-x-4 text-sm text-secondary-text">
                    <span>
                      {model.game?.name || 'No game'}
                    </span>
                    {model.box && (
                      <>
                        <span>•</span>
                        <span>Box: {model.box.name}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Status: {model.status || 'None'}</span>
                    <span>•</span>
                    <span>Count: {model.count}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDeleteModel(model)}
                  className="btn-danger-sm btn-with-icon-sm"
                  title="Delete model"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEditModel(model)}
                  className="btn-secondary-sm btn-with-icon-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredModels.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-icon mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">
              {hasActiveFilters ? 'No Models Match Your Filters' : 'No Models Found'}
            </h3>
            <p className="text-secondary-text">
              {hasActiveFilters 
                ? 'Try adjusting your filters or clearing them to see all models.'
                : 'You haven\'t added any models yet. Start by adding your first model to your collection.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 btn-primary btn-with-icon"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        )}

        {editModal.isOpen && editModal.model && (
          <EditModelModal
            isOpen={editModal.isOpen}
            onClose={() => setEditModal({ isOpen: false, model: null })}
            model={editModal.model}
            onModelUpdated={handleModelUpdated}
          />
        )}

        {deleteModal.isOpen && deleteModal.model && (
          <DeleteModelModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, model: null })}
            onConfirm={handleDeleteConfirm}
            modelName={deleteModal.model.name}
            loading={deleting}
          />
        )}
      </div>
    </div>
  )
}
