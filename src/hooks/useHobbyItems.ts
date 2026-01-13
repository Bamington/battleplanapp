import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface HobbyItem {
  id: number
  name: string | null
  type: string | null
  brand: string | null
  sub_brand: string | null
  code: string | null
  swatch: string | null
  owner: string | null
  public: boolean
  created_at: string
  owned?: boolean // Whether the current user owns this item in their collection
}

export interface ModelHobbyItem extends HobbyItem {
  model_hobby_item_id: string
  added_at: string
  section: string | null
}

export function useHobbyItems(modelId?: string) {
  const [userHobbyItems, setUserHobbyItems] = useState<HobbyItem[]>([])
  const [publicHobbyItems, setPublicHobbyItems] = useState<HobbyItem[]>([])
  const [allHobbyItems, setAllHobbyItems] = useState<HobbyItem[]>([])
  const [ownedHobbyItems, setOwnedHobbyItems] = useState<HobbyItem[]>([]) // Items in user's collection
  const [collectionItemIds, setCollectionItemIds] = useState<Set<number>>(new Set()) // IDs of owned items
  const [modelHobbyItems, setModelHobbyItems] = useState<ModelHobbyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch all hobby items owned by the current user
  const fetchUserHobbyItems = useCallback(async () => {
    console.log('[useHobbyItems] fetchUserHobbyItems called, user:', user?.id)
    if (!user) {
      console.log('[useHobbyItems] No user, clearing hobby items')
      setUserHobbyItems([])
      return
    }

    try {
      console.log('[useHobbyItems] Fetching hobby items for user:', user.id)
      const { data, error: fetchError } = await supabase
        .from('hobby_items')
        .select('*')
        .eq('owner', user.id)
        .order('name', { ascending: true })

      if (fetchError) {
        console.error('[useHobbyItems] Error fetching hobby items:', fetchError)
        throw fetchError
      }

      console.log('[useHobbyItems] Fetched hobby items:', data?.length || 0, 'items')
      setUserHobbyItems(data || [])
    } catch (err) {
      console.error('[useHobbyItems] Error fetching user hobby items:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch hobby items')
    }
  }, [user])

  // Fetch all public hobby items
  const fetchPublicHobbyItems = useCallback(async () => {
    console.log('[useHobbyItems] fetchPublicHobbyItems called')
    try {
      console.log('[useHobbyItems] Fetching public hobby items')
      const { data, error: fetchError } = await supabase
        .from('hobby_items')
        .select('*')
        .eq('public', true)
        .order('name', { ascending: true })

      if (fetchError) {
        console.error('[useHobbyItems] Error fetching public hobby items:', fetchError)
        throw fetchError
      }

      console.log('[useHobbyItems] Fetched public hobby items:', data?.length || 0, 'items')
      setPublicHobbyItems(data || [])
    } catch (err) {
      console.error('[useHobbyItems] Error fetching public hobby items:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch public hobby items')
    }
  }, [])

  // Fetch user's collection (owned items)
  const fetchUserCollection = useCallback(async () => {
    console.log('[useHobbyItems] fetchUserCollection START, user:', user?.id)
    console.log('[useHobbyItems] Call stack:', new Error().stack)
    if (!user) {
      console.log('[useHobbyItems] No user, clearing collection')
      setCollectionItemIds(new Set())
      setOwnedHobbyItems([])
      return
    }

    try {
      console.log('[useHobbyItems] Fetching user collection from database...')
      const { data, error: fetchError } = await supabase
        .from('user_hobby_items')
        .select(`
          hobby_item_id,
          hobby_item:hobby_items (
            id,
            name,
            type,
            brand,
            sub_brand,
            code,
            swatch,
            owner,
            public,
            created_at
          )
        `)
        .eq('user_id', user.id)

      if (fetchError) {
        console.error('[useHobbyItems] Error fetching user collection:', fetchError)
        throw fetchError
      }

      console.log('[useHobbyItems] Database query completed, fetched:', data?.length || 0, 'items')

      // Extract hobby item IDs
      const itemIds = new Set(data?.map(item => item.hobby_item_id) || [])
      console.log('[useHobbyItems] Setting collectionItemIds, size:', itemIds.size)
      setCollectionItemIds(itemIds)

      // Extract and flatten hobby items
      const items = (data || [])
        .map(item => {
          const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
          return hobbyItem ? { ...hobbyItem, owned: true } : null
        })
        .filter(Boolean) as HobbyItem[]

      console.log('[useHobbyItems] Setting ownedHobbyItems, count:', items.length)
      setOwnedHobbyItems(items)
      console.log('[useHobbyItems] fetchUserCollection END')
    } catch (err) {
      console.error('[useHobbyItems] Error fetching user collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch user collection')
    }
  }, [user])

  // Combine user and public items, marking owned items
  // allHobbyItems = all items (user's private + public) with owned flag
  // ownedHobbyItems = only items in user's collection (for Hobby Tab display)
  useEffect(() => {
    const combined = [...userHobbyItems]
    const userItemIds = new Set(userHobbyItems.map(item => item.id))

    // Add public items that aren't already in user items
    publicHobbyItems.forEach(item => {
      if (!userItemIds.has(item.id)) {
        combined.push(item)
      }
    })

    // Mark items as owned if they're in the collection or are user's private items
    const combinedWithOwnership = combined.map(item => ({
      ...item,
      owned: collectionItemIds.has(item.id) || item.owner === user?.id
    }))

    // Sort combined list by name
    combinedWithOwnership.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    setAllHobbyItems(combinedWithOwnership)
  }, [userHobbyItems, publicHobbyItems, collectionItemIds, user])

  // Fetch hobby items associated with a specific model
  const fetchModelHobbyItems = useCallback(async () => {
    console.log('[useHobbyItems] fetchModelHobbyItems called, modelId:', modelId)
    if (!modelId) {
      console.log('[useHobbyItems] No modelId, clearing model hobby items')
      setModelHobbyItems([])
      return
    }

    try {
      console.log('[useHobbyItems] Fetching model hobby items for model:', modelId)
      const { data, error: fetchError } = await supabase
        .from('model_hobby_items')
        .select(`
          id,
          added_at,
          section,
          hobby_item:hobby_items (
            id,
            name,
            type,
            brand,
            swatch,
            owner,
            created_at
          )
        `)
        .eq('model_id', modelId)
        .order('added_at', { ascending: true })

      if (fetchError) {
        console.error('[useHobbyItems] Error fetching model hobby items:', fetchError)
        throw fetchError
      }

      console.log('[useHobbyItems] Fetched model hobby items:', data?.length || 0, 'items')

      // Transform the data to flatten the hobby_item object
      const transformedData = (data || []).map(item => {
        const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
        return {
          ...hobbyItem,
          model_hobby_item_id: item.id,
          added_at: item.added_at,
          section: item.section
        }
      }).filter(item => item.id) // Filter out any items where hobby_item was null

      console.log('[useHobbyItems] Transformed model hobby items:', transformedData.length, 'items')
      setModelHobbyItems(transformedData as ModelHobbyItem[])
    } catch (err) {
      console.error('[useHobbyItems] Error fetching model hobby items:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch model hobby items')
    }
  }, [modelId])

  // Add a hobby item to a model
  const addHobbyItemToModel = async (hobbyItemId: number, section?: string) => {
    console.log('[useHobbyItems] addHobbyItemToModel called, hobbyItemId:', hobbyItemId, 'modelId:', modelId, 'section:', section)
    if (!modelId) {
      console.error('[useHobbyItems] No model ID provided')
      throw new Error('No model ID provided')
    }

    try {
      console.log('[useHobbyItems] Inserting hobby item to model')
      const { data, error: insertError } = await supabase
        .from('model_hobby_items')
        .insert({
          model_id: modelId,
          hobby_item_id: hobbyItemId,
          section: section || null
        })
        .select()

      if (insertError) {
        console.error('[useHobbyItems] Error inserting hobby item:', insertError)
        throw insertError
      }

      console.log('[useHobbyItems] Successfully added hobby item, refreshing list')
      // Refresh the model hobby items list
      await fetchModelHobbyItems()

      return data
    } catch (err) {
      console.error('[useHobbyItems] Error in addHobbyItemToModel:', err)
      throw err
    }
  }

  // Remove a hobby item from a model (doesn't delete the hobby item itself)
  const removeHobbyItemFromModel = async (modelHobbyItemId: string) => {
    const { error: deleteError } = await supabase
      .from('model_hobby_items')
      .delete()
      .eq('id', modelHobbyItemId)

    if (deleteError) throw deleteError

    // Refresh the model hobby items list
    await fetchModelHobbyItems()
  }

  // Create a new hobby item
  const createHobbyItem = async (hobbyItem: {
    name: string
    type: string
    brand?: string
    swatch?: string
  }) => {
    console.log('[useHobbyItems] createHobbyItem called:', hobbyItem)
    if (!user) {
      console.error('[useHobbyItems] User not authenticated')
      throw new Error('User not authenticated')
    }

    try {
      console.log('[useHobbyItems] Inserting new hobby item for user:', user.id)
      const { data, error: insertError } = await supabase
        .from('hobby_items')
        .insert({
          name: hobbyItem.name,
          type: hobbyItem.type,
          brand: hobbyItem.brand || null,
          swatch: hobbyItem.swatch || null,
          owner: user.id
        })
        .select()
        .single()

      if (insertError) {
        console.error('[useHobbyItems] Error inserting hobby item:', insertError)
        throw insertError
      }

      console.log('[useHobbyItems] Successfully created hobby item:', data)

      // Automatically add to user's collection
      if (data) {
        await addToCollection(data.id)
      }

      // Refresh the user hobby items list
      await fetchUserHobbyItems()

      return data
    } catch (err) {
      console.error('[useHobbyItems] Error in createHobbyItem:', err)
      throw err
    }
  }

  // Add an item to user's collection
  const addToCollection = async (hobbyItemId: number) => {
    console.log('[useHobbyItems] addToCollection START, hobbyItemId:', hobbyItemId, 'user:', user?.id)
    if (!user) {
      console.error('[useHobbyItems] User not authenticated')
      throw new Error('User not authenticated')
    }

    try {
      console.log('[useHobbyItems] Inserting into user_hobby_items table...')
      const { error: insertError } = await supabase
        .from('user_hobby_items')
        .insert({
          user_id: user.id,
          hobby_item_id: hobbyItemId
        })

      if (insertError) {
        // Ignore duplicate errors (item already in collection)
        if (insertError.code !== '23505') {
          console.error('[useHobbyItems] Error adding to collection:', insertError)
          throw insertError
        } else {
          console.log('[useHobbyItems] Item already in collection (duplicate), skipping')
        }
      } else {
        console.log('[useHobbyItems] Successfully inserted into database')
      }

      console.log('[useHobbyItems] Calling fetchUserCollection to refresh...')
      // Refresh collection
      await fetchUserCollection()
      console.log('[useHobbyItems] addToCollection END')
    } catch (err) {
      console.error('[useHobbyItems] Error in addToCollection:', err)
      throw err
    }
  }

  // Remove an item from user's collection
  const removeFromCollection = async (hobbyItemId: number) => {
    console.log('[useHobbyItems] removeFromCollection called, hobbyItemId:', hobbyItemId)
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      const { error: deleteError } = await supabase
        .from('user_hobby_items')
        .delete()
        .eq('user_id', user.id)
        .eq('hobby_item_id', hobbyItemId)

      if (deleteError) {
        console.error('[useHobbyItems] Error removing from collection:', deleteError)
        throw deleteError
      }

      console.log('[useHobbyItems] Successfully removed from collection')
      // Refresh collection
      await fetchUserCollection()
    } catch (err) {
      console.error('[useHobbyItems] Error in removeFromCollection:', err)
      throw err
    }
  }

  // Delete a hobby item
  const deleteHobbyItem = async (hobbyItemId: number) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      console.log('[useHobbyItems] Deleting hobby item:', hobbyItemId)

      const { error: deleteError } = await supabase
        .from('hobby_items')
        .delete()
        .eq('id', hobbyItemId)
        .eq('owner', user.id) // Ensure user owns the item

      if (deleteError) {
        console.error('[useHobbyItems] Error deleting hobby item:', deleteError)
        throw deleteError
      }

      console.log('[useHobbyItems] Successfully deleted hobby item')
      // Refresh the user hobby items list
      await fetchUserHobbyItems()
      await fetchPublicHobbyItems()
      if (modelId) await fetchModelHobbyItems()
    } catch (err) {
      console.error('[useHobbyItems] Error in deleteHobbyItem:', err)
      throw err
    }
  }

  // Initial fetch
  useEffect(() => {
    console.log('[useHobbyItems] useEffect triggered, user:', user?.id, 'modelId:', modelId)
    const fetchData = async () => {
      console.log('[useHobbyItems] Starting fetch data')
      setLoading(true)
      setError(null)

      await Promise.all([
        fetchUserHobbyItems(),
        fetchPublicHobbyItems(),
        fetchUserCollection(),
        modelId ? fetchModelHobbyItems() : Promise.resolve()
      ])

      console.log('[useHobbyItems] Fetch data complete, setting loading to false')
      setLoading(false)
    }

    if (user) {
      console.log('[useHobbyItems] User exists, fetching data')
      fetchData()
    } else {
      console.log('[useHobbyItems] No user, clearing data')
      setLoading(false)
      setUserHobbyItems([])
      setPublicHobbyItems([])
      setAllHobbyItems([])
      setOwnedHobbyItems([])
      setCollectionItemIds(new Set())
      setModelHobbyItems([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, modelId])

  return {
    userHobbyItems,
    publicHobbyItems,
    allHobbyItems,
    ownedHobbyItems, // Items in user's collection (for Hobby Tab display)
    modelHobbyItems,
    loading,
    error,
    addHobbyItemToModel,
    removeHobbyItemFromModel,
    createHobbyItem,
    deleteHobbyItem,
    addToCollection,
    removeFromCollection,
    refetch: async () => {
      await fetchUserHobbyItems()
      await fetchPublicHobbyItems()
      await fetchUserCollection()
      if (modelId) await fetchModelHobbyItems()
    }
  }
}
