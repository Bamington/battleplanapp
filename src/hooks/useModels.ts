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
      // First, get models with their basic data and game info
      const { data: modelsData, error: modelsError } = await supabase
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

      if (modelsError) throw modelsError

      // Get model-box relationships with box details
      // Split into chunks to avoid URL length limits
      const modelIds = (modelsData || []).map(model => model.id)
      const chunkSize = 100 // Process 100 models at a time
      const modelBoxData: any[] = []

      for (let i = 0; i < modelIds.length; i += chunkSize) {
        const chunk = modelIds.slice(i, i + chunkSize)

        const { data: chunkData, error: chunkError } = await supabase
          .from('model_boxes')
          .select(`
            model_id,
            box:boxes(
              id,
              name,
              purchase_date,
              game:games(id, name, icon, default_theme)
            )
          `)
          .in('model_id', chunk)

        if (chunkError) throw chunkError

        if (chunkData) {
          modelBoxData.push(...chunkData)
        }
      }

      // Create a map of model_id to box data
      const modelBoxMap = new Map()
      modelBoxData?.forEach(relationship => {
        if (relationship.box) {
          const box = Array.isArray(relationship.box) ? relationship.box[0] : relationship.box
          modelBoxMap.set(relationship.model_id, box)
        }
      })

      // Transform the data to include box information
      const transformedData = (modelsData || []).map(model => ({
        ...model,
        box: modelBoxMap.get(model.id) || null,
        game: model.game && Array.isArray(model.game) ? model.game[0] : model.game
      }))

      // Sort by purchase date (most recent first), then by created_at for models without purchase dates
      const sortedData = transformedData.sort((a, b) => {
        // Use the model's purchase date (now always set to earliest from collections)
        const aDate = a.purchase_date
        const bDate = b.purchase_date
        
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