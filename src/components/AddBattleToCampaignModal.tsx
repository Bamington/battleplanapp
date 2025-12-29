import React, { useState, useEffect } from 'react'
import { X, Flag, Check, Search, Plus, Calendar, MapPin } from 'lucide-react'
import { NewCampaignModal } from './NewCampaignModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatLocalDate } from '../utils/timezone'
import { Tables } from '../lib/database.types'

type Campaign = Tables<'campaigns'>

interface AddBattleToCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onBattleAddedToCampaign: () => void
  battle: {
    id: number
    battle_name: string | null
  } | null
}

export function AddBattleToCampaignModal({
  isOpen,
  onClose,
  onBattleAddedToCampaign,
  battle
}: AddBattleToCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user && battle) {
      fetchCampaigns()
    }
  }, [isOpen, user, battle?.id])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      if (!user?.id) return

      // Get all campaigns for the user
      const { data: allCampaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', user.id)
        .order('start_date', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      setCampaigns(allCampaigns || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns')
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(selectedCampaign === campaignId ? null : campaignId)
  }

  const handleAddToCampaign = async (campaignId?: string) => {
    const targetCampaignId = campaignId || selectedCampaign
    if (!targetCampaignId || !battle) return

    setAdding(true)
    setError(null)

    try {
      // Update battle to assign it to the selected campaign
      const { error } = await supabase
        .from('battles')
        .update({ campaign_id: targetCampaignId })
        .eq('id', battle.id)

      if (error) {
        console.error('Error adding battle to campaign:', error)
        setError(`Failed to add battle to campaign: ${error.message}`)
        return
      }

      // Success! Close modal and refresh
      onBattleAddedToCampaign()
      onClose()
      setSelectedCampaign(null)
    } catch (err) {
      console.error('Error in handleAddToCampaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to add battle to campaign')
    } finally {
      setAdding(false)
    }
  }

  const handleNewCampaignCreated = async () => {
    // Refresh campaigns list to include the newly created campaign
    await fetchCampaigns()
    setShowNewCampaignModal(false)

    // Get the most recently created campaign (should be the one just created)
    // We'll refetch campaigns to get the latest data
    try {
      const { data: latestCampaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (latestCampaigns && latestCampaigns.length > 0) {
        const newCampaign = latestCampaigns[0]
        // Automatically add the battle to this new campaign
        await handleAddToCampaign(newCampaign.id)
      }
    } catch (err) {
      console.error('Error getting newly created campaign:', err)
      setError(err instanceof Error ? err.message : 'Failed to add battle to new campaign')
    }
  }

  // Filter campaigns by search query
  const filteredCampaigns = campaigns.filter(campaign => {
    const searchLower = searchQuery.toLowerCase()
    const campaignNameMatch = campaign.name?.toLowerCase().includes(searchLower) || false
    const campaignDescMatch = campaign.description?.toLowerCase().includes(searchLower) || false
    return campaignNameMatch || campaignDescMatch
  })

  if (!isOpen || !battle) return null

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
          <h2 className="text-lg font-bold text-title">Add "{battle.battle_name || 'Battle'}" to Campaign</h2>
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
              <p className="text-secondary-text">Loading campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <p className="text-secondary-text mb-4">No campaigns found.</p>
              <p className="text-sm text-secondary-text">Create your first campaign to organize your battles.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-secondary-text mb-4">
                Select a campaign to add this battle to.
              </p>

              {/* Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] text-sm bg-bg-primary text-text"
                />
              </div>

              {/* No search results */}
              {searchQuery && filteredCampaigns.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-secondary-text mx-auto mb-4" />
                  <p className="text-secondary-text mb-2">No campaigns found matching "{searchQuery}"</p>
                  <p className="text-sm text-secondary-text">Try adjusting your search or clear the search to see all campaigns.</p>
                </div>
              )}

              {/* Campaigns List */}
              {filteredCampaigns.length > 0 && (
                <div className="space-y-2 mb-6">
                  {filteredCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center space-x-3 p-4 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors cursor-pointer"
                      onClick={() => handleCampaignSelect(campaign.id)}
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          selectedCampaign === campaign.id
                            ? 'bg-brand border-[var(--color-brand)] text-white'
                            : 'border-border-custom hover:border-[var(--color-brand)]'
                        }`}
                      >
                        {selectedCampaign === campaign.id && <Check className="w-3 h-3" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-text truncate mb-1">
                          {campaign.name}
                        </h4>
                        {campaign.description && (
                          <p className="text-sm text-secondary-text line-clamp-1 mb-1">
                            {campaign.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-secondary-text">
                          {campaign.start_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatLocalDate(campaign.start_date, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                          {campaign.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{campaign.location}</span>
                            </div>
                          )}
                        </div>
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
          {/* Create New Campaign Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowNewCampaignModal(true)}
              className="btn-secondary w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Campaign
            </button>
          </div>

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
              onClick={() => handleAddToCampaign()}
              disabled={!selectedCampaign || adding}
              className="btn-primary btn-flex"
            >
              {adding ? 'Adding...' : 'Add to Campaign'}
            </button>
          </div>
        </div>
      </div>

      {/* New Campaign Modal */}
      <NewCampaignModal
        isOpen={showNewCampaignModal}
        onClose={() => setShowNewCampaignModal(false)}
        onCampaignCreated={handleNewCampaignCreated}
      />
    </div>
  )
}