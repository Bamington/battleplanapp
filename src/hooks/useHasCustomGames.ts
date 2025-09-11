import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useHasCustomGames() {
  const [hasCustomGames, setHasCustomGames] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const checkCustomGames = async () => {
    if (!user) {
      setHasCustomGames(false)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('games')
        .select('id')
        .eq('created_by', user.id)
        .limit(1)

      if (error) {
        console.error('Error checking custom games:', error)
        setHasCustomGames(false)
      } else {
        setHasCustomGames((data?.length || 0) > 0)
      }
    } catch (err) {
      console.error('Error checking custom games:', err)
      setHasCustomGames(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkCustomGames()
  }, [user])

  // Function to refresh the check (useful after creating/deleting custom games)
  const refresh = () => {
    setLoading(true)
    checkCustomGames()
  }

  return { hasCustomGames, loading, refresh }
}