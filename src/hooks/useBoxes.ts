import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Box {
  id: string
  name: string
  purchase_date: string | null
  image_url: string | null
  public: boolean | null
  models_count: number
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
      if (!user?.id) {
        setBoxes([])
        return
      }

      // Fetch boxes with aggregated model counts in a single query
      const { data: boxesData, error: boxesError } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          purchase_date,
          image_url,
          public,
          game:games(id, name, icon, image),
          models(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (boxesError) throw boxesError

      // Transform the boxes data and calculate model counts
      const transformedBoxes = (boxesData || []).map(box => {
        const models = Array.isArray(box.models) ? box.models : []
        const totalCount = models.reduce((sum, model) => sum + (model.count || 0), 0)
        
        return {
          id: box.id,
          name: box.name,
          purchase_date: box.purchase_date,
          image_url: box.image_url,
          public: box.public,
          models_count: totalCount,
          game: box.game && Array.isArray(box.game) ? box.game[0] : box.game
        }
      })

      setBoxes(transformedBoxes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes')
    } finally {
      setLoading(false)
    }
  }

  return { boxes, loading, error, refetch: fetchBoxes }
}