import React, { useState, useEffect } from 'react'
import { Gamepad2, Edit, Plus, Trash2, Image, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useGames } from '../hooks/useGames'
import { useGameIcons } from '../hooks/useGameIcons'
import { useAuth } from '../hooks/useAuth'
import { useHasCustomGames } from '../hooks/useHasCustomGames'
import { Button } from './Button'
import { compressImage, isValidImageFile } from '../utils/imageCompression'

interface Game {
  id: string
  name: string
  icon: string | null
  created_by: string | null
  supported: boolean
  total_models_count?: number
}

interface CustomGamesPageProps {
  // This component will be embedded in the main app structure
}

export function CustomGamesPage({}: CustomGamesPageProps) {
  const { games: basicGames, loading: basicLoading, error: basicError, refetch, createGame, deleteGame } = useGames()
  const { refreshCache: refreshGameIconsCache } = useGameIcons()
  const { user } = useAuth()
  const { refresh: refreshHasCustomGames } = useHasCustomGames()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  
  // Form states
  const [newGameName, setNewGameName] = useState('')
  const [newGameIcon, setNewGameIcon] = useState<File | null>(null)
  const [editGameName, setEditGameName] = useState('')
  const [editGameIcon, setEditGameIcon] = useState<File | null>(null)
  
  // Loading states
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploadingIcon, setUploadingIcon] = useState(false)

  useEffect(() => {
    fetchCustomGames()
  }, [basicGames, user])

  const fetchCustomGames = async () => {
    if (!user || (!basicGames.length && basicLoading)) {
      setLoading(true)
      return
    }
    
    if (basicError) {
      setError(basicError)
      setLoading(false)
      return
    }
    
    try {
      // Get full game details with model counts for games created by the current user
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          direct_models:models(count),
          box_models:boxes(
            model_boxes(
              model:models(count)
            )
          )
        `)
        .eq('created_by', user.id)
        .order('name')

      if (error) throw error
      
      // Process the data to calculate total model counts
      const gamesWithCounts = (data || []).map(game => {
        // Count models directly assigned to this game
        const directModelsCount = game.direct_models?.reduce((sum: number, model: any) => sum + (model.count || 1), 0) || 0
        
        // Count models in boxes assigned to this game (using junction table)
        const boxModelsCount = game.box_models?.reduce((sum: number, box: any) => {
          const modelBoxes = box.model_boxes || []
          const boxModelCount = modelBoxes.reduce((boxSum: number, modelBox: any) => {
            const modelCount = modelBox.model?.count || 1
            return boxSum + modelCount
          }, 0)
          return sum + boxModelCount
        }, 0) || 0
        
        const totalModelsCount = directModelsCount + boxModelsCount
        
        return {
          ...game,
          total_models_count: totalModelsCount
        }
      })
      
      setGames(gamesWithCounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch custom games')
    } finally {
      setLoading(false)
    }
  }

  const uploadGameIcon = async (file: File, gameId: string): Promise<string | null> => {
    if (!user) return null

    setUploadingIcon(true)
    try {
      // Compress the image first
      const compressedFile = await compressImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.9
      })

      const fileName = `${gameId}_${Date.now()}.webp`
      const filePath = `game-icons/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('game-icons')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('game-icons')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading game icon:', error)
      throw error
    } finally {
      setUploadingIcon(false)
    }
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGameName.trim()) return

    setCreating(true)
    try {
      // Create the game first
      const newGame = await createGame(newGameName.trim())
      
      // Upload icon if provided
      let iconUrl = null
      if (newGameIcon) {
        iconUrl = await uploadGameIcon(newGameIcon, newGame.id)
        
        // Update the game with the icon URL
        const { error: updateError } = await supabase
          .from('games')
          .update({ icon: iconUrl })
          .eq('id', newGame.id)
          
        if (updateError) throw updateError
      }

      // Refresh the games cache and refetch
      await refreshGameIconsCache()
      await refetch()
      await fetchCustomGames()
      
      // Refresh navigation visibility
      refreshHasCustomGames()

      // Reset form
      setNewGameName('')
      setNewGameIcon(null)
      setAddModalOpen(false)
    } catch (error) {
      console.error('Error creating game:', error)
      setError(error instanceof Error ? error.message : 'Failed to create game')
    } finally {
      setCreating(false)
    }
  }

  const handleEditGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGame || !editGameName.trim()) return

    setUpdating(true)
    try {
      let iconUrl = selectedGame.icon

      // Upload new icon if provided
      if (editGameIcon) {
        iconUrl = await uploadGameIcon(editGameIcon, selectedGame.id)
      }

      // Update the game
      const { error: updateError } = await supabase
        .from('games')
        .update({ 
          name: editGameName.trim(),
          icon: iconUrl
        })
        .eq('id', selectedGame.id)
        
      if (updateError) throw updateError

      // Refresh the games cache and refetch
      await refreshGameIconsCache()
      await refetch()
      await fetchCustomGames()
      
      // Refresh navigation visibility
      refreshHasCustomGames()

      // Reset form
      setEditGameName('')
      setEditGameIcon(null)
      setSelectedGame(null)
      setEditModalOpen(false)
    } catch (error) {
      console.error('Error updating game:', error)
      setError(error instanceof Error ? error.message : 'Failed to update game')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteGame = async () => {
    if (!selectedGame) return

    setDeleting(true)
    try {
      // Delete the icon from storage if it exists
      if (selectedGame.icon) {
        const iconPath = selectedGame.icon.split('/').pop()
        if (iconPath) {
          await supabase.storage
            .from('game-icons')
            .remove([`game-icons/${iconPath}`])
        }
      }

      // Delete the game
      await deleteGame(selectedGame.id)

      // Refresh the games cache and refetch
      await refreshGameIconsCache()
      await fetchCustomGames()
      
      // Refresh navigation visibility (might hide navigation if this was the last game)
      refreshHasCustomGames()

      // Reset form
      setSelectedGame(null)
      setDeleteModalOpen(false)
    } catch (error) {
      console.error('Error deleting game:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete game')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (game: Game) => {
    setSelectedGame(game)
    setEditGameName(game.name)
    setEditGameIcon(null)
    setEditModalOpen(true)
  }

  const openDeleteModal = (game: Game) => {
    setSelectedGame(game)
    setDeleteModalOpen(true)
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-base text-secondary-text">Please sign in to manage your custom games</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-3 bg-brand/10 rounded-full">
            <Gamepad2 className="w-8 h-8 text-brand" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-title mb-2">Custom Games</h1>
        <p className="text-secondary-text max-w-2xl mx-auto">
          Create and manage your own custom games with personalized icons. These games will appear in your dropdowns when adding models and collections.
        </p>
      </div>

      {/* Add New Game Button */}
      <div className="flex justify-center mb-8">
        <Button
          onClick={() => setAddModalOpen(true)}
          variant="primary"
          icon={Plus}
        >
          Add Custom Game
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Games List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-bg-card rounded-lg shadow-sm border border-border-custom p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-secondary-text opacity-20 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary-text opacity-20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-secondary-text opacity-20 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-8 bg-secondary-text opacity-20 rounded"></div>
            </div>
          ))}
        </div>
      ) : games.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-secondary-text mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-title mb-2">No Custom Games Yet</h3>
          <p className="text-secondary-text mb-6">
            Create your first custom game to get started. You can add a custom icon to make it truly yours!
          </p>
          <Button
            onClick={() => setAddModalOpen(true)}
            variant="primary"
            icon={Plus}
          >
            Create Your First Game
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-bg-card rounded-lg shadow-sm border border-border-custom p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-secondary flex items-center justify-center">
                  {game.icon ? (
                    <img
                      src={game.icon}
                      alt={`${game.name} icon`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<div class="w-6 h-6 bg-brand rounded-full flex items-center justify-center"><span class="text-white text-xs font-bold">${game.name.charAt(0)}</span></div>`
                        }
                      }}
                    />
                  ) : (
                    <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{game.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-title truncate">{game.name}</h3>
                  <p className="text-sm text-secondary-text">
                    {game.total_models_count || 0} model{(game.total_models_count || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => openEditModal(game)}
                  variant="ghost"
                  size="small"
                  icon={Edit}
                >
                  Edit
                </Button>
                <Button
                  onClick={() => openDeleteModal(game)}
                  variant="ghost"
                  size="small"
                  icon={Trash2}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Game Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-modal-bg rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-custom flex-shrink-0">
              <h2 className="text-xl font-bold text-title">Add Custom Game</h2>
              <button
                onClick={() => {
                  setAddModalOpen(false)
                  setNewGameName('')
                  setNewGameIcon(null)
                }}
                className="text-secondary-text hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <form onSubmit={handleCreateGame} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Game Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="newGameName" className="block text-sm font-medium text-input-label font-overpass">
                    Game Name
                  </label>
                  <span className="text-sm text-gray-500">Required</span>
                </div>
                <input
                  type="text"
                  id="newGameName"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Enter game name..."
                  className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
                  required
                />
              </div>

              {/* Game Icon Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-input-label font-overpass">
                    Game Icon
                  </label>
                  <span className="text-sm text-gray-500">Optional</span>
                </div>
                
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-border-custom rounded-lg p-6 text-center hover:border-[var(--color-brand)] transition-colors">
                  {newGameIcon ? (
                    /* New icon selected */
                    <div className="space-y-4">
                      <div className="relative mx-auto w-32 h-32">
                        <img
                          src={URL.createObjectURL(newGameIcon)}
                          alt="New game icon"
                          className="w-full h-full object-cover rounded-lg border-2 border-[var(--color-brand)]"
                        />
                        <button
                          type="button"
                          onClick={() => setNewGameIcon(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-text font-medium">Icon selected</p>
                      <p className="text-xs text-secondary-text">{newGameIcon.name}</p>
                    </div>
                  ) : (
                    /* No icon - upload area */
                    <div className="space-y-4">
                      <div className="mx-auto w-32 h-32 bg-bg-secondary rounded-lg flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-gray-500" />
                        </div>
                      </div>
                      <p className="text-sm text-secondary-text">Upload an icon for your game</p>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && isValidImageFile(file)) {
                              setNewGameIcon(file)
                            } else if (file) {
                              setError('Please select a valid image file (PNG, JPG, or WebP)')
                              e.target.value = ''
                            }
                          }}
                          className="hidden"
                          id="new-icon-upload"
                        />
                        <label
                          htmlFor="new-icon-upload"
                          className="inline-flex items-center px-4 py-2 bg-bg-secondary text-text border border-border-custom rounded-lg hover:bg-bg-primary transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Icon
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-secondary-text mt-2">
                  Square images work best. Will be automatically resized to 256x256px.
                </p>
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="flex space-x-3 p-6 pt-4 border-t border-border-custom flex-shrink-0">
              <Button
                onClick={handleCreateGame}
                variant="primary"
                disabled={creating || !newGameName.trim()}
                loading={creating}
              >
                Create Game
              </Button>
              <Button
                onClick={() => {
                  setAddModalOpen(false)
                  setNewGameName('')
                  setNewGameIcon(null)
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Game Modal */}
      {editModalOpen && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-modal-bg rounded-lg max-w-lg w-full max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-custom flex-shrink-0">
              <h2 className="text-xl font-bold text-title">Edit Game</h2>
              <button
                onClick={() => {
                  setEditModalOpen(false)
                  setEditGameName('')
                  setEditGameIcon(null)
                  setSelectedGame(null)
                }}
                className="text-secondary-text hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <form onSubmit={handleEditGame} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Game Name */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="editGameName" className="block text-sm font-medium text-input-label font-overpass">
                    Game Name
                  </label>
                  <span className="text-sm text-gray-500">Required</span>
                </div>
                <input
                  type="text"
                  id="editGameName"
                  value={editGameName}
                  onChange={(e) => setEditGameName(e.target.value)}
                  placeholder="Enter game name..."
                  className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
                  required
                />
              </div>

              {/* Game Icon Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-input-label font-overpass">
                    Game Icon
                  </label>
                  <span className="text-sm text-gray-500">Optional</span>
                </div>
                
                {/* Image Upload Area */}
                <div className="border-2 border-dashed border-border-custom rounded-lg p-6 text-center hover:border-[var(--color-brand)] transition-colors">
                  {editGameIcon ? (
                    /* New icon selected */
                    <div className="space-y-4">
                      <div className="relative mx-auto w-32 h-32">
                        <img
                          src={URL.createObjectURL(editGameIcon)}
                          alt="New game icon"
                          className="w-full h-full object-cover rounded-lg border-2 border-[var(--color-brand)]"
                        />
                        <button
                          type="button"
                          onClick={() => setEditGameIcon(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-text font-medium">New icon selected</p>
                      <p className="text-xs text-secondary-text">{editGameIcon.name}</p>
                    </div>
                  ) : selectedGame.icon ? (
                    /* Current icon display */
                    <div className="space-y-4">
                      <div className="mx-auto w-32 h-32">
                        <img
                          src={selectedGame.icon}
                          alt="Current game icon"
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-bg-secondary rounded-lg flex items-center justify-center"><div class="w-16 h-16 bg-brand rounded-full flex items-center justify-center"><span class="text-white text-2xl font-bold">${selectedGame.name.charAt(0)}</span></div></div>`
                            }
                          }}
                        />
                      </div>
                      <p className="text-sm text-secondary-text">Current icon</p>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && isValidImageFile(file)) {
                              setEditGameIcon(file)
                            } else if (file) {
                              setError('Please select a valid image file (PNG, JPG, or WebP)')
                              e.target.value = ''
                            }
                          }}
                          className="hidden"
                          id="edit-icon-upload"
                        />
                        <label
                          htmlFor="edit-icon-upload"
                          className="inline-flex items-center px-4 py-2 bg-bg-secondary text-text border border-border-custom rounded-lg hover:bg-bg-primary transition-colors cursor-pointer"
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Replace Icon
                        </label>
                      </div>
                    </div>
                  ) : (
                    /* No icon - upload area */
                    <div className="space-y-4">
                      <div className="mx-auto w-32 h-32 bg-bg-secondary rounded-lg flex items-center justify-center">
                        <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl font-bold">{selectedGame.name.charAt(0)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-secondary-text">No icon set</p>
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file && isValidImageFile(file)) {
                              setEditGameIcon(file)
                            } else if (file) {
                              setError('Please select a valid image file (PNG, JPG, or WebP)')
                              e.target.value = ''
                            }
                          }}
                          className="hidden"
                          id="edit-icon-upload"
                        />
                        <label
                          htmlFor="edit-icon-upload"
                          className="inline-flex items-center px-4 py-2 bg-bg-secondary text-text border border-border-custom rounded-lg hover:bg-bg-primary transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Icon
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-secondary-text mt-2">
                  Square images work best. Will be automatically resized to 256x256px.
                </p>
              </div>
            </form>

            {/* Fixed Footer */}
            <div className="flex space-x-3 p-6 pt-4 border-t border-border-custom flex-shrink-0">
              <Button
                onClick={handleEditGame}
                variant="primary"
                disabled={updating || !editGameName.trim()}
                loading={updating}
              >
                Update Game
              </Button>
              <Button
                onClick={() => {
                  setEditModalOpen(false)
                  setEditGameName('')
                  setEditGameIcon(null)
                  setSelectedGame(null)
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Game Modal */}
      {deleteModalOpen && selectedGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-title mb-4">Delete Game</h2>
            
            <p className="text-text mb-6">
              Are you sure you want to delete "{selectedGame.name}"? 
              {(selectedGame.total_models_count || 0) > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This game has {selectedGame.total_models_count} model{selectedGame.total_models_count !== 1 ? 's' : ''} associated with it.
                </span>
              )}
            </p>

            <div className="flex space-x-3">
              <Button
                onClick={handleDeleteGame}
                variant="primary"
                disabled={deleting}
                loading={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Game
              </Button>
              <Button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setSelectedGame(null)
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}