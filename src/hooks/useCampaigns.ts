import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Tables } from '../lib/database.types'

type Campaign = Tables<'campaigns'>

export function useCampaigns() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCampaigns()
    } else {
      setCampaigns([])
      setLoading(false)
    }
  }, [user])

  const fetchCampaigns = async () => {
    if (!user) return

    try {
      setLoading(true)
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
  }

  const createCampaign = async (campaignData: {
    name: string
    description?: string | null
    location?: string | null
    start_date?: string | null
    end_date?: string | null
  }) => {
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    setCampaigns(prev => [data, ...prev])
    return data
  }

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    setCampaigns(prev => prev.map(campaign =>
      campaign.id === id ? data : campaign
    ))
    return data
  }

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) throw error

    setCampaigns(prev => prev.filter(campaign => campaign.id !== id))
  }

  const getCampaignBattleCount = async (campaignId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('battles')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching battle count:', error)
      return 0
    }
  }

  return {
    campaigns,
    loading,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignBattleCount
  }
}