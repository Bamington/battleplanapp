import React, { useState, useEffect } from 'react'
import { X, Calendar, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useRecentGames } from '../hooks/useRecentGames'
import { GameDropdown } from './GameDropdown'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface NewBattleModalProps {
  isOpen: boolean
  onClose: () => void
  onBattleCreated: () => void
}

export function NewBattleModal({ isOpen, onClose, onBattleCreated }: NewBattleModalProps) {
  const [datePlayed, setDatePlayed] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const { addRecentGame } = useRecentGames()

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchGames()
    }
  }, [isOpen])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, icon')
        .order('name')

      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
      setError('Failed to load games')
    }
  }

  const getFavoriteGames = () => {
    if (!user?.fav_games || user.fav_games.length === 0) return []
    return games.filter(game => user.fav_games?.includes(game.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!datePlayed) {
      setError('Date played is required')
      return
    }

    if (!opponentName.trim()) {
      setError('Opponent name is required')
      return
    }

    if (!selectedGame) {
      setError('Game is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedGameData = games.find(game => game.id === selectedGame)
      
      // Generate battle name: "[Game] against [Opponent]"
      const generatedBattleName = `${selectedGameData?.name || 'Unknown Game'} against ${opponentName.trim()}`
      
      const { error } = await supabase
        .from('battles')
        .insert({
          battle_name: generatedBattleName,
          date_played: datePlayed,
          opp_name: opponentName.trim(),
          game_name: selectedGameData?.name || '',
          game_uid: selectedGame,
          result: null, // Set result to null since we removed the dropdown
          user_id: user?.id // Add user_id for proper RLS isolation
        })

      if (error) throw error

      // Reset form
      setDatePlayed('')
      setOpponentName('')
      setSelectedGame('')
      
      // Close modal and trigger refresh
      onBattleCreated()
      onClose()
    } catch (error) {
      console.error('Error creating battle:', error)
      setError('Failed to create battle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId)
    // Add to recent games
    const selectedGameData = games.find(game => game.id === gameId)
    if (selectedGameData) {
      addRecentGame(selectedGameData)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 overflow-y-auto transition-all duration-300 ease-out transform
        fixed inset-0 sm:relative sm:inset-auto sm:max-w-lg sm:h-auto sm:rounded-lg sm:max-h-[90vh] h-screen w-screen sm:w-full overflow-y-auto rounded-none sm:rounded-lg p-6 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text font-overpass">
            Log New Battle
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Date Played */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="datePlayed" className="block text-sm font-medium text-input-label font-overpass">
                Date Played
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
              <input
                type="date"
                id="datePlayed"
                value={datePlayed}
                onChange={(e) => setDatePlayed(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
                disabled={loading}
              />
            </div>
          </div>

          {/* Opponent */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="opponentName" className="block text-sm font-medium text-input-label font-overpass">
                Opponent
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
              <input
                type="text"
                id="opponentName"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Enter opponent's name"
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
                disabled={loading}
              />
            </div>
          </div>

          {/* Game */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="game" className="block text-sm font-medium text-input-label font-overpass">
                Game
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <GameDropdown
              games={games}
              selectedGame={selectedGame}
              onGameSelect={handleGameSelect}
              placeholder="Choose a Game"
              favoriteGames={getFavoriteGames()}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Log Battle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
