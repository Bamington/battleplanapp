import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface ModelImage {
  id: string
  model_id: string
  image_url: string
  display_order: number
  is_primary: boolean
  created_at: string
  user_id: string
}

interface Model {
  id: string
  name: string
  status: string
  count: number
  image_url: string
  game_id: string | null
  notes: string | null
  painted_date: string | null
  purchase_date: string | null
  created_at: string
  lore_name?: string | null
  lore_description?: string | null
  painting_notes?: string | null
  public?: boolean | null
  box: {
    id: string
    name: string
    purchase_date: string
    game: {
      id: string
      name: string
      icon: string | null
      image: string | null
      default_theme: string | null
    } | null
  } | null
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
    default_theme: string | null
  } | null
  images?: ModelImage[]
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
          painted_date,
          purchase_date,
          created_at,
          lore_name,
          lore_description,
          painting_notes,
          public,
          box:boxes(
            id,
            name,
            purchase_date,
            game:games(id, name, icon, default_theme)
          ),
          game:games(id, name, icon, default_theme),
          images:model_images(
            id,
            model_id,
            image_url,
            display_order,
            is_primary,
            created_at,
            user_id
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5000)

      if (error) throw error

      // Transform the data to handle array responses from Supabase
      const transformedData = (data || []).map(model => ({
        ...model,
        box: model.box && Array.isArray(model.box) ? model.box[0] : model.box,
        game: model.game && Array.isArray(model.game) ? model.game[0] : model.game
      }))

      // Sort by purchase date (most recent first), then by created_at for models without purchase dates
      const sortedData = transformedData.sort((a, b) => {
        // Get the effective purchase date for each model (model's own or from box)
        const aDate = a.purchase_date || a.box?.purchase_date
        const bDate = b.purchase_date || b.box?.purchase_date
        
        // If both have purchase dates, sort by purchase date (most recent first)
        if (aDate && bDate) {
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        }
        
        // If only one has a purchase date, prioritize the one with purchase date
        if (aDate && !bDate) return -1
        if (!aDate && bDate) return 1
        
        // If neither has purchase date, sort by created_at (most recent first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setModels(sortedData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch models')
    } finally {
      setLoading(false)
    }
  }

  const clearCache = () => {
    // Since useModels doesn't use caching like useGames, this is a no-op
    // but we provide it for consistency with the interface
  }

  return { models, loading, error, refetch: fetchModels, clearCache }
}