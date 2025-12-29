import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface UserLeaderboard {
  user_id: string
  email: string
  user_name_public: string | null
  models_count: number
  collections_count: number
  battles_count: number
  games_count: number
  lists_count: number
  total_count: number
}

export interface ActivityLogEntry {
  id: string
  type: 'model' | 'collection' | 'battle' | 'game' | 'list'
  user_id: string
  user_email: string
  user_name: string | null
  object_name: string
  created_at: string
}

export function useUserLeaderboards() {
  const [leaderboards, setLeaderboards] = useState<UserLeaderboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.is_admin) {
      setLoading(false)
      return
    }

    fetchLeaderboards()
  }, [user])

  const fetchLeaderboards = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch counts for each table, grouped by user_id
      const [modelsResult, boxesResult, battlesResult, gamesResult, listsResult] = await Promise.all([
        // Models count
        supabase
          .from('models')
          .select('user_id')
          .not('user_id', 'is', null),
        
        // Collections (boxes) count
        supabase
          .from('boxes')
          .select('user_id')
          .not('user_id', 'is', null),
        
        // Battles count
        supabase
          .from('battles')
          .select('user_id')
          .not('user_id', 'is', null),
        
        // Custom games count (only user-created games)
        supabase
          .from('games')
          .select('created_by')
          .not('created_by', 'is', null)
          .eq('supported', false),
        
        // Lists count
        supabase
          .from('lists')
          .select('user_id')
      ])

      if (modelsResult.error) throw modelsResult.error
      if (boxesResult.error) throw boxesResult.error
      if (battlesResult.error) throw battlesResult.error
      if (gamesResult.error) throw gamesResult.error
      if (listsResult.error) throw listsResult.error

      // Aggregate counts by user_id
      const userCounts = new Map<string, {
        models: number
        collections: number
        battles: number
        games: number
        lists: number
      }>()

      // Count models
      modelsResult.data?.forEach((item) => {
        if (item.user_id) {
          const counts = userCounts.get(item.user_id) || { models: 0, collections: 0, battles: 0, games: 0, lists: 0 }
          counts.models++
          userCounts.set(item.user_id, counts)
        }
      })

      // Count collections
      boxesResult.data?.forEach((item) => {
        if (item.user_id) {
          const counts = userCounts.get(item.user_id) || { models: 0, collections: 0, battles: 0, games: 0, lists: 0 }
          counts.collections++
          userCounts.set(item.user_id, counts)
        }
      })

      // Count battles
      battlesResult.data?.forEach((item) => {
        if (item.user_id) {
          const counts = userCounts.get(item.user_id) || { models: 0, collections: 0, battles: 0, games: 0, lists: 0 }
          counts.battles++
          userCounts.set(item.user_id, counts)
        }
      })

      // Count custom games
      gamesResult.data?.forEach((item) => {
        if (item.created_by) {
          const counts = userCounts.get(item.created_by) || { models: 0, collections: 0, battles: 0, games: 0, lists: 0 }
          counts.games++
          userCounts.set(item.created_by, counts)
        }
      })

      // Count lists
      listsResult.data?.forEach((item) => {
        const counts = userCounts.get(item.user_id) || { models: 0, collections: 0, battles: 0, games: 0, lists: 0 }
        counts.lists++
        userCounts.set(item.user_id, counts)
      })

      // Fetch user details for all users
      const userIds = Array.from(userCounts.keys())
      if (userIds.length === 0) {
        setLeaderboards([])
        setLoading(false)
        return
      }

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_name_public')
        .in('id', userIds)

      if (usersError) throw usersError

      // Combine user data with counts
      const leaderboardData: UserLeaderboard[] = (usersData || []).map((user) => {
        const counts = userCounts.get(user.id) || { models: 0, collections: 0, battles: 0, games: 0, lists: 0 }
        return {
          user_id: user.id,
          email: user.email,
          user_name_public: user.user_name_public,
          models_count: counts.models,
          collections_count: counts.collections,
          battles_count: counts.battles,
          games_count: counts.games,
          lists_count: counts.lists,
          total_count: counts.models + counts.collections + counts.battles + counts.games + counts.lists
        }
      })

      // Sort by total count descending
      leaderboardData.sort((a, b) => b.total_count - a.total_count)

      setLeaderboards(leaderboardData)
    } catch (err) {
      console.error('Error fetching leaderboards:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboards')
    } finally {
      setLoading(false)
    }
  }

  return {
    leaderboards,
    loading,
    error,
    refetch: fetchLeaderboards
  }
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.is_admin) {
      setLoading(false)
      return
    }

    fetchRecentActivity()
  }, [user])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString()

      // Fetch recent activity from each table
      const [modelsResult, boxesResult, battlesResult, gamesResult, listsResult] = await Promise.all([
        // Recent models
        supabase
          .from('models')
          .select('id, user_id, name, created_at')
          .not('user_id', 'is', null)
          .gte('created_at', thirtyDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent collections
        supabase
          .from('boxes')
          .select('id, user_id, name, created_at')
          .not('user_id', 'is', null)
          .gte('created_at', thirtyDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent battles
        supabase
          .from('battles')
          .select('id, user_id, battle_name, created_at')
          .not('user_id', 'is', null)
          .gte('created_at', thirtyDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent custom games
        supabase
          .from('games')
          .select('id, created_by, name, created_at')
          .not('created_by', 'is', null)
          .eq('supported', false)
          .gte('created_at', thirtyDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(100),
        
        // Recent lists
        supabase
          .from('lists')
          .select('id, user_id, name, created_at')
          .gte('created_at', thirtyDaysAgoISO)
          .order('created_at', { ascending: false })
          .limit(100)
      ])

      if (modelsResult.error) throw modelsResult.error
      if (boxesResult.error) throw boxesResult.error
      if (battlesResult.error) throw battlesResult.error
      if (gamesResult.error) throw gamesResult.error
      if (listsResult.error) throw listsResult.error

      // Collect all user IDs
      const userIds = new Set<string>()
      modelsResult.data?.forEach(item => item.user_id && userIds.add(item.user_id))
      boxesResult.data?.forEach(item => item.user_id && userIds.add(item.user_id))
      battlesResult.data?.forEach(item => item.user_id && userIds.add(item.user_id))
      gamesResult.data?.forEach(item => item.created_by && userIds.add(item.created_by))
      listsResult.data?.forEach(item => userIds.add(item.user_id))

      // Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, user_name_public')
        .in('id', Array.from(userIds))

      if (usersError) throw usersError

      const usersMap = new Map((usersData || []).map(u => [u.id, u]))

      // Combine all activities
      const allActivities: ActivityLogEntry[] = []

      // Add models
      modelsResult.data?.forEach((item) => {
        if (item.user_id) {
          const user = usersMap.get(item.user_id)
          allActivities.push({
            id: item.id,
            type: 'model',
            user_id: item.user_id,
            user_email: user?.email || 'Unknown',
            user_name: user?.user_name_public || null,
            object_name: item.name || 'Unnamed Model',
            created_at: item.created_at || ''
          })
        }
      })

      // Add collections
      boxesResult.data?.forEach((item) => {
        if (item.user_id) {
          const user = usersMap.get(item.user_id)
          allActivities.push({
            id: item.id,
            type: 'collection',
            user_id: item.user_id,
            user_email: user?.email || 'Unknown',
            user_name: user?.user_name_public || null,
            object_name: item.name || 'Unnamed Collection',
            created_at: item.created_at || ''
          })
        }
      })

      // Add battles
      battlesResult.data?.forEach((item) => {
        if (item.user_id) {
          const user = usersMap.get(item.user_id)
          allActivities.push({
            id: item.id.toString(),
            type: 'battle',
            user_id: item.user_id,
            user_email: user?.email || 'Unknown',
            user_name: user?.user_name_public || null,
            object_name: item.battle_name || 'Unnamed Battle',
            created_at: item.created_at || ''
          })
        }
      })

      // Add games
      gamesResult.data?.forEach((item) => {
        if (item.created_by) {
          const user = usersMap.get(item.created_by)
          allActivities.push({
            id: item.id,
            type: 'game',
            user_id: item.created_by,
            user_email: user?.email || 'Unknown',
            user_name: user?.user_name_public || null,
            object_name: item.name || 'Unnamed Game',
            created_at: item.created_at || ''
          })
        }
      })

      // Add lists
      listsResult.data?.forEach((item) => {
        const user = usersMap.get(item.user_id)
        allActivities.push({
          id: item.id,
          type: 'list',
          user_id: item.user_id,
          user_email: user?.email || 'Unknown',
          user_name: user?.user_name_public || null,
          object_name: item.name || 'Unnamed List',
          created_at: item.created_at || ''
        })
      })

      // Sort by created_at descending
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Limit to 200 most recent
      setActivities(allActivities.slice(0, 200))
    } catch (err) {
      console.error('Error fetching recent activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity')
    } finally {
      setLoading(false)
    }
  }

  return {
    activities,
    loading,
    error,
    refetch: fetchRecentActivity
  }
}

