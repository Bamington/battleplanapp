import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface FriendModel {
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
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
}

interface FriendBox {
  id: string
  name: string
  purchase_date: string | null
  image_url: string | null
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

interface FriendPublicCollectionProps {
  friendId: string
  friendName: string
  onClose: () => void
}

export function FriendPublicCollection({ friendId, friendName, onClose }: FriendPublicCollectionProps) {
  const [models, setModels] = useState<FriendModel[]>([])
  const [boxes, setBoxes] = useState<FriendBox[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'models' | 'boxes'>('models')

  useEffect(() => {
    fetchFriendPublicContent()
  }, [friendId])

  const fetchFriendPublicContent = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch public models
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
          game:games(id, name, icon, image)
        `)
        .eq('user_id', friendId)
        .eq('public', true)
        .order('created_at', { ascending: false })

      if (modelsError) throw modelsError

      // Fetch public boxes
      const { data: boxesData, error: boxesError } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          purchase_date,
          image_url,
          models_count,
          created_at,
          show_carousel,
          game:games(id, name, icon, image)
        `)
        .eq('user_id', friendId)
        .eq('public', true)
        .order('created_at', { ascending: false })

      if (boxesError) throw boxesError

      setModels(modelsData || [])
      setBoxes(boxesData || [])
    } catch (err) {
      console.error('Error fetching friend public content:', err)
      setError(err instanceof Error ? err.message : 'Failed to load friend collection')
    } finally {
      setLoading(false)
    }
  }

  const renderModelCard = (model: FriendModel) => (
    <div key={model.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {model.image_url ? (
          <img
            src={model.image_url}
            alt={model.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-4xl">📦</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">{model.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {model.game?.name || 'Unknown Game'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Status: {model.status} • Count: {model.count}
        </p>
        {model.notes && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
            {model.notes}
          </p>
        )}
      </div>
    </div>
  )

  const renderBoxCard = (box: FriendBox) => (
    <div key={box.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {box.image_url ? (
          <img
            src={box.image_url}
            alt={box.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-400 dark:text-gray-500 text-4xl">📦</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">{box.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {box.game?.name || 'Unknown Game'}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {box.models_count} models
        </p>
        {box.purchase_date && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Purchased: {new Date(box.purchase_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-center items-center min-h-32">
              <div className="text-gray-500 dark:text-gray-400">Loading {friendName}'s collection...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {friendName}'s Public Collection
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('models')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'models'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Models ({models.length})
            </button>
            <button
              onClick={() => setActiveTab('boxes')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'boxes'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Collections ({boxes.length})
            </button>
          </div>

          {/* Content */}
          {activeTab === 'models' && (
            <div>
              {models.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No public models found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {models.map(renderModelCard)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'boxes' && (
            <div>
              {boxes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No public collections found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {boxes.map(renderBoxCard)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}




