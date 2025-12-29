import React, { useState } from 'react'
import { X, ClipboardList } from 'lucide-react'
import { useLists } from '../hooks/useLists'
import { useGames } from '../hooks/useGames'
import { GameDropdown } from './GameDropdown'
import { validateListName } from '../utils/listUtils'

interface NewListModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewListModal({ isOpen, onClose }: NewListModalProps) {
  const { createList } = useLists()
  const { games } = useGames()
  const [formData, setFormData] = useState({
    name: '',
    game_id: '',
    description: '',
    points_limit: ''
  })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameError = validateListName(formData.name)
    if (nameError) {
      setError(nameError)
      return
    }

    setCreating(true)
    setError(null)

    try {
      const result = await createList({
        name: formData.name.trim(),
        game_id: formData.game_id || null,
        description: formData.description.trim() || null,
        points_limit: formData.points_limit ? parseInt(formData.points_limit) : null
      })

      if (result) {
        // Reset form
        setFormData({
          name: '',
          game_id: '',
          description: '',
          points_limit: ''
        })
        onClose()
      } else {
        setError('Failed to create list')
      }
    } catch (err) {
      setError('An error occurred while creating the list')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      game_id: '',
      description: '',
      points_limit: ''
    })
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ClipboardList className="w-6 h-6 text-icon" />
            <h2 className="text-lg font-bold text-title">Create New List</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              List Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g., Tournament 2000pts"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Game
            </label>
            <GameDropdown
              selectedGame={formData.game_id}
              onGameSelect={(gameId) => setFormData({ ...formData, game_id: gameId })}
              games={games}
              placeholder="Select a game (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Points Limit
            </label>
            <input
              type="number"
              value={formData.points_limit}
              onChange={(e) => setFormData({ ...formData, points_limit: e.target.value })}
              className="input-field"
              placeholder="e.g., 2000"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Optional notes about this list..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
