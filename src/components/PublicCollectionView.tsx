import React, { useState, useEffect } from 'react'
import { Calendar, Package, Users, Globe, User, Moon, Sun, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useDarkMode } from '../hooks/useDarkMode'
import { getBasePath } from '../utils/environment'
import battleplanLogo from '/Battleplan-Logo-Purple.svg'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PublicCollectionViewProps {
  collectionId: string
  onBack?: () => void
}

interface Collection {
  id: string
  name: string
  purchase_date: string | null
  image_url: string | null
  public: boolean | null
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
}

interface Model {
  id: string
  name: string
  status: string | null
  count: number | null
  image_url: string | null
  notes: string | null
  game: {
    id: string
    name: string
    icon: string | null
  } | null
}

export function PublicCollectionView({ collectionId, onBack }: PublicCollectionViewProps) {
  const [collection, setCollection] = useState<Collection | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useDarkMode()

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isProfileMenuOpen && !target.closest('.profile-dropdown')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileMenuOpen])

  useEffect(() => {
    fetchCollection()
  }, [collectionId])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch the collection details
      const { data: collectionData, error: collectionError } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          purchase_date,
          image_url,
          public,
          game:games(
            id,
            name,
            icon,
            image
          )
        `)
        .eq('id', collectionId)
        .eq('public', true)
        .single()

      if (collectionError) {
        if (collectionError.code === 'PGRST116') {
          // No rows returned - collection not found or not public
          setNotFound(true)
        } else {
          throw collectionError
        }
        return
      }

      setCollection(collectionData)

      // Fetch models in this collection
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select(`
          id,
          name,
          status,
          count,
          image_url,
          notes,
          game:games(
            id,
            name,
            icon
          )
        `)
        .eq('box_id', collectionId)
        .order('created_at', { ascending: false })

      if (modelsError) throw modelsError
      setModels(modelsData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

     const getImageSrc = () => {
     if (!collection) return ''
     
     // Check if we have a valid collection image URL
     if (collection.image_url && 
         typeof collection.image_url === 'string' &&
         collection.image_url.trim() !== '' && 
         collection.image_url !== 'undefined' && 
         collection.image_url !== 'null' &&
         (collection.image_url.startsWith('http') || collection.image_url.startsWith('/'))) {
       return collection.image_url
     }
     
     // Try to use the game's image as fallback
     const gameImage = collection.game?.image
     if (gameImage && 
         typeof gameImage === 'string' &&
         gameImage.trim() !== '' && 
         gameImage !== 'undefined' && 
         gameImage !== 'null' &&
         gameImage.startsWith('http')) {
       return gameImage
     }
     
     // Final fallback to default image
     return 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
   }

       const getLogoImageSrc = () => {
      return isDarkMode ? 'Logo White.svg' : 'Battleplan-Logo-Purple.svg'
    }

  const getModelImageSrc = (model: Model) => {
    // Check if we have a valid model image URL
    if (model.image_url && 
        typeof model.image_url === 'string' &&
        model.image_url.trim() !== '' && 
        model.image_url !== 'undefined' && 
        model.image_url !== 'null' &&
        (model.image_url.startsWith('http') || model.image_url.startsWith('/'))) {
      return { src: model.image_url, isGameFallback: false }
    }
    
    // Try to use the game's icon as fallback
    const gameIcon = model.game?.icon
    if (gameIcon && 
        typeof gameIcon === 'string' &&
        gameIcon.trim() !== '' && 
        gameIcon !== 'undefined' && 
        gameIcon !== 'null' &&
        gameIcon.startsWith('http')) {
      return { src: gameIcon, isGameFallback: true }
    }
    
    // Fallback to default image
    return { src: 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg', isGameFallback: false }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Painted': return 'bg-green-100 text-green-800'
      case 'Partially Painted': return 'bg-yellow-100 text-yellow-800'
      case 'Primed': return 'bg-blue-100 text-blue-800'
      case 'Assembled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleBackClick = () => {
    window.history.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-200 rounded mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound || error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-title mb-2">
            {notFound ? 'Collection Not Found' : 'Error Loading Collection'}
          </h1>
          <p className="text-secondary-text mb-6">
            {notFound 
              ? 'This collection may be private or no longer exists.'
              : error || 'Something went wrong while loading the collection.'
            }
          </p>
          <button
            onClick={onBack || handleBackClick}
            className="btn-secondary"
          >
            <span>Go Back</span>
          </button>
        </div>
      </div>
    )
  }

  if (!collection) {
    return null
  }

                     return (
               <div className="min-h-screen bg-bg-primary px-[10%] pt-6">
         {onBack ? (
           <>
             {/* Preview Banner */}
             <div className="bg-[var(--color-brand)] text-white px-4 py-3">
               <div className="max-w-4xl mx-auto flex items-center justify-between">
                 <button
                   onClick={onBack}
                   className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
                 >
                   <ArrowLeft className="w-4 h-4" />
                   <span className="text-sm font-medium">Back</span>
                 </button>
                 <span className="text-sm font-medium">This is just a preview.</span>
                 <div className="w-16"></div> {/* Spacer for centering */}
               </div>
             </div>
           </>
                   ) : null}

                               {/* Full-width Hero Image */}
                     <div className="w-full relative">
                          <img
                src={getImageSrc()}
                alt={collection.name}
                className="w-full max-h-[70vh] object-contain rounded-lg"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  const fallbackUrl = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                  if (target.src !== fallbackUrl) {
                    target.src = fallbackUrl
                  }
                }}
              />
           </div>

        {/* Content Container */}
        <div className="max-w-4xl mx-auto py-8">
        {/* Collection Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-title mb-4 text-center">{collection.name}</h1>
        </div>

        {/* Collection Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Game Info */}
          <div className="bg-bg-card rounded-lg p-6 border border-border-custom">
            <div className="flex items-center space-x-4">
              {collection.game?.icon ? (
                <img
                  src={collection.game.icon}
                  alt={`${collection.game.name} icon`}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'flex'
                    }
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'none'
                    }
                  }}
                />
              ) : null}
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: collection.game?.icon ? 'none' : 'flex' }}>
                <span className="text-white text-sm font-bold">
                  {(collection.game?.name || 'Unknown Game').charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-text">Game</h3>
                <p className="text-secondary-text">{collection.game?.name || 'Unknown Game'}</p>
              </div>
            </div>
          </div>

          {/* Purchase Date */}
          {collection.purchase_date && (
            <div className="bg-bg-card rounded-lg p-6 border border-border-custom">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-secondary-text" />
                <div>
                  <h3 className="font-semibold text-text">Purchase Date</h3>
                  <p className="text-secondary-text">{formatDate(collection.purchase_date)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Models Section */}
        <div className="bg-bg-card rounded-lg border border-border-custom overflow-hidden">
          <div className="p-6 border-b border-border-custom">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-secondary-text" />
              <h2 className="text-xl font-bold text-title">Models ({models.length})</h2>
            </div>
          </div>

          {models.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <p className="text-secondary-text">No models in this collection.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-custom">
              {models.map((model) => (
                                 <div 
                   key={model.id} 
                   className="p-6 hover:bg-bg-secondary transition-colors cursor-pointer"
                   onClick={() => {
                     const params = new URLSearchParams({
                       from: collectionId,
                       collectionName: encodeURIComponent(collection?.name || '')
                     })
                     window.location.href = `/shared/model/${model.id}?${params.toString()}`
                   }}
                 >
                  <div className="flex items-start space-x-4">
                    {/* Model Image */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const imageData = getModelImageSrc(model)
                        return (
                          <img
                            src={imageData.src}
                            alt={model.name}
                            className={`w-16 h-16 object-cover rounded ${imageData.isGameFallback ? 'opacity-10' : ''}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                            }}
                          />
                        )
                      })()}
                    </div>

                    {/* Model Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text mb-2">{model.name}</h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-secondary-text mb-2">
                        {model.count && (
                          <span>{model.count} model{model.count !== 1 ? 's' : ''}</span>
                        )}
                        {model.status && model.status !== 'None' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(model.status)}`}>
                            {model.status}
                          </span>
                        )}
                      </div>

                      {model.notes && (
                        <div className="text-sm text-secondary-text">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className="prose prose-sm max-w-none"
                            components={{
                              p: ({ children }) => <p className="mb-1 last:mb-0 text-sm text-secondary-text">{children}</p>,
                              h1: ({ children }) => <h1 className="text-sm font-bold mb-1 text-secondary-text">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-bold mb-1 text-secondary-text">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-xs font-bold mb-1 text-secondary-text">{children}</h3>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                              li: ({ children }) => <li className="text-sm text-secondary-text">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-secondary-text">{children}</strong>,
                              em: ({ children }) => <em className="italic text-secondary-text">{children}</em>,
                              code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                              pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-1 rounded text-xs font-mono overflow-x-auto mb-1">{children}</pre>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-2 italic mb-1 text-secondary-text">{children}</blockquote>,
                            }}
                          >
                            {model.notes}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border-custom">
          <div className="flex items-center justify-center space-x-4">
            <img src={getLogoImageSrc()} alt="BattlePlan" className="h-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
