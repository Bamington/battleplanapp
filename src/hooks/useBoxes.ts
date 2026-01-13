import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Box {
  id: string
  name: string
  purchase_date: string | null
  image_url: string | null
  type: string | null
  public: boolean | null
  models_count: number
  created_at: string | null
  show_carousel: boolean | null
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
  const [loadingProgress, setLoadingProgress] = useState(0)
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
      setLoadingProgress(0)
      console.log('🔄 Collections loading progress: 0%')

      if (!user?.id) {
        setBoxes([])
        return
      }

      setLoadingProgress(20)
      console.log('🔄 Collections loading progress: 20% (starting fetch)')

      // Fetch boxes with aggregated model counts using the new junction table
      const { data: boxesData, error: boxesError } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          purchase_date,
          image_url,
          type,
          public,
          created_at,
          show_carousel,
          game:games(id, name, icon, image),
          model_boxes(
            model:models(count)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (boxesError) throw boxesError

      setLoadingProgress(60)
      console.log('🔄 Collections loading progress: 60% (data received)')

      // Transform the boxes data and calculate model counts from junction table
      const transformedBoxes = (boxesData || []).map(box => {
        const modelBoxes = Array.isArray(box.model_boxes) ? box.model_boxes : []
        const totalCount = modelBoxes.reduce((sum, modelBox) => {
          const modelCount = modelBox.model?.count || 0
          return sum + modelCount
        }, 0)

        return {
          id: box.id,
          name: box.name,
          purchase_date: box.purchase_date,
          image_url: box.image_url,
          type: box.type,
          public: box.public,
          show_carousel: box.show_carousel,
          models_count: totalCount,
          created_at: box.created_at,
          game: box.game && Array.isArray(box.game) ? box.game[0] : box.game
        }
      })

      setBoxes(transformedBoxes)
      setLoadingProgress(100)
      console.log('✅ Collections loading progress: 100% (complete)')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch boxes')
    } finally {
      setLoading(false)
    }
  }

  return { boxes, loading, loadingProgress, error, refetch: fetchBoxes }
}