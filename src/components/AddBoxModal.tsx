import React, { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Image, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGames } from '../hooks/useGames'
import { GameDropdown } from './GameDropdown'
import { useRecentGames } from '../hooks/useRecentGames'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { ImageSearchResults } from './ImageSearchResults'
import { Button } from './Button'
import { addBoxImage } from '../utils/boxImageUtils'


interface AddBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onAddModelsToBox?: (boxId: string) => void
}

export function AddBoxModal({ isOpen, onClose, onSuccess }: AddBoxModalProps) {
  const [boxName, setBoxName] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [collectionType, setCollectionType] = useState('Collection')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [displayPrice, setDisplayPrice] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([])
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const { games, createGame } = useGames()
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


  const getFavoriteGames = () => {
    if (!user?.fav_games || user.fav_games.length === 0) return []
    return games.filter(game => user.fav_games?.includes(game.id))
  }

  const handleGameSelect = async (gameId: string) => {
    // Handle custom game creation
    if (gameId.startsWith('new:')) {
      const gameName = gameId.replace('new:', '')
      try {
        setLoading(true)

        // Create the custom game using the hook
        const newGame = await createGame(gameName)

        // Set the new game as selected
        setSelectedGame(newGame.id)

        // Add to recent games
        addRecentGame(newGame)

        console.log('Created custom game:', newGame)
      } catch (err) {
        console.error('Failed to create custom game:', err)
        setError(`Failed to create custom game "${gameName}". Please try again.`)
      } finally {
        setLoading(false)
      }
    } else {
      // Handle existing games
      setSelectedGame(gameId)
      // Add to recent games
      const selectedGameData = games.find(game => game.id === gameId)
      if (selectedGameData) {
        addRecentGame(selectedGameData)
      }
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

  const handleCameraCapture = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera is not available on this device');
        return;
      }

      // Try to get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      });

      // Create a video element to display the camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.position = 'fixed';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.zIndex = '9999';
      video.style.objectFit = 'cover';
      video.style.backgroundColor = '#000';

      // Create canvas for capturing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Create capture button
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 Take Photo';
      captureBtn.style.position = 'fixed';
      captureBtn.style.bottom = '20px';
      captureBtn.style.left = '50%';
      captureBtn.style.transform = 'translateX(-50%)';
      captureBtn.style.zIndex = '10000';
      captureBtn.style.padding = '12px 24px';
      captureBtn.style.backgroundColor = '#007bff';
      captureBtn.style.color = 'white';
      captureBtn.style.border = 'none';
      captureBtn.style.borderRadius = '8px';
      captureBtn.style.fontSize = '16px';
      captureBtn.style.fontWeight = 'bold';
      captureBtn.style.cursor = 'pointer';

      // Create cancel button
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = '❌ Cancel';
      cancelBtn.style.position = 'fixed';
      cancelBtn.style.bottom = '20px';
      cancelBtn.style.right = '20px';
      cancelBtn.style.zIndex = '10000';
      cancelBtn.style.padding = '12px 24px';
      cancelBtn.style.backgroundColor = '#dc3545';
      cancelBtn.style.color = 'white';
      cancelBtn.style.border = 'none';
      cancelBtn.style.borderRadius = '8px';
      cancelBtn.style.fontSize = '16px';
      cancelBtn.style.fontWeight = 'bold';
      cancelBtn.style.cursor = 'pointer';

      // Function to capture photo
      const capturePhoto = () => {
        try {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Create a File object from the blob
              const file = new File([blob], `collection-photo-${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });

              // Create a FileList-like object with the captured file
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              setSelectedImages(dataTransfer.files);
              setImageForCropping(file);
              setShowImageCropper(true);
            }
            
            // Clean up
            cleanup();
          }, 'image/jpeg', 0.9);
        } catch (error) {
          console.error('Error capturing photo:', error);
          alert('Error capturing photo. Please try again.');
          cleanup();
        }
      };

      // Function to cleanup
      const cleanup = () => {
        try {
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          if (document.body.contains(video)) {
            document.body.removeChild(video);
          }
          if (document.body.contains(captureBtn)) {
            document.body.removeChild(captureBtn);
          }
          if (document.body.contains(cancelBtn)) {
            document.body.removeChild(cancelBtn);
          }
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      };

      // Add event listeners
      captureBtn.addEventListener('click', capturePhoto);
      cancelBtn.addEventListener('click', cleanup);

      // Add elements to DOM
      document.body.appendChild(video);
      document.body.appendChild(captureBtn);
      document.body.appendChild(cancelBtn);

      // Wait for video to be ready
      video.addEventListener('loadedmetadata', () => {
        console.log('Video ready, dimensions:', video.videoWidth, 'x', video.videoHeight);
      });

      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        alert('Error loading camera feed. Please try again.');
        cleanup();
      });

    } catch (error) {
      console.error('Error accessing camera:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('Camera access denied. Please allow camera permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No camera found on this device.');
        } else if (error.name === 'NotReadableError') {
          alert('Camera is already in use by another application.');
        } else {
          alert(`Camera error: ${error.message}`);
        }
      } else {
        alert('Unable to access camera. Please try again or use the file upload option.');
      }
    }
  };

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
      
      // Create search queries - normal and with 'box' appended
      const baseQuery = `${boxName.trim()} ${gameName}`.trim()
      const boxQuery = `${baseQuery} box`.trim()
      
      // Make both API calls in parallel
      const [normalResponse, boxResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: baseQuery,
            count: 9
          })
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: boxQuery,
            count: 9
          })
        })
      ])

      if (!normalResponse.ok || !boxResponse.ok) {
        throw new Error('Failed to search for images')
      }

      const [normalData, boxData] = await Promise.all([
        normalResponse.json(),
        boxResponse.json()
      ])
      
      const normalImages = (normalData.images || []).map((img: any) => typeof img === 'string' ? img : img.url)
      const boxImages = (boxData.images || []).map((img: any) => typeof img === 'string' ? img : img.url)
      
      // Combine results, removing duplicates
      const allImages = [...normalImages]
      const uniqueBoxImages = boxImages.filter((img: string) => !normalImages.includes(img))
      allImages.push(...uniqueBoxImages)
      
      setSuggestedImages(allImages)
      setPreviousSearchResults(allImages)
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
    console.log('findMoreImages called with boxName:', boxName.trim())
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
          count: 9,
          exclude: previousSearchResults
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Search images API error:', response.status, errorText)
        throw new Error(`Failed to search for more images: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const additionalImages = (data.images || []).map((img: any) => typeof img === 'string' ? img : img.url)
      
      console.log('Received additional images:', additionalImages)
      console.log('Previous results count:', previousSearchResults.length)
      console.log('New results count:', additionalImages.length)
      
      // Filter out any duplicates that might have been returned despite the exclude parameter
      const uniqueNewImages = additionalImages.filter((img: string) => !previousSearchResults.includes(img))
      
      console.log('Unique new images after filtering:', uniqueNewImages)
      
      // Show all results (original + new), and keep track of all for future exclusions
      const allImages = [...suggestedImages, ...uniqueNewImages]
      setSuggestedImages(allImages)
      setPreviousSearchResults([...previousSearchResults, ...uniqueNewImages])
    } catch (error) {
      console.error('Error searching for more images:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleImageSelected = (imageUrl: string) => {
    // Add the URL to our selected images list
    setSelectedImageUrls(prev => [...prev, imageUrl])
    setCompressionInfo(`Added image: ${imageUrl}`)
    setShowImageSearch(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Validate all files
    const invalidFiles = fileArray.filter(file => !isValidImageFile(file))
    if (invalidFiles.length > 0) {
      setFileSizeError(`Invalid file type: ${invalidFiles[0].name}. Please select image files only.`)
      return
    }

    // Check file sizes
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setFileSizeError(`File too large: ${oversizedFiles[0].name}. Maximum size is 10MB.`)
      return
    }

    setFileSizeError('')
    setSelectedImages(prev => [...prev, ...fileArray])
    setCompressionInfo(`Added ${fileArray.length} image${fileArray.length > 1 ? 's' : ''}`)
  }

  const removeImage = (index: number, type: 'file' | 'url') => {
    if (type === 'file') {
      setSelectedImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setSelectedImageUrls(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boxName.trim() || !user) return

    setLoading(true)
    setError('')

    try {
      // Handle new game creation first
      let gameIdToSave = selectedGame || null
      if (selectedGame && selectedGame.startsWith('new:')) {
        const gameName = selectedGame.replace('new:', '')
        const newGame = await createGame(gameName)
        gameIdToSave = newGame.id
        // Add to recent games
        addRecentGame(newGame)
      }

      // Create the box without image_url (we'll use junction table)
      const { data: boxData, error: boxError } = await supabase
        .from('boxes')
        .insert({
          name: boxName.trim(),
          type: collectionType,
          game_id: gameIdToSave,
          purchase_date: purchaseDate || null,
          user_id: user.id
        })
        .select()
        .single()

      if (boxError) throw boxError

      // Store the box ID for potential future use
      lastCreatedBoxId = boxData.id

      // Upload and save selected URL images to junction table
      for (let i = 0; i < selectedImageUrls.length; i++) {
        const imageUrl = selectedImageUrls[i]
        const isPrimary = i === 0 // First image is primary
        await addBoxImage(boxData.id, imageUrl, isPrimary, i)
      }

      // Upload and save selected file images to junction table
      setCompressing(true)
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i]
        const isPrimary = i === 0 && selectedImageUrls.length === 0 // First file image is primary if no URL images
        const displayOrder = selectedImageUrls.length + i

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
          }

          const { data } = supabase.storage
            .from('model-images')
            .getPublicUrl(uploadData.path)

          // Save to junction table
          await addBoxImage(boxData.id, data.publicUrl, isPrimary, displayOrder)
          console.log('Uploaded and saved image URL:', data.publicUrl)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          // Continue with other images even if one fails
        }
      }
      setCompressing(false)

      // Reset form
      setBoxName('')
      setSelectedGame('')
      setPurchaseDate('')
      setPurchasePrice('')
      setDisplayPrice('')
      setSelectedImages([])
      setSelectedImageUrls([])
      setCompressionInfo('')
      setSelectedImageUrl('')
      setShowImageSearch(false)
      setSuggestedImages([])
      setCollectionType('Collection')
      
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-container"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full modal-content h-screen sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header - Fixed at top with shadow */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 p-6 pb-4 shadow-sm bg-modal-bg rounded-t-lg">
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

        {/* Description - Fixed with shadow */}
        <div className="px-6 pb-4 flex-shrink-0 shadow-sm bg-modal-bg">
          <p className="text-base text-secondary-text text-center">
            Collections are a way to sort your models into groups. You can use this to track boxes you've bought, squads you've assembled, or simply to organise your collection.
          </p>
        </div>

        {/* Form - Scrollable content with padding */}
        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto px-6">
          <div className="py-4 space-y-6">
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

          {/* Collection Type */}
          <div>
            <label htmlFor="collectionType" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Collection Type
            </label>
            <select
              id="collectionType"
              value={collectionType}
              onChange={(e) => setCollectionType(e.target.value)}
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
            >
              <option value="Collection">Collection</option>
              <option value="Box">Box</option>
            </select>
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
              showAddNewButton={true}
            />
          </div>

          {/* Custom Game Name - Only show when "Other" is selected */}
          {(() => {
            const otherGame = games.find(game => game.name.toLowerCase() === 'other')
            return selectedGame === otherGame?.id
          })() && (
            <div>
              <label htmlFor="customGame" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Game Name
              </label>
              <input
                type="text"
                id="customGame"
                value={customGame}
                onChange={(e) => setCustomGame(e.target.value)}
                placeholder="Enter the name of the game"
                className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
              />
            </div>
          )}

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

          {/* Collection Image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-input-label font-overpass">
                Collection Image
              </label>
              <span className="text-sm text-gray-500">Optional</span>
            </div>
            
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-border-custom rounded-lg p-6 text-center hover:border-[var(--color-brand)] transition-colors">
              {(selectedImages.length > 0 || selectedImageUrls.length > 0) ? (
                <div className="space-y-4">
                  {/* Show selected images */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* URL Images */}
                    {selectedImageUrls.map((url, index) => (
                      <div key={`url-${index}`} className="relative">
                        <img
                          src={url}
                          alt={`Selected image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, 'url')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && selectedImages.length === 0 && (
                          <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}

                    {/* File Images */}
                    {selectedImages.map((file, index) => (
                      <div key={`file-${index}`} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Selected file ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index, 'file')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && selectedImageUrls.length === 0 && (
                          <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add more images button */}
                    <label className="cursor-pointer border-2 border-dashed border-border-custom rounded-lg flex flex-col items-center justify-center h-24 hover:border-brand transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={loading}
                        multiple
                      />
                      <Image className="w-6 h-6 text-icon mb-1" />
                      <span className="text-xs text-secondary-text">Add More</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={loading}
                        multiple
                      />
                      <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors">
                        <Image className="w-8 h-8 text-icon" />
                        <span className="text-sm font-medium text-text">Upload Images</span>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      disabled={loading}
                      className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors"
                    >
                      <Camera className="w-8 h-8 text-icon" />
                      <span className="text-sm font-medium text-text">Take Photo</span>
                    </button>
                  </div>
                  <p className="text-xs text-secondary-text">
                    Select multiple images • JPEG, PNG, or WebP up to 10MB each
                  </p>
                </div>
              )}
            </div>

            {/* Image Search Button */}
            {boxName.trim() && selectedImages.length === 0 && selectedImageUrls.length === 0 && (
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

            {/* Error Messages */}
            {fileSizeError && (
              <p className="text-red-600 text-sm mt-2">{fileSizeError}</p>
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
          </div>
        </form>

        {/* Submit Button - Fixed at bottom with shadow */}
        <div className="p-6 pt-4 shadow-sm bg-modal-bg rounded-b-lg flex-shrink-0">
          <div className="flex flex-col space-y-3">
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
        </div>
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