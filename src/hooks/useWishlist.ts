import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface WishlistItem {
  id: number
  item_name: string | null
  user_uid: string | null
  created_at: string
}

export function useWishlist() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const fetchWishlistItems = async () => {
    if (authLoading) {
      setLoading(true)
      setHasInitialized(false)
      return
    }

    if (!user) {
      setWishlistItems([])
      setLoading(false)
      setHasInitialized(true)
      return
    }

    const startTime = Date.now()
    const minLoadingTime = 300

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_uid', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching wishlist items:', error)
        setWishlistItems([])
      } else {
        setWishlistItems(data || [])
      }
    } catch (error) {
      console.error('Error fetching wishlist items:', error)
      setWishlistItems([])
    } finally {
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      setTimeout(() => {
        setLoading(false)
        setHasInitialized(true)
      }, remainingTime)
    }
  }

  const addWishlistItem = async (itemName: string) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      const { data, error } = await supabase
        .from('wishlist')
        .insert([{
          item_name: itemName,
          user_uid: user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Error adding wishlist item:', error)
        return { error }
      }

      // Add the new item to the local state
      setWishlistItems(prev => [data, ...prev])
      return { data, error: null }
    } catch (error) {
      console.error('Error adding wishlist item:', error)
      return { error }
    }
  }

  const removeWishlistItem = async (itemId: number) => {
    if (!user) return { error: new Error('User not authenticated') }

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId)
        .eq('user_uid', user.id) // Ensure user can only delete their own items

      if (error) {
        console.error('Error removing wishlist item:', error)
        return { error }
      }

      // Remove the item from local state
      setWishlistItems(prev => prev.filter(item => item.id !== itemId))
      return { error: null }
    } catch (error) {
      console.error('Error removing wishlist item:', error)
      return { error }
    }
  }

  useEffect(() => {
    fetchWishlistItems()
  }, [user, authLoading])

  const refetch = () => {
    fetchWishlistItems()
  }

  return {
    wishlistItems,
    loading,
    hasInitialized,
    addWishlistItem,
    removeWishlistItem,
    refetch
  }
}