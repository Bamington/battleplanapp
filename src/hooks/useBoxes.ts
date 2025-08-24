import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Box {
  id: string
  name: string
  purchase_date: string
  image_url: string
  public: boolean
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
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
          public,
          game:games(id, name, icon, image)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Transform the data to match our interface
      const transformedData = (data || []).map(box => ({
        ...box,
        game: box.game && Array.isArray(box.game) ? box.game[0] : box.game
      }))

      setBoxes(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes')
    } finally {
      setLoading(false)
    }
  }

  return { boxes, loading, error, refetch: fetchBoxes }
}