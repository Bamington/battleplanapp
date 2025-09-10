import React, { useState } from 'react'
import { X, Plus, Upload } from 'lucide-react'
import { useGames } from '../hooks/useGames'

interface AddNewGameModalProps {
  isOpen: boolean
  onClose: () => void
  onGameCreated: (game: { id: string; name: string; icon: string | null }) => void
}

export function AddNewGameModal({ isOpen, onClose, onGameCreated }: AddNewGameModalProps) {
  const [gameName, setGameName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const { createGame, refetch: refetchGames } = useGames()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gameName.trim()) {
      setError('Game name is required')
      return
    }

    setCreating(true)
    setError('')

    try {
      const newGame = await createGame(gameName.trim())
      
      // Ensure all components see the new game immediately
      await refetchGames()
      
      onGameCreated(newGame)
      setGameName('')
      onClose()
    } catch (err) {
      console.error('Error creating game:', err)
      setError('Failed to create game. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleClose = () => {
    setGameName('')
    setError('')
    onClose()
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-modal-bg rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-title">Add New Game</h2>
          <button
            onClick={handleClose}
            className="text-secondary-text hover:text-text"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-input-label font-overpass mb-2">
              Game Name
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="Enter game name..."
              className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={creating}
              className="btn-ghost btn-flex"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !gameName.trim()}
              className="btn-primary btn-flex"
            >
              {creating ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Game
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}