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
          <Button
            onClick={onClose}
            variant="ghost"
            icon={X}
            className="!p-2"
          />
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
                <button
                  key={startIndex + index}
                  onClick={() => onImageSelect(imageUrl)}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-transparent hover:border-[var(--color-brand)] transition-all duration-200"
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
                </button>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mb-6">
                <Button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  variant="ghost"
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      variant={i === currentPage ? "primary" : "ghost"}
                      className="!w-8 !h-8 !min-w-8 !rounded-full !text-sm"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  variant="ghost"
                  icon={ChevronRight}
                >
                  Next
                </Button>
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