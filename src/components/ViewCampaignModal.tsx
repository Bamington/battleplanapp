import React, { useState, useEffect } from 'react'
import { X, Calendar, MapPin, Users, Edit, Trash2, Plus, Sword, Trophy, Target } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Tables } from '../lib/database.types'
import { formatLocalDate } from '../utils/timezone'

type Campaign = Tables<'campaigns'>

interface ViewCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  campaign: Campaign | null
  onEdit?: (campaign: Campaign) => void
  onDelete?: (campaign: Campaign) => void
  onAddBattle?: (campaign: Campaign) => void
  onBattleRemoved?: () => void
}

export function ViewCampaignModal({
  isOpen,
  onClose,
  campaign,
  onEdit,
  onDelete,
  onAddBattle,
  onBattleRemoved
}: ViewCampaignModalProps) {
  const [battleCount, setBattleCount] = useState<number>(0)
  const [battlesWon, setBattlesWon] = useState<number>(0)
  const [battles, setBattles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [battlesLoading, setBattlesLoading] = useState(false)
  const [removingBattleId, setRemovingBattleId] = useState<number | null>(null)

  useEffect(() => {
    if (campaign && isOpen) {
      fetchBattleCount()
      fetchCampaignBattles()
    }
  }, [campaign, isOpen])


  const fetchBattleCount = async () => {
    if (!campaign) return

    setLoading(true)
    try {
      const { count, error } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)

      if (error) {
        console.error('Error fetching battle count:', error)
        setBattleCount(0)
      } else {
        setBattleCount(count || 0)
      }
    } catch (error) {
      console.error('Error fetching battle count:', error)
      setBattleCount(0)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaignBattles = async () => {
    if (!campaign) return

    setBattlesLoading(true)
    try {
      const { data, error } = await supabase
        .from('battles')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('date_played', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching campaign battles:', error)
        setBattles([])
        setBattlesWon(0)
      } else {
        const battleData = data || []
        setBattles(battleData)

        // Calculate battles won - check for various win conditions
        console.log('=== CAMPAIGN BATTLES DEBUG ===')
        console.log('Total battles fetched:', battleData.length)
        console.log('All battles:', battleData.map(b => ({
          id: b.id,
          name: b.battle_name,
          result: b.result
        })))

        const battlesWithResults = battleData.filter(b => b.result)
        console.log('Battles with results:', battlesWithResults.length)
        console.log('Results found:', battlesWithResults.map(b => `"${b.result}"`))

        const wonCount = battleData.filter(battle => {
          if (!battle.result) {
            console.log(`Battle ${battle.id} has no result`)
            return false
          }
          const result = battle.result.toLowerCase().trim()

          // Since all results contain 'won', we need to specifically check for wins
          // 'I won' = win, 'Draw' = draw, anything else = loss
          const isWin = result === 'i won'

          console.log(`Battle ${battle.id}: "${battle.result}" -> ${isWin ? 'WIN' : 'NOT WIN'}`)
          return isWin
        }).length

        console.log('Final battles won count:', wonCount)
        console.log('===============================')

        setBattlesWon(wonCount)
      }
    } catch (error) {
      console.error('Error fetching campaign battles:', error)
      setBattles([])
      setBattlesWon(0)
    } finally {
      setBattlesLoading(false)
    }
  }

  const handleDelete = () => {
    if (!campaign) return

    onDelete?.(campaign)
  }

  const handleRemoveBattleFromCampaign = async (battleId: number) => {
    if (!campaign) return

    setRemovingBattleId(battleId)
    try {
      // Update battle to remove it from the campaign (set campaign_id to null)
      const { error } = await supabase
        .from('battles')
        .update({ campaign_id: null })
        .eq('id', battleId)

      if (error) {
        console.error('Error removing battle from campaign:', error)
        return
      }

      // Refresh the data in this modal
      await fetchBattleCount()
      await fetchCampaignBattles()

      // Notify parent component to refresh campaign list
      onBattleRemoved?.()
    } catch (error) {
      console.error('Error removing battle from campaign:', error)
    } finally {
      setRemovingBattleId(null)
    }
  }

  const formatDateRange = () => {
    if (!campaign) return null

    const hasStartDate = campaign.start_date
    const hasEndDate = campaign.end_date

    if (!hasStartDate && !hasEndDate) return null

    const formatOptions = {
      month: 'long' as const,
      day: 'numeric' as const,
      year: 'numeric' as const
    }

    if (hasStartDate && hasEndDate) {
      const startFormatted = formatLocalDate(campaign.start_date!, formatOptions)
      const endFormatted = formatLocalDate(campaign.end_date!, formatOptions)
      return `${startFormatted} - ${endFormatted}`
    }

    if (hasStartDate) {
      return `Started ${formatLocalDate(campaign.start_date!, formatOptions)}`
    }

    if (hasEndDate) {
      return `Ends ${formatLocalDate(campaign.end_date!, formatOptions)}`
    }

    return null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !campaign) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-bg-card rounded-lg shadow-xl w-full max-w-2xl border border-border-custom max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom flex-shrink-0">
          <h2 className="text-xl font-semibold text-title">Campaign Details</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Campaign Name */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-title mb-4">{campaign.name}</h1>

            {/* Campaign Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-bg-secondary rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-6 h-6 text-brand" />
                </div>
                <div className="text-2xl font-bold text-title">
                  {battlesLoading ? '...' : battleCount}
                </div>
                <div className="text-sm text-secondary-text">Battles Played</div>
              </div>

              <div className="bg-bg-secondary rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-title">
                  {battlesLoading ? '...' : battlesWon}
                </div>
                <div className="text-sm text-secondary-text">Battles Won</div>
              </div>

              {battleCount > 0 && !battlesLoading && (
                <div className="bg-bg-secondary rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-title">
                    {Math.round((battlesWon / battleCount) * 100)}%
                  </div>
                  <div className="text-sm text-secondary-text">Win Rate</div>
                </div>
              )}
            </div>

            {/* Campaign Meta Info */}
            {campaign.location && (
              <div className="flex items-center space-x-2 text-sm text-secondary-text">
                <MapPin className="w-4 h-4" />
                <span>{campaign.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {campaign.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-title mb-3">Description</h3>
              <p className="text-text leading-relaxed whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>
          )}

          {/* Campaign Dates */}
          {(campaign.start_date || campaign.end_date) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-title mb-3">Timeline</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {campaign.start_date && (
                  <div className="bg-bg-secondary rounded-lg p-4">
                    <div className="text-sm text-secondary-text mb-1">Start Date</div>
                    <div className="text-text font-medium">
                      {formatLocalDate(campaign.start_date, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}

                {campaign.end_date && (
                  <div className="bg-bg-secondary rounded-lg p-4">
                    <div className="text-sm text-secondary-text mb-1">End Date</div>
                    <div className="text-text font-medium">
                      {formatLocalDate(campaign.end_date, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {campaign.location && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-title mb-3">Location</h3>
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center space-x-2 text-text">
                  <MapPin className="w-4 h-4 text-secondary-text" />
                  <span>{campaign.location}</span>
                </div>
              </div>
            </div>
          )}

          {/* Battles List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-title mb-3">Campaign Battles</h3>

            {battlesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-bg-secondary rounded-lg p-4 animate-pulse">
                    <div className="h-5 bg-secondary-text opacity-20 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-secondary-text opacity-20 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : battles.length === 0 ? (
              <div className="text-center py-8 bg-bg-secondary rounded-lg">
                <Sword className="w-12 h-12 text-secondary-text mx-auto mb-3" />
                <p className="text-secondary-text mb-4">No battles in this campaign yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {battles.map((battle) => (
                  <div key={battle.id} className="bg-bg-secondary rounded-lg p-4 hover:bg-bg-secondary/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-title truncate mb-1">
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
                          {battle.result && (
                            <span className={`font-medium ${
                              battle.result === 'Win' ? 'text-green-500' :
                              battle.result === 'Loss' ? 'text-red-500' :
                              'text-yellow-500'
                            }`}>
                              {battle.result}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveBattleFromCampaign(battle.id)}
                        disabled={removingBattleId === battle.id}
                        className="ml-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove battle from campaign"
                      >
                        {removingBattleId === battle.id ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Fixed Footer - Action Buttons */}
        <div className="p-6 border-t border-border-custom bg-bg-secondary flex-shrink-0 space-y-3">
          {/* Add Battle Button */}
          <button
            onClick={() => onAddBattle?.(campaign)}
            className="btn-primary w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Battle to Campaign
          </button>

          {/* Other Action Buttons */}
          <div className="flex justify-between">
            <div className="flex space-x-3">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(campaign)
                    onClose()
                  }}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Campaign
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="btn-danger-outline"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}