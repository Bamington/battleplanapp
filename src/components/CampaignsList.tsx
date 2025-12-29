import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, MapPin, Users, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Tables } from '../lib/database.types'
import { formatLocalDate } from '../utils/timezone'

type Campaign = Tables<'campaigns'>

interface CampaignsListProps {
  onCreateCampaign: () => void
  onRefreshReady?: (refreshFn: () => void) => void
  onViewCampaign?: (campaign: Campaign) => void
}

export function CampaignsList({ onCreateCampaign, onRefreshReady, onViewCampaign }: CampaignsListProps) {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('created_by', user.id)
        .order('start_date', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    }
  }, [user, fetchCampaigns])

  // Provide refresh function to parent component
  useEffect(() => {
    if (onRefreshReady) {
      onRefreshReady(fetchCampaigns)
    }
  }, [onRefreshReady, fetchCampaigns])

  const getCampaignBattleCount = async (campaignId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)

      if (error) {
        console.error('Error fetching battle count:', error)
        return 0
      }
      return count || 0
    } catch (error) {
      console.error('Error fetching battle count:', error)
      return 0
    }
  }

  const [battleCounts, setBattleCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchBattleCounts = async () => {
      const counts: Record<string, number> = {}
      for (const campaign of campaigns) {
        counts[campaign.id] = await getCampaignBattleCount(campaign.id)
      }
      setBattleCounts(counts)
    }

    if (campaigns.length > 0) {
      fetchBattleCounts()
    }
  }, [campaigns])


  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-bg-card rounded-lg border border-border-custom p-6 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-secondary-text opacity-20 rounded w-1/3"></div>
                <div className="h-4 bg-secondary-text opacity-20 rounded w-2/3"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-secondary-text opacity-20 rounded w-20"></div>
                  <div className="h-4 bg-secondary-text opacity-20 rounded w-16"></div>
                </div>
              </div>
              <div className="w-8 h-8 bg-secondary-text opacity-20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-20 h-20 text-secondary-text mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-title mb-2">No Campaigns Yet</h3>
        <p className="text-secondary-text mb-6 max-w-md mx-auto">
          Create your first campaign to organize your battles into themed groups or storylines.
        </p>
        <button
          onClick={onCreateCampaign}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Campaign
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-title">Your Campaigns</h2>
        <button
          onClick={onCreateCampaign}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </button>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            onClick={() => onViewCampaign && onViewCampaign(campaign)}
            className="bg-bg-card rounded-lg border border-border-custom p-6 hover:bg-bg-secondary transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-title mb-2 truncate">
                  {campaign.name}
                </h3>

                {campaign.description && (
                  <p className="text-secondary-text mb-3 line-clamp-2">
                    {campaign.description}
                  </p>
                )}

                <div className="flex items-center space-x-6 text-sm text-secondary-text">
                  {campaign.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{campaign.location}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{battleCounts[campaign.id] || 0} battle{(battleCounts[campaign.id] || 0) !== 1 ? 's' : ''}</span>
                  </div>

                  {campaign.start_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Started {formatLocalDate(campaign.start_date, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}