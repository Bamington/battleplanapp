import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string
  game_id: string | null
  notes: string | null
  box: {
    name: string
    purchase_date: string
    game: {
      name: string
    } | null
  } | null
  game: {
    name: string
  } | null
}

export function useModels() {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setModels([])
      setLoading(false)
      return
    }

    fetchModels()
  }, [user])

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select(`
          id,
          name,
          status,
          count,
          image_url,
          game_id,
          notes,
          box:boxes(
            name,
            purchase_date,
            id,
            game:games(name, icon)
          ),
          game:games(name, icon)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setModels(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }

  return { models, loading, error, refetch: fetchModels }
}