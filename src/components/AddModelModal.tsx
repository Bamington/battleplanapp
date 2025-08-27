import React, { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Hash, Image, Package, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { GameDropdown } from './GameDropdown'
import { useRecentGames } from '../hooks/useRecentGames'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { DatePicker } from './DatePicker'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface Box {
  id: string
  name: string
  game_id: string | null
  purchase_date: string | null
  public: boolean
  created_at: string
  game: {
    name: string
    icon: string | null
  } | null
}

interface AddModelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedBoxId?: string | null
}

export function AddModelModal({ isOpen, onClose, onSuccess, preselectedBoxId }: AddModelModalProps) {
  const [modelName, setModelName] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [selectedBox, setSelectedBox] = useState('')
  const [paintedStatus, setPaintedStatus] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [paintedDate, setPaintedDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [displayPrice, setDisplayPrice] = useState('')
  const [numberOfModels, setNumberOfModels] = useState('1')
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const [fileSizeError, setFileSizeError] = useState('')
  const [compressionInfo, setCompressionInfo] = useState('')
  const { user } = useAuth()
  const { addRecentGame } = useRecentGames()

  // Mobile detection
  const isMobile = window.innerWidth <= 768

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      // Clear box context from localStorage when modal is closed
      try {
        localStorage.removeItem('mini-myths-temp-box-context')
      } catch (error) {
        console.error('Error clearing box context:', error)
      }
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchGames()
      fetchBoxes()
      // Set preselected box if provided
      if (preselectedBoxId) {
        setSelectedBox(preselectedBoxId)
      } else {
        // Check for box context from localStorage (when coming from AddModelsToBoxModal)
        try {
          const storedBoxContext = localStorage.getItem('mini-myths-temp-box-context')
          if (storedBoxContext) {
            const boxContext = JSON.parse(storedBoxContext)
            setSelectedBox(boxContext.id)
          }
        } catch (error) {
          console.error('Error reading box context from localStorage:', error)
        }
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchBoxes()
    }
  }, [isOpen, user])

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

  const fetchBoxes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('boxes')
        .select(`
          id,
          name,
          game_id,
          purchase_date,
          public,
          created_at,
          game:games(
            name,
            icon
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to handle array responses from Supabase
      const transformedData = (data || []).map(box => ({
        ...box,
        game: box.game && Array.isArray(box.game) ? box.game[0] : box.game
      }))
      
      setBoxes(transformedData)
    } catch (err) {
      console.error('Error fetching boxes:', err)
    }
  }

  // Filter boxes based on selected game
  const getFilteredBoxes = () => {
    if (!selectedGame) {
      // No game selected, show all boxes ordered by creation date
      return boxes
    }
    
    // Show only boxes that match the selected game
    return boxes.filter(box => box.game_id === selectedGame)
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
        setFileSizeError('Camera is not available on this device')
        return
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera by default
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })

      // Create a video element to display the camera feed
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.style.position = 'fixed'
      video.style.top = '0'
      video.style.left = '0'
      video.style.width = '100%'
      video.style.height = '100%'
      video.style.zIndex = '9999'
      video.style.objectFit = 'cover'
      video.style.backgroundColor = '#000'

      // Create canvas for capturing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Create capture button
      const captureBtn = document.createElement('button')
      captureBtn.textContent = '📸 Take Photo'
      captureBtn.style.position = 'fixed'
      captureBtn.style.bottom = '20px'
      captureBtn.style.left = '50%'
      captureBtn.style.transform = 'translateX(-50%)'
      captureBtn.style.zIndex = '10000'
      captureBtn.style.padding = '12px 24px'
      captureBtn.style.backgroundColor = '#007bff'
      captureBtn.style.color = 'white'
      captureBtn.style.border = 'none'
      captureBtn.style.borderRadius = '8px'
      captureBtn.style.fontSize = '16px'
      captureBtn.style.fontWeight = 'bold'

      // Create cancel button
      const cancelBtn = document.createElement('button')
      cancelBtn.textContent = '❌ Cancel'
      cancelBtn.style.position = 'fixed'
      cancelBtn.style.top = '20px'
      cancelBtn.style.right = '20px'
      cancelBtn.style.zIndex = '10000'
      cancelBtn.style.padding = '8px 16px'
      cancelBtn.style.backgroundColor = '#dc3545'
      cancelBtn.style.color = 'white'
      cancelBtn.style.border = 'none'
      cancelBtn.style.borderRadius = '6px'
      cancelBtn.style.fontSize = '14px'

      // Create camera switch button
      const switchBtn = document.createElement('button')
      switchBtn.textContent = '🔄 Switch Camera'
      switchBtn.style.position = 'fixed'
      switchBtn.style.top = '20px'
      switchBtn.style.left = '20px'
      switchBtn.style.zIndex = '10000'
      switchBtn.style.padding = '8px 16px'
      switchBtn.style.backgroundColor = '#6c757d'
      switchBtn.style.color = 'white'
      switchBtn.style.border = 'none'
      switchBtn.style.borderRadius = '6px'
      switchBtn.style.fontSize = '14px'

      let currentFacingMode = 'environment'

      // Function to switch camera
      const switchCamera = async () => {
        // Stop current stream
        stream.getTracks().forEach(track => track.stop())
        
        // Switch facing mode
        currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment'
        
        try {
          // Get new stream
          const newStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: currentFacingMode,
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            } 
          })
          
          // Update video source
          video.srcObject = newStream
          
          // Update stream reference
          Object.assign(stream, newStream)
        } catch (error) {
          console.error('Error switching camera:', error)
        }
      }

      // Function to capture photo
      const capturePhoto = () => {
        // Set canvas size to match video dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create file from blob
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { 
              type: 'image/jpeg' 
            })
            
            // Validate file
            if (!isValidImageFile(file)) {
              setFileSizeError('Please select a valid image file (JPEG, PNG, or WebP)')
              return
            }

            const maxSize = 50 * 1024 * 1024 // 50MB in bytes
            
            if (file.size > maxSize) {
              setFileSizeError(`Your image must be 50MB or less. Current size: ${formatFileSize(file.size)}`)
            } else {
              // Create FileList-like object
              const dataTransfer = new DataTransfer()
              dataTransfer.items.add(file)
              setSelectedImages(dataTransfer.files)
              setFileSizeError('')
              setCompressionInfo('')
              
              // Show image cropper for the captured image
              setImageForCropping(file)
              setShowImageCropper(true)
              
              // Show compression info for larger files
              if (file.size > 1024 * 1024) { // Files larger than 1MB
                setCompressionInfo(`Original size: ${formatFileSize(file.size)}. Image will be automatically compressed before upload.`)
              }
            }
          }
          
          // Clean up
          cleanup()
        }, 'image/jpeg', 0.9)
      }

      // Function to cleanup
      const cleanup = () => {
        stream.getTracks().forEach(track => track.stop())
        document.body.removeChild(video)
        document.body.removeChild(captureBtn)
        document.body.removeChild(cancelBtn)
        document.body.removeChild(switchBtn)
      }

      // Add event listeners
      captureBtn.addEventListener('click', capturePhoto)
      cancelBtn.addEventListener('click', cleanup)
      switchBtn.addEventListener('click', switchCamera)

      // Add elements to DOM
      document.body.appendChild(video)
      document.body.appendChild(captureBtn)
      document.body.appendChild(cancelBtn)
      document.body.appendChild(switchBtn)

      // Wait for video to be ready
      video.addEventListener('loadedmetadata', () => {
        // Video is ready to play
      })

    } catch (error) {
      console.error('Error accessing camera:', error)
      setFileSizeError('Unable to access camera. Please try again or use the file upload option.')
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
    const fileInput = document.getElementById('image') as HTMLInputElement
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modelName.trim() || !user) return

    setLoading(true)
    setError('')

    try {
      let imageUrl = ''
      
      // Upload image if selected
      if (selectedImages && selectedImages.length > 0) {
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

      // Determine the game_id for the model
      let modelGameId = selectedGame || null
      
      // If a box is selected, use the box's game_id
      if (selectedBox || preselectedBoxId) {
        const boxId = selectedBox || preselectedBoxId
        const selectedBoxData = boxes.find(box => box.id === boxId)
        if (selectedBoxData && selectedBoxData.game_id) {
          modelGameId = selectedBoxData.game_id
        }
      }

      // Get the public status from the selected box
      let modelPublicStatus = false // Default to false for loose models
      if (selectedBox || preselectedBoxId) {
        const boxId = selectedBox || preselectedBoxId
        const selectedBoxData = boxes.find(box => box.id === boxId)
        if (selectedBoxData) {
          modelPublicStatus = selectedBoxData.public
        }
      }

      // Create the model
      const { error: modelError } = await supabase
        .from('models')
        .insert({
          name: modelName.trim(),
          box_id: selectedBox || preselectedBoxId || null,
          game_id: modelGameId,
          status: paintedStatus || 'None',
          count: parseInt(numberOfModels) || 1,
          user_id: user.id,
          image_url: imageUrl,
          purchase_date: purchaseDate || null,
          painted_date: paintedDate || null,
          public: modelPublicStatus
        })

      if (modelError) throw modelError

      // Reset form
      setModelName('')
      setSelectedGame('')
      setSelectedBox('')
      setPaintedStatus('')
      setPurchaseDate('')
      setPaintedDate('')
      setPurchasePrice('')
      setDisplayPrice('')
      setNumberOfModels('1')
      setSelectedImages(null)
      setCompressionInfo('')
      
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add model')
    } finally {
      setLoading(false)
      setCompressing(false)
    }
  }

  const isFormValid = modelName.trim().length > 0 && !fileSizeError && !compressing

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const filteredBoxes = getFilteredBoxes()

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className={`bg-modal\-bg rounded-lg max-w-lg w-full p-6 overflow-y-auto transition-all duration-300 ease-out transform
        fixed inset-0 sm:relative sm:inset-auto sm:max-w-lg sm:h-auto sm:rounded-lg sm:max-h-[90vh] h-screen w-screen sm:w-full overflow-y-auto rounded-none sm:rounded-lg p-6 sm:p-6
        ${isOpen 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0'
        }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-secondary-text uppercase tracking-wide text-center flex-1">
            Add New Model
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6 text-icon" />
          </button>
        </div>

        <p className="text-base text-secondary-text text-center mb-8">
          Don't worry- you can update any of these details later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Model Name */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="modelName" className="block text-sm font-medium text-input-label font-overpass">
                Model Name
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <input
              type="text"
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder='eg. "Space Marine Lieutenant", "Captain America", "US Ranger Squad", etc.'
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
            />
          </div>

          {/* Box Selection */}
          <div>
            <label htmlFor="box" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Collection (Optional)
            </label>
            <select
              id="box"
              value={selectedBox}
              onChange={(e) => {
                setSelectedBox(e.target.value)
                // Clear selected game when a box is selected since game will be auto-assigned
                if (e.target.value) {
                  setSelectedGame('')
                }
              }}
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
            >
              <option value="">No Collection (Loose Model)</option>
              {getFilteredBoxes().map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name} {box.game && `(${box.game.name})`}
                </option>
              ))}
            </select>
            <p className="text-xs text-secondary-text mt-1">
              Choose an existing collection or leave as loose model.
            </p>
            {/* Show game info when box is selected */}
            {selectedBox && (() => {
              const selectedBoxData = boxes.find(box => box.id === selectedBox)
              return selectedBoxData && selectedBoxData.game ? (
                <p className="text-xs text-[var(--color-brand)] mt-1">
                  Game will be automatically set to: <strong>{selectedBoxData.game.name}</strong>
                </p>
              ) : null
            })()}
          </div>

          {/* Game - Only show if no box is selected */}
          {!selectedBox && (
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
          )}

          {/* Painted Status */}
          <div>
            <label htmlFor="paintedStatus" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Painted Status
            </label>
            <select
              id="paintedStatus"
              value={paintedStatus}
              onChange={(e) => setPaintedStatus(e.target.value)}
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
            >
              <option value="">Select Status</option>
              <option value="Assembled">Assembled</option>
              <option value="Primed">Primed</option>
              <option value="Partially Painted">Partially Painted</option>
              <option value="Painted">Painted</option>
            </select>
          </div>

          {paintedStatus === 'Painted' && (
            <div>
              <label htmlFor="paintedDate" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Painted Date
              </label>
              <DatePicker
                value={paintedDate}
                onChange={setPaintedDate}
                placeholder="Select painted date"
                minDate=""
              />
            </div>
          )}

          {/* Purchase Date - Only show if no box is selected */}
          {!selectedBox && (
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Purchase Date
              </label>
              <DatePicker
                value={purchaseDate}
                onChange={setPurchaseDate}
                placeholder="Select purchase date"
                minDate=""
              />
            </div>
          )}

          {/* Purchase Price - Only show if no box is selected */}
          {!selectedBox && (
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
          )}

          {/* Number of Models */}
          <div>
            <label htmlFor="numberOfModels" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Number of Models
            </label>
                          <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="number"
                  id="numberOfModels"
                  value={numberOfModels}
                  onChange={(e) => setNumberOfModels(e.target.value)}
                  min="1"
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
                />
              </div>
          </div>

          {/* Photos */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Image
            </label>
                          <div className="relative">
                <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-brand)]/10 file:text-[var(--color-brand)] hover:file:bg-[var(--color-brand)]/20 bg-bg-primary text-text"
                />
              </div>
            
            {/* Camera option for mobile */}
            {isMobile && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleCameraCapture}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 border border-border-custom rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors bg-bg-primary text-text"
                >
                  <Camera className="w-5 h-5 text-icon" />
                  <span>Take Photo with Camera</span>
                </button>
              </div>
            )}
            
            <p className="text-xs text-secondary-text mt-1">
              You can upload more images later.
            </p>
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
          <div className="flex justify-center pt-4">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`${
                isFormValid && !loading
                  ? 'btn-primary'
                  : 'btn-disabled'
              }`}
            >
              {compressing ? 'Compressing Image...' : loading ? 'Adding...' : 'Add to Collection'}
            </button>
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
    </div>
  )
}