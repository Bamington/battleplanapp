import React, { useState, useEffect } from 'react'
import { X, ExternalLink, Heart, Search, Palette, Loader2 } from 'lucide-react'

interface InspirationImage {
  url: string
  title: string
  source: 'reddit' | 'google'
  subreddit?: string
  author?: string
  score?: number
  thumbnail?: string | null
  snippet?: string
}

interface PaintingInspirationModalProps {
  isOpen: boolean
  onClose: () => void
  modelName: string
  gameName: string
}

export function PaintingInspirationModal({ 
  isOpen, 
  onClose, 
  modelName, 
  gameName 
}: PaintingInspirationModalProps) {
  const [images, setImages] = useState<InspirationImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen && modelName && gameName) {
      fetchInspirationImages()
    }
  }, [isOpen, modelName, gameName])

  const fetchInspirationImages = async () => {
    setLoading(true)
    setError(null)
    setImages([])

    try {
      const params = new URLSearchParams({
        modelName,
        gameName
      })

      const response = await fetch(`/api/painting-inspiration?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inspiration images')
      }

      setImages(data.images || [])
    } catch (err) {
      console.error('Error fetching inspiration:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inspiration images')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const toggleFavorite = (imageUrl: string) => {
    const newFavorites = new Set(favorites)
    if (favorites.has(imageUrl)) {
      newFavorites.delete(imageUrl)
    } else {
      newFavorites.add(imageUrl)
    }
    setFavorites(newFavorites)
  }

  const openImageInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'reddit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'google': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border-custom flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand/10 rounded-lg">
              <Palette className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-title">Painting Inspiration</h2>
              <p className="text-sm text-secondary-text">
                {modelName} • {gameName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <div>
                  <p className="text-title font-medium">Finding painting inspiration...</p>
                  <p className="text-sm text-secondary-text mt-1">
                    Searching Reddit and other sources for {modelName} images
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-md mx-auto">
                <Search className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                  Search Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {error}
                </p>
                <button
                  onClick={fetchInspirationImages}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-title mb-2">No Images Found</h3>
              <p className="text-secondary-text max-w-md mx-auto">
                We couldn't find any painting inspiration for "{modelName}" from {gameName}. 
                Try searching manually on Reddit or Cool Mini or Not.
              </p>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-title mb-2">
                  Found {images.length} inspiration image{images.length !== 1 ? 's' : ''}
                </h3>
                <p className="text-xs text-secondary-text">
                  Click images to view full size • Heart to save favorites • External link to view source
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    className="group bg-bg-card border border-border-custom rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-bg-secondary">
                      <img
                        src={image.thumbnail || image.url}
                        alt={image.title}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => openImageInNewTab(image.url)}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src !== image.url) {
                            target.src = image.url
                          } else {
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center">
                                  <div class="text-center">
                                    <div class="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                      <Palette class="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p class="text-xs text-gray-500">Image unavailable</p>
                                  </div>
                                </div>
                              `
                            }
                          }
                        }}
                        loading="lazy"
                      />
                      
                      {/* Overlay controls */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleFavorite(image.url)
                            }}
                            className={`p-2 rounded-full transition-all duration-200 ${
                              favorites.has(image.url)
                                ? 'bg-red-500 text-white'
                                : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${favorites.has(image.url) ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openImageInNewTab(image.url)
                            }}
                            className="p-2 bg-white bg-opacity-90 text-gray-700 rounded-full hover:bg-opacity-100 transition-all duration-200"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(image.source)}`}>
                          {image.source === 'reddit' ? `r/${image.subreddit}` : image.source}
                        </span>
                        {image.score && (
                          <span className="text-xs text-secondary-text">
                            ↑ {image.score}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-sm font-medium text-title line-clamp-2 mb-1">
                        {image.title}
                      </h4>
                      
                      {image.author && (
                        <p className="text-xs text-secondary-text">
                          by u/{image.author}
                        </p>
                      )}
                      
                      {image.snippet && (
                        <p className="text-xs text-secondary-text line-clamp-2 mt-1">
                          {image.snippet}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 border-t border-border-custom flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-xs text-secondary-text">
              {favorites.size > 0 && `${favorites.size} favorite${favorites.size !== 1 ? 's' : ''} saved`}
            </div>
            <button
              onClick={onClose}
              className="btn-ghost"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}