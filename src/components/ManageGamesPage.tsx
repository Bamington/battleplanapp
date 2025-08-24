import React, { useState, useEffect } from 'react'
import { ArrowLeft, Gamepad2, Edit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { EditGameModal } from './EditGameModal'

interface Game {
  id: string
  name: string
  manufacturer_id: string | null
  image: string | null
  icon: string | null
  created_at: string
  manufacturer?: {
    name: string
  }
}

interface ManageGamesPageProps {
  onBack: () => void
}

export function ManageGamesPage({ onBack }: ManageGamesPageProps) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    game: Game | null
  }>({
    isOpen: false,
    game: null
  })

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          manufacturer:manufacturers(name)
        `)
        .order('name')

      if (error) throw error
      setGames(data || [])
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

  const handleGameUpdated = () => {
    fetchGames()
    setEditModal({ isOpen: false, game: null })
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
              </div>
            </div>
            
            <button
              onClick={() => handleEditGame(game)}
              className="btn-secondary-sm btn-with-icon-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
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
    </div>
  )
}