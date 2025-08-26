import React, { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Image } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { GameDropdown } from './GameDropdown'
import { useRecentGames } from '../hooks/useRecentGames'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { ImageSearchResults } from './ImageSearchResults'
import { Button } from './Button'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface AddBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onAddModelsToBox?: (boxId: string) => void
}

export function AddBoxModal({ isOpen, onClose, onSuccess }: AddBoxModalProps) {
  const [boxName, setBoxName] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [displayPrice, setDisplayPrice] = useState('')
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const [fileSizeError, setFileSizeError] = useState('')
  const [compressionInfo, setCompressionInfo] = useState('')
  const { user } = useAuth()
  const { addRecentGame } = useRecentGames()
  const [showImageSearch, setShowImageSearch] = useState(false)
  const [searchingImages, setSearchingImages] = useState(false)
  const [suggestedImages, setSuggestedImages] = useState<string[]>([])
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [previousSearchResults, setPreviousSearchResults] = useState<string[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Store the last created box ID
  let lastCreatedBoxId: string | null = null

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchGames()
    }
  }, [isOpen])

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

  const getFavoriteGames = () => {
    if (!user?.fav_games || user.fav_games.length === 0) return []
    return games.filter(game => user.fav_games?.includes(game.id))
  }

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId)
    // Add to recent games
    const selectedGameData = games.find(game => game.id === gameId)
    if (selectedGameData) {
      addRecentGame(selectedGameData)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    setFileSizeError('')
    setCompressionInfo('')
    
    if (files && files.length > 0) {
      const file = files[0] // Check first selected file
      
      // Validate file type
      if (!isValidImageFile(file)) {
        setFileSizeError('Please select a valid image file (JPEG, PNG, or WebP)')
        setSelectedImages(null)
        e.target.value = ''
        return
      }

      const maxSize = 50 * 1024 * 1024 // 50MB in bytes
      
      if (file.size > maxSize) {
        setFileSizeError(`Your image must be 50MB or less. Current size: ${formatFileSize(file.size)}`)
        setSelectedImages(null)
        e.target.value = ''
      } else {
        setSelectedImages(files)
        
        // Show image cropper for the selected image
        if (files && files.length > 0) {
          setImageForCropping(files[0])
          setShowImageCropper(true)
        }
        
        // Show compression info for larger files
        if (file.size > 1024 * 1024) { // Files larger than 1MB
          setCompressionInfo(`Original size: ${formatFileSize(file.size)}. Image will be automatically compressed before upload.`)
        }
      }
    } else {
      setSelectedImages(files)
    }
  }

  const handleCroppedImage = (croppedFile: File) => {
    // Create a new FileList-like object with the cropped file
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(croppedFile)
    setSelectedImages(dataTransfer.files)
    setShowImageCropper(false)
    setImageForCropping(null)
    
    // Mark that this is a cropped image (no compression needed)
    setCompressionInfo(`Cropped image ready for upload (${formatFileSize(croppedFile.size)})`)
  }

  const handleCropperClose = () => {
    setShowImageCropper(false)
    setImageForCropping(null)
    // Clear the file input
    const fileInput = document.getElementById('boxImage') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
    setSelectedImages(null)
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '') // Remove non-numeric characters except decimal
    setPurchasePrice(value)
    
    // Format for display if there's a value
    if (value && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value)
      setDisplayPrice(`$${numValue.toFixed(2)}`)
    } else {
      setDisplayPrice('')
    }
  }

  const handlePriceFocus = () => {
    // Show raw value when focused for editing
    setDisplayPrice(purchasePrice)
  }

  const handlePriceBlur = () => {
    // Format for display when not focused
    if (purchasePrice && !isNaN(parseFloat(purchasePrice))) {
      const numValue = parseFloat(purchasePrice)
      setDisplayPrice(`$${numValue.toFixed(2)}`)
    }
  }

  const searchForImages = async () => {
    if (!boxName.trim()) return

    setSearchingImages(true)
    setSuggestedImages([])
    setPreviousSearchResults([])
    
    try {
      // Get the selected game name for better search context
      const selectedGameData = games.find(g => g.id === selectedGame)
      const gameName = selectedGameData?.name || ''
      
      // Create search query combining box name and game
      const searchQuery = `${boxName.trim()} ${gameName}`.trim()
      
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

  const findMoreImages = async () => {
    if (!boxName.trim()) return

    setIsLoadingMore(true)
    
    try {
      // Get the selected game name for better search context
      const selectedGameData = games.find(g => g.id === selectedGame)
      const gameName = selectedGameData?.name || ''
      
      // Create search query combining box name and game
      const searchQuery = `${boxName.trim()} ${gameName}`.trim()
      
      console.log('Finding more images with exclude:', previousSearchResults)
      
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
      
      console.log('Received additional images:', additionalImages)
      console.log('Previous results count:', previousSearchResults.length)
      console.log('New results count:', additionalImages.length)
      
      // Filter out any duplicates that might have been returned despite the exclude parameter
      const uniqueNewImages = additionalImages.filter((img: string) => !previousSearchResults.includes(img))
      
      console.log('Unique new images after filtering:', uniqueNewImages)
      
      // Show only the new results, but keep track of all for future exclusions
      setSuggestedImages(uniqueNewImages)
      setPreviousSearchResults([...previousSearchResults, ...uniqueNewImages])
    } catch (error) {
      console.error('Error searching for more images:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleImageSelected = (imageUrl: string) => {
    // Create a virtual file input change event with the selected image URL
    // We'll store the URL directly and skip the file upload process
    setSelectedImages(null) // Clear any file selection
    setCompressionInfo(`Selected image: ${imageUrl}`)
    setShowImageSearch(false)
    
    // Store the selected URL for use during submission
    setSelectedImageUrl(imageUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boxName.trim() || !user) return

    setLoading(true)
    setError('')

    try {
      let imageUrl = ''
      
      // Use selected image URL from search results
      if (selectedImageUrl) {
        imageUrl = selectedImageUrl
      }
      // Upload image if file was selected
      else if (selectedImages && selectedImages.length > 0) {
        const file = selectedImages[0] // This is now the cropped image
        
        // Check if this is a cropped image (it will have been processed by our cropper)
        const isCroppedImage = compressionInfo.includes('Cropped image ready')
        
        if (isCroppedImage) {
          // Compress cropped image before upload
          setCompressing(true)
          
          try {
            const compressedFile = await compressImage(file, 1200, 1200, 0.8)
            console.log(`Cropped image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`)
            
            const fileExt = compressedFile.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('model-images')
              .upload(fileName, compressedFile)
              
            if (uploadError) {
              console.error('Compressed cropped image upload error:', uploadError)
              throw new Error(`Failed to upload image: ${uploadError.message}`)
            } else {
              const { data } = supabase.storage
                .from('model-images')
                .getPublicUrl(uploadData.path)
              imageUrl = data.publicUrl
              console.log('Uploaded compressed cropped image URL:', imageUrl)
            }
          } catch (compressionError) {
            console.error('Cropped image compression error:', compressionError)
            
            // Fall back to uploading cropped image without compression
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('model-images')
              .upload(fileName, file)
              
            if (uploadError) {
              console.error('Fallback cropped image upload error:', uploadError)
              throw new Error(`Failed to upload image: ${uploadError.message}`)
            } else {
              const { data } = supabase.storage
                .from('model-images')
                .getPublicUrl(uploadData.path)
              imageUrl = data.publicUrl
              console.log('Uploaded uncompressed cropped image URL:', imageUrl)
            }
          } finally {
            setCompressing(false)
          }
        } else {
          // Original compression logic for non-cropped images
          setCompressing(true)
          
          try {
            // Compress the image before upload
            const compressedFile = await compressImage(file, 1200, 1200, 0.8)
            console.log(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`)
            
            const fileExt = compressedFile.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('model-images')
              .upload(fileName, compressedFile)
              
            if (uploadError) {
              console.error('Image upload error:', uploadError)
              throw new Error(`Failed to upload image: ${uploadError.message}`)
            } else {
              const { data } = supabase.storage
                .from('model-images')
                .getPublicUrl(uploadData.path)
              imageUrl = data.publicUrl
              console.log('Uploaded compressed image URL:', imageUrl)
            }
          } catch (compressionError) {
            console.error('Image compression error:', compressionError)
            
            // Fall back to original file if compression fails
            try {
              const fileExt = file.name.split('.').pop()
              const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('model-images')
                .upload(fileName, file)
                
              if (uploadError) {
                console.error('Original image upload error:', uploadError)
                throw new Error(`Failed to upload image: ${uploadError.message}`)
              } else {
                const { data } = supabase.storage
                  .from('model-images')
                  .getPublicUrl(uploadData.path)
                imageUrl = data.publicUrl
                console.log('Uploaded original image URL:', imageUrl)
              }
            } catch (fallbackError) {
              console.error('Fallback upload failed:', fallbackError)
              throw new Error('Failed to upload image after compression fallback')
            }
          } finally {
            setCompressing(false)
          }
        }
      }

      // Create the box
      const { data: boxData, error: boxError } = await supabase
        .from('boxes')
        .insert({
          name: boxName.trim(),
          game_id: selectedGame || null,
          purchase_date: purchaseDate || null,
          user_id: user.id,
          image_url: imageUrl
        })
        .select()
        .single()

      if (boxError) throw boxError

      // Store the box ID for potential future use
      lastCreatedBoxId = boxData.id

      // Reset form
      setBoxName('')
      setSelectedGame('')
      setPurchaseDate('')
      setPurchasePrice('')
      setDisplayPrice('')
      setSelectedImages(null)
      setCompressionInfo('')
      setSelectedImageUrl('')
      setShowImageSearch(false)
      setSuggestedImages([])
      
      onSuccess()
      
      return boxData
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add box')
      throw err
    } finally {
      setLoading(false)
      setCompressing(false)
    }
  }

  const handleAddEmptyBox = async (e: React.FormEvent) => {
    try {
      await handleSubmit(e)
      onClose()
    } catch (err) {
      // Error is already handled in handleSubmit
    }
  }

  const handleAddModelsToBox = async (e: React.FormEvent) => {
    await handleSubmit(e)
    onClose()
  }
  const isFormValid = boxName.trim().length > 0 && !fileSizeError && !compressing

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className={`bg-modal-bg rounded-lg max-w-lg w-full p-6 overflow-y-auto transition-all duration-300 ease-out transform
        fixed inset-0 sm:relative sm:inset-auto sm:max-w-lg sm:h-auto sm:rounded-lg sm:max-h-[90vh] h-screen w-screen sm:w-full overflow-y-auto rounded-none sm:rounded-lg p-6 sm:p-6
        ${isOpen 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-secondary-text uppercase tracking-wide text-center flex-1">
            Add New Collection
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6 text-icon" />
          </button>
        </div>

        <p className="text-base text-secondary-text text-center mb-8">
          Collections are a way to sort your models into groups. You can use this to track boxes you've bought, squads you've assembled, or simply to organise your collection.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Box Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="boxName" className="block text-sm font-medium text-input-label font-overpass">
                Collection Name
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <input
              type="text"
              id="boxName"
              value={boxName}
              onChange={(e) => setBoxName(e.target.value)}
              placeholder='eg. "Kill Team Collection", "Space Marine Heroes", "Warhammer 40k Elite Edition", etc.'
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
            />
          </div>

          {/* Game */}
          <div>
            <label htmlFor="game" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Game
            </label>
            <GameDropdown
              games={games}
              selectedGame={selectedGame}
              onGameSelect={handleGameSelect}
              placeholder="Choose a Game"
              favoriteGames={getFavoriteGames()}
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Purchase Date
            </label>
                          <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="date"
                  id="purchaseDate"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] text-text bg-bg-primary [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
              </div>
          </div>

          {/* Purchase Price */}
          <div>
            <label htmlFor="purchasePrice" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Purchase Price
            </label>
                          <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="number"
                  id="purchasePrice"
                  value={purchasePrice}
                  onChange={handlePriceChange}
                  placeholder="Enter Purchase Price"
                  step="0.01"
                  min="0"
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
                />
              </div>
          </div>

          {/* Image */}
          <div>
                          <label htmlFor="boxImage" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Collection Image
              </label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
              <input
                type="file"
                id="boxImage"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-brand)]/10 file:text-[var(--color-brand)] hover:file:bg-[var(--color-brand)]/20 bg-bg-primary text-text"
              />
            </div>
            <p className="text-xs text-secondary-text mt-1">
              You can upload more images later.
            </p>
            
            {/* Image Search Button */}
            {boxName.trim() && !selectedImages && !selectedImageUrl && (
              <div className="mt-3">
                <Button
                  variant="secondary"
                  width="full"
                  size="small"
                  onClick={searchForImages}
                  disabled={searchingImages}
                >
                  {searchingImages ? 'Searching for images...' : 'Find images for this collection'}
                </Button>
              </div>
            )}
          </div>

          {compressionInfo && (
            <div className="text-blue-600 text-sm bg-blue-50 p-3 rounded-lg">
              {compressionInfo}
            </div>
          )}

          {fileSizeError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {fileSizeError}
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col space-y-3 pt-4">
            <Button
              className='btn-primary'
              variant={isFormValid && !loading ? 'primary' : 'disabled'}
              width="full"
              onClick={handleAddEmptyBox}
              disabled={!isFormValid || loading}
            >
              {compressing ? 'Compressing Image...' : loading ? 'Adding...' : 'Add Empty Collection'}
            </Button>
            <Button
              variant={isFormValid && !loading ? 'primary' : 'disabled'}
              width="full"
              onClick={handleAddModelsToBox}
              disabled={!isFormValid || loading}
            >
              {compressing ? 'Compressing Image...' : loading ? 'Adding...' : 'Add Models to Collection'}
            </Button>
          </div>
        </form>
      </div>
      
      {imageForCropping && (
        <ImageCropper
          isOpen={showImageCropper}
          onClose={handleCropperClose}
          onCrop={handleCroppedImage}
          imageFile={imageForCropping}
        />
      )}
      
      {showImageSearch && (
        <ImageSearchResults
          isOpen={showImageSearch}
          onClose={() => setShowImageSearch(false)}
          images={suggestedImages}
          onImageSelect={handleImageSelected}
          searchQuery={`${boxName} ${games.find(g => g.id === selectedGame)?.name || ''}`.trim()}
          onFindMoreImages={findMoreImages}
          isLoadingMore={isLoadingMore}
        />
      )}
    </div>
  )
}