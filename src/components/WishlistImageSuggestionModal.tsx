import React, { useState, useEffect } from 'react'
import { X, Search, RefreshCw, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { Button } from './Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

interface WishlistImageSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  itemName: string
  wishlistItemId: number
  onSuccess?: () => void
}

export function WishlistImageSuggestionModal({ 
  isOpen, 
  onClose, 
  itemName, 
  wishlistItemId,
  onSuccess 
}: WishlistImageSuggestionModalProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [searchingImages, setSearchingImages] = useState(false)
  const [suggestedImages, setSuggestedImages] = useState<string[]>([])
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [savingImage, setSavingImage] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  
  const imagesPerPage = 4
  const totalPages = Math.ceil(suggestedImages.length / imagesPerPage)
  
  // Get images for current page
  const startIndex = currentPage * imagesPerPage
  const currentImages = suggestedImages.slice(startIndex, startIndex + imagesPerPage)
  
  // Search for images when modal opens
  useEffect(() => {
    if (isOpen && itemName) {
      searchForImages()
    }
  }, [isOpen, itemName])
  
  // Reset to first page when images change
  useEffect(() => {
    setCurrentPage(0)
  }, [suggestedImages])

  const searchForImages = async () => {
    if (!itemName.trim()) return

    setSearchingImages(true)
    setSuggestedImages([])
    setError('')
    
    try {
      // Create search query with the item name
      const baseQuery = itemName.trim()
      
      // Search for images using the same API as AddBoxModal
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: baseQuery,
          count: 12 // Get more images for wishlist suggestions
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search for images')
      }

      const data = await response.json()
      const images = (data.images || []).map((img: any) => typeof img === 'string' ? img : img.url)
      
      setSuggestedImages(images)
    } catch (error) {
      console.error('Error searching for images:', error)
      setError('Failed to search for images. Please try again.')
    } finally {
      setSearchingImages(false)
    }
  }

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
  }

  const handleSaveImage = async () => {
    if (!selectedImageUrl || !user) return

    setSavingImage(true)
    setError('')

    try {
      // Update the wishlist item with the selected image
      const { error } = await supabase
        .from('wishlist')
        .update({ 
          image_url: selectedImageUrl 
        })
        .eq('id', wishlistItemId)
        .eq('user_uid', user.id) // Ensure user can only update their own items

      if (error) {
        throw error
      }

      // Success
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving image to wishlist item:', error)
      setError('Failed to save image. Please try again.')
    } finally {
      setSavingImage(false)
    }
  }

  const handleSkip = () => {
    // Close without saving an image
    onClose()
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))
  }

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0))
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

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
              <h2 className="text-lg font-bold text-title">Add Image to Wishlist Item</h2>
              <p className="text-sm text-secondary-text">Choose an image for: "{itemName}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors p-2 rounded-full hover:bg-bg-secondary"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {searchingImages ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-secondary-text mx-auto mb-4 animate-spin" />
            <p className="text-base text-secondary-text">
              Searching for images...
            </p>
          </div>
        ) : suggestedImages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base text-secondary-text mb-4">
              No images found for "{itemName}". You can skip this step and add an image later.
            </p>
            <Button
              onClick={handleSkip}
              variant="secondary"
            >
              Skip for Now
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-secondary-text mb-4">
              Select an image to add to your wishlist item, or skip to add one later.
            </p>
            
            {/* Pagination Info */}
            <div className="text-center mb-4">
              <span className="text-sm text-secondary-text">
                Showing {startIndex + 1}-{Math.min(startIndex + imagesPerPage, suggestedImages.length)} of {suggestedImages.length} images
              </span>
            </div>
            
            {/* 2x2 Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg mx-auto">
              {currentImages.map((imageUrl, index) => (
                <Button
                  key={startIndex + index}
                  onClick={() => handleImageSelect(imageUrl)}
                  variant="ghost"
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all duration-200 !p-0 !h-auto ${
                    selectedImageUrl === imageUrl
                      ? 'border-brand shadow-md'
                      : 'border-transparent hover:border-brand'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Suggested image ${startIndex + index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className={`absolute inset-0 transition-all duration-200 flex items-center justify-center ${
                    selectedImageUrl === imageUrl
                      ? 'bg-brand bg-opacity-20'
                      : 'bg-black bg-opacity-0 group-hover:bg-opacity-20'
                  }`}>
                    {selectedImageUrl === imageUrl ? (
                      <Check className="w-8 h-8 text-white font-medium" />
                    ) : (
                      <span className="text-white font-overpass font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Select Image
                      </span>
                    )}
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleSkip}
                variant="secondary"
                disabled={savingImage}
              >
                Skip for Now
              </Button>
              
              <Button
                onClick={handleSaveImage}
                variant="primary"
                disabled={!selectedImageUrl || savingImage}
                icon={savingImage ? RefreshCw : Check}
              >
                {savingImage ? 'Saving...' : 'Add Selected Image'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}