import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Opponent {
  id: number
  opp_name: string | null
  opp_rel_uuid: string | null
  created_by: string | null
  created_at: string
}

export function useOpponents() {
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [loading, setLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const fetchOpponents = async (isRefetch = false) => {
    // Show loading while auth is loading
    if (authLoading) {
      setLoading(true)
      setHasInitialized(false)
      return
    }

    if (!user) {
      setOpponents([])
      setLoading(false)
      setHasInitialized(true)
      return
    }

    const startTime = Date.now()
    // Only apply minimum loading time for initial loads, not refetches
    const minLoadingTime = isRefetch ? 0 : 500

    try {
      // Only show loading for initial loads, not refetches
      if (!isRefetch) {
        setLoading(true)
      }
      
      const { data, error } = await supabase
        .from('opponents')
        .select('*')
        .order('opp_name', { ascending: true })

      if (error) {
        console.error('Error fetching opponents:', error)
        setOpponents([])
      } else {
        setOpponents(data || [])
      }
    } catch (error) {
      console.error('Error fetching opponents:', error)
      setOpponents([])
    } finally {
      // Ensure minimum loading time for better UX (only for initial loads)
      const elapsedTime = Date.now() - startTime
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime)
      
      setTimeout(() => {
        // For refetches, ensure loading is turned off if it was on
        // For initial loads, always set loading to false
        if (isRefetch) {
          if (loading) {
            setLoading(false)
          }
        } else {
          setLoading(false)
        }
        setHasInitialized(true)
      }, remainingTime)
    }
  }

  useEffect(() => {
    fetchOpponents()
  }, [user, authLoading])

  const refetch = () => {
    fetchOpponents(true) // Pass true to indicate this is a refetch
  }

  const createOpponent = async (oppName: string): Promise<Opponent | null> => {
    if (!user || !oppName.trim()) {
      console.log('createOpponent: missing user or empty name', { user: !!user, oppName })
      return null
    }

    console.log('createOpponent: attempting to create opponent:', oppName.trim(), 'for user:', user.id)
    try {
      const { data, error } = await supabase
        .from('opponents')
        .insert({
          opp_name: oppName.trim(),
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating opponent:', error)
        return null
      }

      console.log('createOpponent: successfully created opponent:', data)
      // Add to local state
      setOpponents(prev => [...prev, data].sort((a, b) => 
        (a.opp_name || '').localeCompare(b.opp_name || '')
      ))

      return data
    } catch (error) {
      console.error('Error creating opponent:', error)
      return null
    }
  }

  const findOrCreateOpponent = async (oppName: string): Promise<Opponent | null> => {
    if (!oppName.trim()) {
      console.log('findOrCreateOpponent: empty name provided')
      return null
    }

    console.log('findOrCreateOpponent: looking for opponent:', oppName.trim())
    console.log('findOrCreateOpponent: available opponents:', opponents)

    // First, try to find existing opponent
    const existingOpponent = opponents.find(opp => 
      opp.opp_name?.toLowerCase() === oppName.trim().toLowerCase()
    )

    if (existingOpponent) {
      console.log('findOrCreateOpponent: found existing opponent:', existingOpponent)
      return existingOpponent
    }

    console.log('findOrCreateOpponent: no existing opponent found, creating new one')
    // If not found, create new opponent
    const newOpponent = await createOpponent(oppName)
    console.log('findOrCreateOpponent: createOpponent result:', newOpponent)
    return newOpponent
  }

  return {
    opponents,
    loading,
    hasInitialized,
    refetch,
    createOpponent,
    findOrCreateOpponent
  }
}
