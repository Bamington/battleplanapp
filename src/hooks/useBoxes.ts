import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Box {
  id: string
  name: string
  purchase_date: string
  image_url: string
  game: {
    name: string
  }
}

export function useBoxes() {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      setBoxes([])
      setLoading(false)
      return
    }

    fetchBoxes()
  }, [user])

  const fetchBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          purchase_date,
          image_url,
          game:games(name, image, icon)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setBoxes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes')
    } finally {
      setLoading(false)
    }
  }

  return { boxes, loading, error, refetch: fetchBoxes }
}