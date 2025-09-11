import React, { useState } from 'react'
import { X, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

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
  const [currentPage, setCurrentPage] = useState(0)
  const imagesPerPage = 4
  const totalPages = Math.ceil(images.length / imagesPerPage)
  
  // Get images for current page
  const startIndex = currentPage * imagesPerPage
  const currentImages = images.slice(startIndex, startIndex + imagesPerPage)
  
  // Reset to first page when images change
  React.useEffect(() => {
    setCurrentPage(0)
  }, [images])
  
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] modal-container"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto modal-content">
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
            className="text-secondary-text hover:text-text transition-colors p-2 rounded-full hover:bg-bg-secondary"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {images.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base text-secondary-text mb-4">
              No images found for "{searchQuery}". Try uploading your own image instead.
            </p>
            <Button
              onClick={onClose}
              variant="primary"
            >
              Upload My Own Image
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-secondary-text mb-4">
              Click on an image to use it for your box. Images are sourced from Google Image Search.
            </p>
            
            {/* Pagination Info */}
            <div className="text-center mb-4">
              <span className="text-sm text-secondary-text">
                Showing {startIndex + 1}-{Math.min(startIndex + imagesPerPage, images.length)} of {images.length} images
              </span>
            </div>
            
            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
              {currentImages.map((imageUrl, index) => (
                <Button
                  key={startIndex + index}
                  onClick={() => onImageSelect(imageUrl)}
                  variant="ghost"
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-[var(--color-brand)] transition-all duration-200 !p-0 !h-auto"
                >
                  <img
                    src={imageUrl}
                    alt={`Suggested image ${startIndex + index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <span className="text-white font-overpass font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Select Image
                    </span>
                  </div>
                </Button>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-1 mb-6">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="p-2 rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-text"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      i === currentPage
                        ? 'bg-title text-bg-primary'
                        : 'hover:bg-bg-secondary text-text'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 rounded-lg hover:bg-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed text-text"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
            
            <div className="flex justify-center space-x-4">
              {onFindMoreImages && (
                <Button
                  onClick={onFindMoreImages}
                  variant="secondary"
                  disabled={isLoadingMore}
                  icon={isLoadingMore ? RefreshCw : undefined}
                  iconClassName={isLoadingMore ? "animate-spin" : ""}
                >
                  {isLoadingMore ? 'Finding More...' : 'Find More Images'}
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
              >
                Upload My Own Image Instead
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}