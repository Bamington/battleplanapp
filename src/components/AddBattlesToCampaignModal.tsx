import React, { useState, useEffect } from 'react'
import { X, Sword, Check, Search, Calendar, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatLocalDate } from '../utils/timezone'
import { Tables } from '../lib/database.types'

type Campaign = Tables<'campaigns'>
type Battle = Tables<'battles'>

interface AddBattlesToCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onBattlesAdded: () => void
  campaign: Campaign
}

export function AddBattlesToCampaignModal({ isOpen, onClose, onBattlesAdded, campaign }: AddBattlesToCampaignModalProps) {
  const [battles, setBattles] = useState<Battle[]>([])
  const [selectedBattles, setSelectedBattles] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user && campaign) {
      fetchBattles()
    }
  }, [isOpen, user, campaign?.id])

  const fetchBattles = async () => {
    try {
      setLoading(true)
      if (!user?.id) return

      // Test if campaign_id column exists and get battles not in any campaign
      const { data: allBattles, error: battlesError } = await supabase
        .from('battles')
        .select('*')
        .eq('user_id', user.id)
        .is('campaign_id', null)
        .order('date_played', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })

      if (battlesError) {
        console.error('Error fetching battles with campaign_id filter:', battlesError)
        // If campaign_id doesn't exist, fall back to getting all battles
        const { data: fallbackBattles, error: fallbackError } = await supabase
          .from('battles')
          .select('*')
          .eq('user_id', user.id)
          .order('date_played', { ascending: false, nullsLast: true })
          .order('created_at', { ascending: false })

        if (fallbackError) throw fallbackError
        setBattles(fallbackBattles || [])
        setError('campaign_id column not found - showing all battles')
      } else {
        setBattles(allBattles || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch battles')
    } finally {
      setLoading(false)
    }
  }

  const handleBattleToggle = (battleId: number) => {
    setSelectedBattles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(battleId)) {
        newSet.delete(battleId)
      } else {
        newSet.add(battleId)
      }
      return newSet
    })
  }

  const handleAddBattles = async () => {
    if (selectedBattles.size === 0 || !campaign) return

    setAdding(true)
    setError(null)

    try {
      const battleIds = Array.from(selectedBattles)

      // Try to update battles to assign them to this campaign
      const { error } = await supabase
        .from('battles')
        .update({ campaign_id: campaign.id })
        .in('id', battleIds)

      if (error) {
        console.error('Error adding battles to campaign:', error)
        setError(`Failed to add battles to campaign: ${error.message}`)
        return
      }

      // Success! Close modal and refresh
      onBattlesAdded()
      onClose()
      setSelectedBattles(new Set())
    } catch (err) {
      console.error('Error in handleAddBattles:', err)
      setError(err instanceof Error ? err.message : 'Failed to add battles to campaign')
    } finally {
      setAdding(false)
    }
  }

  const getResultColor = (result: string) => {
    switch (result) {
      case 'Win': return 'text-green-500'
      case 'Loss': return 'text-red-500'
      case 'Draw': return 'text-yellow-500'
      default: return 'text-secondary-text'
    }
  }

  // Filter battles by search query
  const filteredBattles = battles.filter(battle => {
    const searchLower = searchQuery.toLowerCase()
    const battleNameMatch = battle.battle_name?.toLowerCase().includes(searchLower) || false
    const gameMatch = battle.game_name?.toLowerCase().includes(searchLower) || false
    const opponentMatch = battle.opp_name?.toLowerCase().includes(searchLower) || false
    return battleNameMatch || gameMatch || opponentMatch
  })

  if (!isOpen || !campaign) return null

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
          <h2 className="text-lg font-bold text-title">Add Battles to Campaign: {campaign?.name || 'Unknown Campaign'}</h2>
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
              <p className="text-secondary-text">Loading battles...</p>
            </div>
          ) : battles.length === 0 ? (
            <div className="text-center py-8">
              <Sword className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <p className="text-secondary-text mb-4">No battles found.</p>
              <p className="text-sm text-secondary-text">Create some battles first to add them to campaigns.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-secondary-text mb-4">
                Select battles to add to this campaign. Note: Campaign-battle association requires a database migration to be fully functional.
              </p>

              {/* Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by battle name, game, or opponent..."
                  className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] text-sm bg-bg-primary text-text"
                />
              </div>

              {/* No search results */}
              {searchQuery && filteredBattles.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                  <p className="text-secondary-text mb-2">No battles found matching "{searchQuery}"</p>
                  <p className="text-sm text-secondary-text">Try adjusting your search or clear the search to see all battles.</p>
                </div>
              )}

              {/* Battles List */}
              {filteredBattles.length > 0 && (
                <div className="space-y-2 mb-6">
                  {filteredBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className="flex items-center space-x-3 p-4 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleBattleToggle(battle.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedBattles.has(battle.id)
                            ? 'bg-brand border-[var(--color-brand)] text-white'
                            : 'border-border-custom hover:border-[var(--color-brand)]'
                        }`}
                      >
                        {selectedBattles.has(battle.id) && <Check className="w-3 h-3" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text truncate mb-1">
                          {battle.battle_name || 'Untitled Battle'}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-secondary-text">
                          {battle.date_played && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatLocalDate(battle.date_played, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {battle.game_name && (
                            <span className="text-brand font-medium">{battle.game_name}</span>
                          )}
                          {battle.opp_name && (
                            <span>vs {battle.opp_name}</span>
                          )}
                          {battle.result && (
                            <div className="flex items-center space-x-1">
                              <Trophy className="w-3 h-3" />
                              <span className={`font-medium ${getResultColor(battle.result)}`}>
                                {battle.result}
                              </span>
                            </div>
                          )}
                        </div>
                        {battle.battle_notes && (
                          <p className="text-xs text-secondary-text mt-1 line-clamp-1">
                            {battle.battle_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t border-border-custom flex-shrink-0">
          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={adding}
              className="btn-ghost btn-flex"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBattles}
              disabled={selectedBattles.size === 0 || adding}
              className="btn-primary btn-flex"
            >
              {adding ? 'Adding...' : `Add ${selectedBattles.size} Battle${selectedBattles.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}