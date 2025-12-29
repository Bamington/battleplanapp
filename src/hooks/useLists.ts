import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '../lib/database.types'

type List = Database['public']['Tables']['lists']['Row']
type ListInsert = Database['public']['Tables']['lists']['Insert']
type ListUpdate = Database['public']['Tables']['lists']['Update']

export interface ListWithGame extends List {
  game?: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
}

export function useLists() {
  const [lists, setLists] = useState<ListWithGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()

  const fetchLists = async () => {
    try {
      console.log('fetchLists called, user:', user?.id)
      if (!user) {
        setLists([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('lists')
        .select(`
          *,
          game:games(id, name, icon, image)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching lists:', error)
        setLists([])
      } else {
        console.log('Fetched lists:', data?.length, 'lists')
        setLists(data || [])
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      setLists([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      fetchLists()
    }
  }, [authLoading, user?.id])

  const createList = async (listData: Omit<ListInsert, 'user_id'>): Promise<List | null> => {
    try {
      if (!user) throw new Error('User not authenticated')

      console.log('Creating list with data:', { ...listData, user_id: user.id })

      const { data, error } = await supabase
        .from('lists')
        .insert({
          ...listData,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating list:', error)
        throw error
      }

      console.log('List created successfully:', data)
      await fetchLists()
      return data
    } catch (error) {
      console.error('Error creating list:', error)
      return null
    }
  }

  const updateList = async (id: string, updates: ListUpdate): Promise<List | null> => {
    try {
      const { data, error } = await supabase
        .from('lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      await fetchLists()
      return data
    } catch (error) {
      console.error('Error updating list:', error)
      return null
    }
  }

  const deleteList = async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting list with id:', id)

      const { error } = await supabase
        .from('lists')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Supabase error deleting list:', error)
        throw error
      }

      console.log('List deleted successfully, refreshing lists...')
      await fetchLists()
      console.log('Lists refreshed after deletion')
      return true
    } catch (error) {
      console.error('Error deleting list:', error)
      return false
    }
  }

  const duplicateList = async (id: string): Promise<List | null> => {
    try {
      if (!user) throw new Error('User not authenticated')

      // Get the original list with units
      const { data: originalList, error: listError } = await supabase
        .from('lists')
        .select(`
          *,
          units:units(*)
        `)
        .eq('id', id)
        .single()

      if (listError) throw listError

      // Create new list
      const { data: newList, error: newListError } = await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          game_id: originalList.game_id,
          name: `${originalList.name} (Copy)`,
          description: originalList.description,
          points_limit: originalList.points_limit
        })
        .select()
        .single()

      if (newListError) throw newListError

      // Copy units if any exist
      if (originalList.units && originalList.units.length > 0) {
        const unitsToInsert = originalList.units.map((unit: any) => ({
          list_id: newList.id,
          name: unit.name,
          type: unit.type,
          model_count: unit.model_count,
          cost: unit.cost,
          notes: unit.notes,
          display_order: unit.display_order
        }))

        const { error: unitsError } = await supabase
          .from('units')
          .insert(unitsToInsert)

        if (unitsError) throw unitsError
      }

      await fetchLists()
      return newList
    } catch (error) {
      console.error('Error duplicating list:', error)
      return null
    }
  }

  return {
    lists,
    isLoading,
    createList,
    updateList,
    deleteList,
    duplicateList,
    refreshLists: fetchLists
  }
}
