import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Friend {
  friend_user_id: string
  friend_email: string
  friend_name: string | null
  friendship_id: string
  friendship_created_at: string
}

export interface FriendRequest {
  request_id: string
  requester_id: string
  requester_email: string
  requester_name: string | null
  recipient_id: string
  direction: 'incoming' | 'outgoing'
  created_at: string
}

export interface FriendshipStatus {
  status: 'pending' | 'accepted' | 'blocked' | null
  friendship_id: string | null
  requester_id: string | null
}

export function useFriends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch friends and pending requests
  const fetchFriends = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch friends using the database function
      const { data: friendsData, error: friendsError } = await supabase
        .rpc('get_friends', { p_user_id: user.id })

      if (friendsError) throw friendsError

      setFriends(friendsData || [])
    } catch (err) {
      console.error('Error fetching friends:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch friends')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingRequests = async () => {
    if (!user?.id) return

    try {
      const { data: requestsData, error: requestsError } = await supabase
        .rpc('get_pending_requests', { p_user_id: user.id })

      if (requestsError) throw requestsError

      setPendingRequests(requestsData || [])
    } catch (err) {
      console.error('Error fetching pending requests:', err)
    }
  }

  // Send a friend request by email
  const sendFriendRequest = async (email: string) => {
    if (!user?.id) {
      throw new Error('You must be logged in to send friend requests')
    }

    try {
      const { data, error } = await supabase
        .rpc('send_friend_request_by_email', { p_email: email })

      if (error) throw error

      // Refresh pending requests
      await fetchPendingRequests()

      return data
    } catch (err) {
      console.error('Error sending friend request:', err)
      throw err
    }
  }

  // Accept a friend request
  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (error) throw error

      // Refresh both friends and pending requests
      await Promise.all([fetchFriends(), fetchPendingRequests()])
    } catch (err) {
      console.error('Error accepting friend request:', err)
      throw err
    }
  }

  // Decline a friend request
  const declineFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      // Refresh pending requests
      await fetchPendingRequests()
    } catch (err) {
      console.error('Error declining friend request:', err)
      throw err
    }
  }

  // Cancel a friend request (for outgoing requests)
  const cancelFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      // Refresh pending requests
      await fetchPendingRequests()
    } catch (err) {
      console.error('Error canceling friend request:', err)
      throw err
    }
  }

  // Remove a friend (unfriend)
  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId)

      if (error) throw error

      // Refresh friends list
      await fetchFriends()
    } catch (err) {
      console.error('Error removing friend:', err)
      throw err
    }
  }

  // Block a user
  const blockUser = async (userId: string) => {
    if (!user?.id) {
      throw new Error('You must be logged in to block users')
    }

    try {
      // Check if friendship exists
      const { data: existingFriendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .single()

      if (existingFriendship) {
        // Update existing friendship to blocked
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'blocked' })
          .eq('id', existingFriendship.id)

        if (error) throw error
      } else {
        // Create new blocked relationship
        const { error } = await supabase
          .from('friendships')
          .insert({
            user_id: user.id,
            friend_id: userId,
            status: 'blocked'
          })

        if (error) throw error
      }

      // Refresh friends and requests
      await Promise.all([fetchFriends(), fetchPendingRequests()])
    } catch (err) {
      console.error('Error blocking user:', err)
      throw err
    }
  }

  // Check friendship status with a specific user
  const checkFriendshipStatus = async (friendId: string): Promise<FriendshipStatus> => {
    if (!user?.id) {
      return { status: null, friendship_id: null, requester_id: null }
    }

    try {
      const { data, error } = await supabase
        .rpc('check_friendship_status', {
          p_user_id: user.id,
          p_friend_id: friendId
        })

      if (error) throw error

      if (data && data.length > 0) {
        return {
          status: data[0].status as 'pending' | 'accepted' | 'blocked',
          friendship_id: data[0].friendship_id,
          requester_id: data[0].requester_id
        }
      }

      return { status: null, friendship_id: null, requester_id: null }
    } catch (err) {
      console.error('Error checking friendship status:', err)
      return { status: null, friendship_id: null, requester_id: null }
    }
  }


  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchFriends()
      fetchPendingRequests()
    }
  }, [user?.id])

  // Set up real-time subscription for friendships
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('friendships_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${user.id},friend_id=eq.${user.id}`
        },
        () => {
          // Refresh friends and pending requests when changes occur
          fetchFriends()
          fetchPendingRequests()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    friends,
    pendingRequests,
    loading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    checkFriendshipStatus,
    refetch: () => {
      fetchFriends()
      fetchPendingRequests()
    }
  }
}