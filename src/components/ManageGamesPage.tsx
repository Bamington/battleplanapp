import React, { useState, useEffect } from 'react'
import { ArrowLeft, Gamepad2, Edit, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useGames } from '../hooks/useGames'
import { useGameIcons } from '../hooks/useGameIcons'
import { EditGameModal } from './EditGameModal'
import { AddNewGameModal } from './AddNewGameModal'
import { DeleteGameModal } from './DeleteGameModal'
import { Button } from './Button'


interface ManageGamesPageProps {
  onBack: () => void
}

export function ManageGamesPage({ onBack }: ManageGamesPageProps) {
  const { games: basicGames, loading: basicLoading, error: basicError, refetch, clearCache: clearGamesCache, createGame, deleteGame } = useGames()
  const { refreshCache: refreshGameIconsCache } = useGameIcons()
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    game: Game | null
  }>({
    isOpen: false,
    game: null
  })
  const [addModal, setAddModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    game: Game | null
  }>({
    isOpen: false,
    game: null
  })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchGamesWithManufacturer()
  }, [basicGames])

  const fetchGamesWithManufacturer = async () => {
    if (!basicGames.length && basicLoading) {
      setLoading(true)
      return
    }
    
    if (basicError) {
      setError(basicError)
      setLoading(false)
      return
    }
    
    try {
      // Get full game details with manufacturer info and model counts
      // We need to count models both directly assigned to the game AND models in boxes assigned to the game
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          manufacturer:manufacturers(name),
          direct_models:models(count),
          box_models:boxes(
            model_boxes(
              model:models(count)
            )
          )
        `)
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
      setError(err instanceof Error ? err.message : 'Failed to fetch games')
    } finally {
      setLoading(false)
    }
  }

  const handleEditGame = (game: Game) => {
    setEditModal({
      isOpen: true,
      game
    })
  }

  const handleGameUpdated = async () => {
    // Clear caches first to ensure fresh data
    clearGamesCache()
    await refreshGameIconsCache()
    
    // Refetch data
    refetch() // Refetch the basic games data
    fetchGamesWithManufacturer() // Also refetch the detailed data
    setEditModal({ isOpen: false, game: null })
  }

  const handleGameCreated = async (newGame: any) => {
    // Clear caches first to ensure fresh data
    clearGamesCache()
    await refreshGameIconsCache()
    
    // Refetch data
    refetch() // Refetch the basic games data
    fetchGamesWithManufacturer() // Also refetch the detailed data
    setAddModal(false)
  }

  const handleDeleteGame = (game: Game) => {
    setDeleteModal({ isOpen: true, game })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.game) return
    
    setDeleting(true)
    try {
      await deleteGame(deleteModal.game.id)
      
      // Clear caches and refetch data
      clearGamesCache()
      await refreshGameIconsCache()
      refetch()
      fetchGamesWithManufacturer()
      
      setDeleteModal({ isOpen: false, game: null })
    } catch (err) {
      console.error('Error deleting game:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete game')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border---color-brand mx-auto mb-4"></div>
          <p className="text-base text-secondary-text">Loading games...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>
        <h1 className="text-4xl font-bold text-title">MANAGE GAMES</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Add New Game Button */}
      <div className="mb-6">
        <Button
          variant="primary"
          withIcon
          onClick={() => setAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Game</span>
        </Button>
      </div>

      <div className="space-y-4">
        {games.map((game) => (
          <div
            key={game.id}
            className="bg-bg-card border border-border-custom rounded-lg p-6 flex items-center justify-between gap-6"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {game.icon ? (
                <img
                  src={game.icon}
                  alt={`${game.name} icon`}
                  className="w-12 h-12 object-contain rounded"
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
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: game.icon ? 'none' : 'flex' }}>
                <span className="text-white text-sm font-bold">{game.name.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-text truncate">{game.name}</h3>
                <p className="text-sm text-secondary-text">
                  {game.manufacturer?.name || 'No manufacturer'}
                </p>
                <p className="text-xs text-secondary-text mt-1">
                  {game.total_models_count || 0} {game.total_models_count === 1 ? 'model' : 'models'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary-sm"
                size="small"
                withIcon
                onClick={() => handleEditGame(game)}
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Button>
              <Button
                variant="danger-sm"
                size="small"
                withIcon
                onClick={() => handleDeleteGame(game)}
                title="Delete Game"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {games.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-base text-secondary-text">No games found.</p>
        </div>
      )}

      <EditGameModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, game: null })}
        onGameUpdated={handleGameUpdated}
        game={editModal.game}
      />

      <AddNewGameModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onGameCreated={handleGameCreated}
      />

      <DeleteGameModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, game: null })}
        onConfirm={handleDeleteConfirm}
        gameName={deleteModal.game?.name || ''}
        loading={deleting}
      />
    </div>
  )
}