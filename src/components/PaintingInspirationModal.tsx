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
  const [usedSearchQueries, setUsedSearchQueries] = useState<string[]>([])

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
      // Create search queries for inspiration images
      const searchQueries = [
        `${modelName} ${gameName} painted miniature`,
        `${modelName} ${gameName} painting guide`,
        `${modelName} color scheme painting`,
        `${gameName} miniature painting inspiration`
      ]

      console.log('🔍 Starting inspiration search with queries:', searchQueries)
      console.log('🌐 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      
      // Store the search queries for display
      setUsedSearchQueries(searchQueries)

      // Use the same Supabase Edge Function as other image searches
      const responses = await Promise.all(
        searchQueries.map(async (query, index) => {
          console.log(`📡 Making request ${index + 1}/4 for query: "${query}"`)
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              count: 5 // Get fewer per query to get variety
            })
          })
          console.log(`📨 Response ${index + 1} status:`, response.status, response.statusText)
          return response
        })
      )

      // Collect all images from all search queries
      const allImages: InspirationImage[] = []
      
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i]
        console.log(`🔍 Processing response ${i + 1}:`, response.ok ? '✅ OK' : '❌ Failed')
        
        if (response.ok) {
          const data = await response.json()
          console.log(`📋 Response ${i + 1} data:`, data)
          
          if (data.images && Array.isArray(data.images)) {
            console.log(`📸 Found ${data.images.length} raw images in response ${i + 1}`)
            console.log(`🔍 Sample image data:`, data.images[0])
            
            // Convert to InspirationImage format, filtering out invalid entries
            const convertedImages = data.images
              .filter((img: any) => {
                const hasUrl = !!(img.url || img.link)
                if (!hasUrl) console.log('❌ Filtered out image with no URL:', img)
                return hasUrl
              })
              .map((img: any) => {
                const converted = {
                  url: String(img.url || img.link || ''),
                  title: String(img.title || `${modelName} inspiration`),
                  source: 'google' as const,
                  thumbnail: String(img.thumbnailUrl || img.url || img.link || ''),
                  snippet: String(img.snippet || '')
                }
                console.log('🔄 Converted image:', { original: img, converted })
                return converted
              })
              .filter(img => {
                const isValid = img.url && typeof img.url === 'string' && img.url.trim() !== ''
                if (!isValid) console.log('❌ Filtered out invalid URL:', img.url)
                return isValid
              })
            
            console.log(`✅ Response ${i + 1} yielded ${convertedImages.length} valid images`)
            allImages.push(...convertedImages)
          } else {
            console.log(`⚠️ Response ${i + 1} has no images array:`, data)
          }
        } else {
          const errorText = await response.text()
          console.log(`❌ Response ${i + 1} failed:`, response.status, errorText)
        }
      }

      // Remove duplicates and limit results
      console.log(`🔄 Total images collected: ${allImages.length}`)
      const uniqueImages = allImages.filter((img, index, arr) => 
        arr.findIndex(other => other.url === img.url) === index
      ).slice(0, 20) // Limit to 20 images

      console.log(`✅ Final unique images: ${uniqueImages.length}`)
      console.log('📋 Final image URLs:', uniqueImages.map(img => img.url))
      
      setImages(uniqueImages)
      
      // If no images found, try a simpler search
      if (uniqueImages.length === 0) {
        console.log('🔄 No images found with detailed searches, trying simpler fallback query...')
        const fallbackQuery = `${gameName} miniature painting`
        console.log('🔍 Fallback query:', fallbackQuery)
        
        const simpleResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: fallbackQuery,
            count: 10
          })
        })

        console.log('📨 Fallback response status:', simpleResponse.status, simpleResponse.statusText)

        if (simpleResponse.ok) {
          const simpleData = await simpleResponse.json()
          console.log('📋 Fallback response data:', simpleData)
          
          if (simpleData.images && Array.isArray(simpleData.images)) {
            console.log(`📸 Fallback found ${simpleData.images.length} raw images`)
            
            const fallbackImages = simpleData.images
              .filter((img: any) => {
                const hasUrl = !!(img.url || img.link)
                if (!hasUrl) console.log('❌ Fallback filtered out image with no URL:', img)
                return hasUrl
              })
              .map((img: any) => ({
                url: String(img.url || img.link || ''),
                title: String(img.title || `${gameName} painting inspiration`),
                source: 'google' as const,
                thumbnail: String(img.thumbnailUrl || img.url || img.link || ''),
                snippet: String(img.snippet || '')
              }))
              .filter(img => {
                const isValid = img.url && typeof img.url === 'string' && img.url.trim() !== ''
                if (!isValid) console.log('❌ Fallback filtered out invalid URL:', img.url)
                return isValid
              })
              
            console.log(`✅ Fallback yielded ${fallbackImages.length} valid images`)
            setImages(fallbackImages)
          } else {
            console.log('⚠️ Fallback response has no images array:', simpleData)
          }
        } else {
          const fallbackErrorText = await simpleResponse.text()
          console.log('❌ Fallback search failed:', simpleResponse.status, fallbackErrorText)
        }
      }
    } catch (err) {
      console.error('Error fetching inspiration:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inspiration images. Please check your internet connection and try again.')
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
                    Searching for {modelName} painting guides and color schemes
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
              <p className="text-secondary-text max-w-md mx-auto mb-6">
                We couldn't find any painting inspiration for "{modelName}" from {gameName}. 
                Try searching manually on Reddit, Cool Mini or Not, or Pinterest.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                <button
                  onClick={fetchInspirationImages}
                  className="btn-secondary btn-with-icon"
                >
                  <Search className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <a
                  href={`https://www.reddit.com/search/?q=${encodeURIComponent(modelName + ' ' + gameName + ' painted')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary btn-with-icon"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Search Reddit</span>
                </a>
              </div>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-title mb-2">
                  Found {images.length} inspiration image{images.length !== 1 ? 's' : ''}
                </h3>
                
                {/* Search queries used */}
                {usedSearchQueries.length > 0 && (
                  <div className="mb-3 p-3 bg-bg-secondary rounded-lg border border-border-custom">
                    <p className="text-xs font-medium text-secondary-text mb-2">Search queries used:</p>
                    <div className="space-y-1">
                      {usedSearchQueries.map((query, index) => (
                        <div key={index} className="text-xs text-text font-mono bg-bg-primary px-2 py-1 rounded border">
                          "{query}"
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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
                      {(image.url || image.thumbnail) ? (
                        <img
                          src={image.url || image.thumbnail}
                          alt={image.title || 'Painting inspiration'}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openImageInNewTab(image.url)}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (target.src !== image.thumbnail && image.thumbnail) {
                              target.src = image.thumbnail
                            } else {
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <div class="text-center">
                                      <div class="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        <svg class="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M9.5 3A6.5 6.5 0 003 9.5v5A6.5 6.5 0 009.5 21h5a6.5 6.5 0 006.5-6.5v-5A6.5 6.5 0 0014.5 3h-5zM11 5h2a2 2 0 012 2v.5a.5.5 0 00.5.5 2.5 2.5 0 010 5 .5.5 0 00-.5.5v.5a2 2 0 01-2 2h-2a2 2 0 01-2-2v-.5a.5.5 0 00-.5-.5 2.5 2.5 0 010-5 .5.5 0 00.5-.5V7a2 2 0 012-2z"/>
                                        </svg>
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
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto mb-2 flex items-center justify-center">
                              <Palette className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500">No image available</p>
                          </div>
                        </div>
                      )}
                      
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