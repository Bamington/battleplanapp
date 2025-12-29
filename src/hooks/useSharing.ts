import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../lib/database.types'

type SharedModel = Database['public']['Tables']['shared_models']['Row']
type SharedBox = Database['public']['Tables']['shared_boxes']['Row']
type SharedBattle = Database['public']['Tables']['shared_battles']['Row']
type SharedBooking = Database['public']['Tables']['shared_bookings']['Row']

export interface SharedContentCounts {
  models_shared_with_me: number
  boxes_shared_with_me: number
  battles_shared_with_me: number
  bookings_shared_with_me: number
  models_i_shared: number
  boxes_i_shared: number
  battles_i_shared: number
  bookings_i_shared: number
}

export type ContentType = 'model' | 'box' | 'battle' | 'booking'
export type PermissionLevel = 'view' | 'edit'

export function useSharing() {
  const { user } = useAuth()
  const [sharedCounts, setSharedCounts] = useState<SharedContentCounts | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch shared content counts
  const fetchSharedCounts = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .rpc('get_shared_content_count', { p_user_id: user.id })

      if (error) throw error

      if (data && data.length > 0) {
        setSharedCounts({
          models_shared_with_me: Number(data[0].models_shared_with_me),
          boxes_shared_with_me: Number(data[0].boxes_shared_with_me),
          battles_shared_with_me: Number(data[0].battles_shared_with_me),
          bookings_shared_with_me: Number(data[0].bookings_shared_with_me),
          models_i_shared: Number(data[0].models_i_shared),
          boxes_i_shared: Number(data[0].boxes_i_shared),
          battles_i_shared: Number(data[0].battles_i_shared),
          bookings_i_shared: Number(data[0].bookings_i_shared)
        })
      }
    } catch (err) {
      console.error('Error fetching shared content counts:', err)
    }
  }

  // Share a model with friends
  const shareModel = async (
    modelId: string,
    friendIds: string[],
    permissionLevel: PermissionLevel = 'view',
    expiresAt?: string
  ) => {
    if (!user?.id) {
      throw new Error('You must be logged in to share content')
    }

    try {
      setLoading(true)
      setError(null)

      const shares = friendIds.map(friendId => ({
        model_id: modelId,
        owner_id: user.id,
        shared_with_user_id: friendId,
        permission_level: permissionLevel,
        expires_at: expiresAt || null
      }))

      const { error } = await supabase
        .from('shared_models')
        .upsert(shares, { onConflict: 'model_id,shared_with_user_id' })

      if (error) throw error

      await fetchSharedCounts()
    } catch (err) {
      console.error('Error sharing model:', err)
      setError(err instanceof Error ? err.message : 'Failed to share model')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Share a box with friends
  const shareBox = async (
    boxId: string,
    friendIds: string[],
    permissionLevel: PermissionLevel = 'view',
    expiresAt?: string
  ) => {
    if (!user?.id) {
      throw new Error('You must be logged in to share content')
    }

    try {
      setLoading(true)
      setError(null)

      const shares = friendIds.map(friendId => ({
        box_id: boxId,
        owner_id: user.id,
        shared_with_user_id: friendId,
        permission_level: permissionLevel,
        expires_at: expiresAt || null
      }))

      const { error } = await supabase
        .from('shared_boxes')
        .upsert(shares, { onConflict: 'box_id,shared_with_user_id' })

      if (error) throw error

      await fetchSharedCounts()
    } catch (err) {
      console.error('Error sharing box:', err)
      setError(err instanceof Error ? err.message : 'Failed to share collection')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Share a battle with friends
  const shareBattle = async (
    battleId: number,
    friendIds: string[],
    permissionLevel: PermissionLevel = 'view',
    expiresAt?: string
  ) => {
    if (!user?.id) {
      throw new Error('You must be logged in to share content')
    }

    try {
      setLoading(true)
      setError(null)

      const shares = friendIds.map(friendId => ({
        battle_id: battleId,
        owner_id: user.id,
        shared_with_user_id: friendId,
        permission_level: permissionLevel,
        expires_at: expiresAt || null
      }))

      const { error } = await supabase
        .from('shared_battles')
        .upsert(shares, { onConflict: 'battle_id,shared_with_user_id' })

      if (error) throw error

      await fetchSharedCounts()
    } catch (err) {
      console.error('Error sharing battle:', err)
      setError(err instanceof Error ? err.message : 'Failed to share battle')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Share a booking with friends
  const shareBooking = async (
    bookingId: string,
    friendIds: string[],
    permissionLevel: PermissionLevel = 'view',
    expiresAt?: string
  ) => {
    if (!user?.id) {
      throw new Error('You must be logged in to share content')
    }

    try {
      setLoading(true)
      setError(null)

      const shares = friendIds.map(friendId => ({
        booking_id: bookingId,
        owner_id: user.id,
        shared_with_user_id: friendId,
        permission_level: permissionLevel,
        expires_at: expiresAt || null
      }))

      const { error } = await supabase
        .from('shared_bookings')
        .upsert(shares, { onConflict: 'booking_id,shared_with_user_id' })

      if (error) throw error

      await fetchSharedCounts()
    } catch (err) {
      console.error('Error sharing booking:', err)
      setError(err instanceof Error ? err.message : 'Failed to share booking')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Revoke a share
  const revokeShare = async (shareId: string, contentType: ContentType) => {
    try {
      setLoading(true)
      setError(null)

      const tableMap = {
        model: 'shared_models',
        box: 'shared_boxes',
        battle: 'shared_battles',
        booking: 'shared_bookings'
      }

      const { error } = await supabase
        .from(tableMap[contentType])
        .delete()
        .eq('id', shareId)

      if (error) throw error

      await fetchSharedCounts()
    } catch (err) {
      console.error('Error revoking share:', err)
      setError(err instanceof Error ? err.message : 'Failed to revoke share')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Get models shared with the current user
  const getSharedModels = async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from('shared_models')
        .select(`
          *,
          model:models(*)
        `)
        .eq('shared_with_user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching shared models:', err)
      return []
    }
  }

  // Get boxes shared with the current user
  const getSharedBoxes = async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from('shared_boxes')
        .select(`
          *,
          box:boxes(*)
        `)
        .eq('shared_with_user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching shared boxes:', err)
      return []
    }
  }

  // Get battles shared with the current user
  const getSharedBattles = async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from('shared_battles')
        .select(`
          *,
          battle:battles(*)
        `)
        .eq('shared_with_user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching shared battles:', err)
      return []
    }
  }

  // Get bookings shared with the current user
  const getSharedBookings = async () => {
    if (!user?.id) return []

    try {
      const { data, error } = await supabase
        .from('shared_bookings')
        .select(`
          *,
          booking:bookings(*)
        `)
        .eq('shared_with_user_id', user.id)
        .or('expires_at.is.null,expires_at.gt.now()')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching shared bookings:', err)
      return []
    }
  }

  // Get content the current user has shared with others
  const getMyShares = async (contentType: ContentType) => {
    if (!user?.id) return []

    try {
      const tableMap = {
        model: 'shared_models',
        box: 'shared_boxes',
        battle: 'shared_battles',
        booking: 'shared_bookings'
      }

      const { data, error } = await supabase
        .from(tableMap[contentType])
        .select('*')
        .eq('owner_id', user.id)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching my shares:', err)
      return []
    }
  }

  // Get who has access to a specific piece of content
  const getContentShares = async (contentId: string | number, contentType: ContentType) => {
    if (!user?.id) return []

    try {
      const tableMap = {
        model: 'shared_models',
        box: 'shared_boxes',
        battle: 'shared_battles',
        booking: 'shared_bookings'
      }

      const idField = contentType === 'model' ? 'model_id' :
                      contentType === 'box' ? 'box_id' :
                      contentType === 'battle' ? 'battle_id' : 'booking_id'

      const { data, error } = await supabase
        .from(tableMap[contentType])
        .select(`
          *,
          shared_user:users!shared_with_user_id(id, email, user_name_public)
        `)
        .eq(idField, contentId)
        .eq('owner_id', user.id)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching content shares:', err)
      return []
    }
  }

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchSharedCounts()
    }
  }, [user?.id])

  return {
    sharedCounts,
    loading,
    error,
    shareModel,
    shareBox,
    shareBattle,
    shareBooking,
    revokeShare,
    getSharedModels,
    getSharedBoxes,
    getSharedBattles,
    getSharedBookings,
    getMyShares,
    getContentShares,
    refetch: fetchSharedCounts
  }
}