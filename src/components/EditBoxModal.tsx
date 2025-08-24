import React, { useState, useEffect } from 'react'
import { X, Package, Calendar, DollarSign, Image as ImageIcon, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { GameDropdown } from './GameDropdown'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { ImageSearchResults } from './ImageSearchResults'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface Box {
  id: string
  name: string
  game_id?: string | null
  game?: {
    id: string
    name: string
    icon: string | null
  } | null
  purchase_date: string | null
  image_url: string | null
}

interface EditBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onBoxUpdated: () => void
  box: Box | null
}

export function EditBoxModal({ isOpen, onClose, onBoxUpdated, box }: EditBoxModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    game_id: '',
    purchase_date: '',
    image_url: ''
  })
  const [games, setGames] = useState<Game[]>([])
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const [deleteImage, setDeleteImage] = useState(false)
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [searchingImages, setSearchingImages] = useState(false)
  const [suggestedImages, setSuggestedImages] = useState<string[]>([])
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [previousSearchResults, setPreviousSearchResults] = useState<string[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (box) {
      setFormData({
        name: box.name,
        game_id: box.game_id || box.game?.id || '',
        purchase_date: box.purchase_date || '',
        image_url: box.image_url || ''
      })
    }
  }, [box])

  useEffect(() => {
    if (isOpen) {
      fetchGames()
    }
  }, [isOpen])

  // Also fetch games when box changes to ensure they're available
  useEffect(() => {
    if (isOpen && box) {
      fetchGames()
    }
  }, [isOpen, box])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, icon')
        .order('name')

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error('Error fetching games:', err)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!isValidImageFile(file)) {
        alert('Please select a valid image file')
        return
      }
      setSelectedImageFile(file)
      setImageForCropping(file)
      setShowImageCropper(true)
    }
  }

  const handleImageCropped = (croppedFile: File) => {
    setCroppedImageBlob(croppedFile)
    setShowImageCropper(false)
    setImageForCropping(null)
  }

  const handleDeleteImage = () => {
    setDeleteImage(true)
    setCroppedImageBlob(null)
    setSelectedImageFile(null)
  }

  const searchForImages = async () => {
    if (!formData.name.trim()) return

    setSearchingImages(true)
    setSuggestedImages([])
    setPreviousSearchResults([])
    
    try {
      // Get the selected game name for better search context
      const selectedGameData = games.find(g => g.id === formData.game_id)
      const gameName = selectedGameData?.name || ''
      
      // Create search query combining box name and game
      const searchQuery = `${formData.name.trim()} ${gameName}`.trim()
      
      // Call our edge function to search for images
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          count: 6
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search for images')
      }

      const data = await response.json()
      const newImages = data.images || []
      setSuggestedImages(newImages)
      setPreviousSearchResults(newImages)
      setShowImageSearch(true)
    } catch (error) {
      console.error('Error searching for images:', error)
      // Fallback to manual upload
      setShowImageSearch(false)
    } finally {
      setSearchingImages(false)
    }
  }

  const handleImageSelected = (imageUrl: string) => {
    // Store the selected URL for use during submission
    setSelectedImageUrl(imageUrl)
    setShowImageSearch(false)
  }

  const findMoreImages = async () => {
    if (!formData.name.trim()) return

    setIsLoadingMore(true)
    
    try {
      // Get the selected game name for better search context
      const selectedGameData = games.find(g => g.id === formData.game_id)
      const gameName = selectedGameData?.name || ''
      
      // Create search query combining box name and game
      const searchQuery = `${formData.name.trim()} ${gameName}`.trim()
      
      // Call our edge function to search for images
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          count: 6,
          exclude: previousSearchResults
        })
      })

      if (!response.ok) {
        throw new Error('Failed to search for more images')
      }

      const data = await response.json()
      const additionalImages = data.images || []
      
      // Combine previous and new results, avoiding duplicates
      const allImages = [...previousSearchResults, ...additionalImages]
      setSuggestedImages(allImages)
      setPreviousSearchResults(allImages)
    } catch (error) {
      console.error('Error searching for more images:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const uploadFile = async (file: Blob, bucket: string, folder: string) => {
    const fileExt = selectedImageFile?.name.split('.').pop() || 'jpg'
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!box) return

    setLoading(true)
    setError('')

    try {
      let imageUrl: string | null = formData.image_url

      // Handle image deletion
      if (deleteImage) {
        // Delete the image from storage if it exists and is from our storage
        if (formData.image_url && formData.image_url.includes('supabase')) {
          try {
            const urlParts = formData.image_url.split('/')
            const bucketIndex = urlParts.findIndex(part => part === 'model-images')
            if (bucketIndex !== -1) {
              const filePath = urlParts.slice(bucketIndex + 1).join('/')
              await supabase.storage
                .from('model-images')
                .remove([filePath])
            }
          } catch (deleteError) {
            console.warn('Failed to delete old image:', deleteError)
          }
        }
        imageUrl = null
      }
      // Use selected image URL from search results
      else if (selectedImageUrl) {
        imageUrl = selectedImageUrl
      }
      // Upload new image if selected
      else if (croppedImageBlob) {
        setCompressing(true)
        const compressedFile = await compressImage(croppedImageBlob as File, 1200, 1200, 0.8)
        imageUrl = await uploadFile(compressedFile, 'model-images', 'boxes')
      }

      const { error } = await supabase
        .from('boxes')
        .update({
          name: formData.name,
          game_id: formData.game_id || null,
          purchase_date: formData.purchase_date || null,
          image_url: imageUrl
        })
        .eq('id', box.id)

      if (error) throw error

      onBoxUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update box')
    } finally {
      setLoading(false)
      setCompressing(false)
    }
  }

  const handleDiscard = () => {
    if (box) {
      setFormData({
        name: box.name,
        game_id: box.game_id || box.game?.id || '',
        purchase_date: box.purchase_date || '',
        image_url: box.image_url || ''
      })
    }
    setSelectedImageFile(null)
    setCroppedImageBlob(null)
    setDeleteImage(false)
    setSelectedImageUrl('')
    setShowImageSearch(false)
    setSuggestedImages([])
    setPreviousSearchResults([])
    setError('')
  }

  if (!isOpen || !box) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-title">Edit Box</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Box Name */}
            <div>
              <label htmlFor="boxName" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Box Name
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-5 h-5" />
                <input
                  type="text"
                  id="boxName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                  required
                />
              </div>
            </div>

            {/* Game */}
            <div>
              <label htmlFor="game" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Game
              </label>
              <GameDropdown
                games={games}
                selectedGame={formData.game_id || ''}
                onGameSelect={(gameId) => setFormData({ ...formData, game_id: gameId })}
                placeholder="Choose a Game"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Purchase Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-5 h-5" />
                <input
                  type="date"
                  id="purchaseDate"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                />
              </div>
            </div>

            {/* Box Image */}
            <div>
              <label htmlFor="boxImage" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Box Image
              </label>
              
              {/* Current Image Display */}
              {formData.image_url && !deleteImage && (
                <div className="mb-3 p-3 border border-border-custom rounded-lg bg-bg-secondary">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={formData.image_url}
                        alt="Current box image"
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <span className="text-sm text-secondary-text">Current image</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete current image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {/* Delete Confirmation */}
              {deleteImage && (
                <div className="mb-3 p-3 border border-red-300 rounded-lg bg-red-50">
                  <p className="text-sm text-red-700">
                    ✓ Image will be deleted when you save changes
                  </p>
                </div>
              )}
              
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-5 h-5" />
                <input
                  type="file"
                  id="boxImage"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 bg-bg-primary text-text"
                />
              </div>
              {croppedImageBlob && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ New image ready for upload
                </p>
              )}
              
              {/* Image Search Button - only show if no current image and no new image selected */}
              {!formData.image_url && !croppedImageBlob && !selectedImageUrl && formData.name.trim() && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={searchForImages}
                    disabled={searchingImages}
                    className="w-full px-4 py-2 border border-amber-500 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {searchingImages ? 'Searching for images...' : 'Find images for this box'}
                  </button>
                </div>
              )}
              
              {/* Show selected image from search */}
              {selectedImageUrl && (
                <div className="mt-3 p-3 border border-green-300 rounded-lg bg-green-50">
                  <p className="text-sm text-green-700">
                    ✓ Image selected from search results
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 px-4 py-2 border border-border-custom text-text rounded-lg hover:bg-bg-secondary transition-colors font-medium"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={loading || compressing}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg transition-colors font-medium"
              >
                {compressing ? 'Processing...' : loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {imageForCropping && (
        <ImageCropper
          isOpen={showImageCropper}
          onClose={() => {
            setShowImageCropper(false)
            setImageForCropping(null)
            setSelectedImageFile(null)
          }}
          onCrop={handleImageCropped}
          imageFile={imageForCropping}
        />
      )}
      
      {showImageSearch && (
        <ImageSearchResults
          isOpen={showImageSearch}
          onClose={() => setShowImageSearch(false)}
          images={suggestedImages}
          onImageSelect={handleImageSelected}
          searchQuery={`${formData.name} ${games.find(g => g.id === formData.game_id)?.name || ''}`.trim()}
          onFindMoreImages={findMoreImages}
          isLoadingMore={isLoadingMore}
        />
      )}
    </>
  )
}