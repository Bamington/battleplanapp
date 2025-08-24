import React from 'react'
import { X, Search, RefreshCw } from 'lucide-react'

interface ImageSearchResultsProps {
  isOpen: boolean
  onClose: () => void
  images: string[]
  onImageSelect: (imageUrl: string) => void
  searchQuery: string
  onFindMoreImages?: () => void
  isLoadingMore?: boolean
}

export function ImageSearchResults({ 
  isOpen, 
  onClose, 
  images, 
  onImageSelect, 
  searchQuery, 
  onFindMoreImages, 
  isLoadingMore 
}: ImageSearchResultsProps) {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Search className="w-6 h-6 text-secondary-text" />
            <div>
              <h2 className="text-lg font-bold text-title">Suggested Images</h2>
              <p className="text-sm text-secondary-text">Search results for: "{searchQuery}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base text-secondary-text mb-4">
              No images found for "{searchQuery}". Try uploading your own image instead.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-brand hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              Upload My Own Image
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-secondary-text mb-6">
              Click on an image to use it for your box. Images are sourced from Google Image Search.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {images.map((imageUrl, index) => (
                <button
                  key={index}
                  onClick={() => onImageSelect(imageUrl)}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border---color-brand transition-all duration-200"
                >
                  <img
                    src={imageUrl}
                    alt={`Suggested image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Select Image
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Find More Images Button */}
            {onFindMoreImages && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={onFindMoreImages}
                  disabled={isLoadingMore}
                  className="flex items-center space-x-2 px-6 py-2 bg-brand hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg transition-colors font-medium"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Finding more images...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Find more images</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-border-custom text-text hover:bg-bg-secondary rounded-lg transition-colors"
              >
                Upload My Own Image Instead
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}