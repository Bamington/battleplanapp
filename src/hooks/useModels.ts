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
    id: string
    name: string
    purchase_date: string
    game: {
      id: string
      name: string
      icon: string | null
      image: string | null
    } | null
  } | null
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
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
            id,
            name,
            purchase_date,
            game:games(id, name, icon, image)
          ),
          game:games(id, name, icon, image)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to handle array responses from Supabase
      const transformedData = (data || []).map(model => ({
        ...model,
        box: model.box && Array.isArray(model.box) ? model.box[0] : model.box,
        game: model.game && Array.isArray(model.game) ? model.game[0] : model.game
      }))

      setModels(transformedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }

  return { models, loading, error, refetch: fetchModels }
}