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

      // First, fetch all boxes
      const { data: boxesData, error: boxesError } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          purchase_date,
          image_url,
          public,
          game:games(id, name, icon, image)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (boxesError) throw boxesError

      // Transform the boxes data
      const transformedBoxes = (boxesData || []).map(box => ({
        ...box,
        game: box.game && Array.isArray(box.game) ? box.game[0] : box.game
      }))

      // Fetch model counts for each box
      const boxesWithCounts = await Promise.all(
        transformedBoxes.map(async (box) => {
          const { data: modelsData, error: modelsError } = await supabase
            .from('models')
            .select('count')
            .eq('box_id', box.id)

          if (modelsError) {
            console.error(`Error fetching models for box ${box.id}:`, modelsError)
            return { ...box, models_count: 0 }
          }

          // Sum up the count field from all models in this box
          const totalCount = (modelsData || []).reduce((sum, model) => {
            return sum + (model.count || 0)
          }, 0)

          return { ...box, models_count: totalCount }
        })
      )

      setBoxes(boxesWithCounts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes')
    } finally {
      setLoading(false)
    }
  }

  return { boxes, loading, error, refetch: fetchBoxes }
}