import React, { useState, useEffect } from 'react'
import { X, User, Image, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGames } from '../hooks/useGames'
import { useRecentGames } from '../hooks/useRecentGames'
import { GameDropdown } from './GameDropdown'
import { RichTextEditor } from './RichTextEditor'
import { DatePicker } from './DatePicker'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'


interface Battle {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  opp_name: string | null
  opp_id: string[] | null
  result: string | null
  user_id: string | null
  created_at: string
}

interface EditBattleModalProps {
  isOpen: boolean
  onClose: () => void
  battle: Battle | null
  onBattleUpdated: () => void
}

export function EditBattleModal({ isOpen, onClose, battle, onBattleUpdated }: EditBattleModalProps) {
  const [datePlayed, setDatePlayed] = useState('')
  const [opponentName, setOpponentName] = useState('')
  const [battleNotes, setBattleNotes] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [result, setResult] = useState('')
  const [location, setLocation] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const { games } = useGames()
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const [fileSizeError, setFileSizeError] = useState('')
  const [compressionInfo, setCompressionInfo] = useState('')
  const { user } = useAuth()
  const { addRecentGame } = useRecentGames()

  // Initialize form data when battle changes
  useEffect(() => {
    if (battle) {
      setDatePlayed(battle.date_played || '')
      setOpponentName(battle.opp_name || '')
      setBattleNotes(battle.battle_notes || '')
      setSelectedGame(battle.game_uid || '')
      setResult(battle.result || '')
      setLocation('') // Location is not stored in database, so always start empty
      setCurrentImageUrl(battle.image_url)
      setSelectedImage(null) // Reset selected image when battle changes
    }
  }, [battle])

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

  const getPreviousLocations = (): string[] => {
    try {
      const stored = localStorage.getItem('battle-locations')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const addLocationToHistory = (newLocation: string) => {
    if (!newLocation.trim()) return
    
    try {
      const locations = getPreviousLocations()
      const filteredLocations = locations.filter(loc => loc.toLowerCase() !== newLocation.toLowerCase())
      const updatedLocations = [newLocation.trim(), ...filteredLocations].slice(0, 10) // Keep last 10
      localStorage.setItem('battle-locations', JSON.stringify(updatedLocations))
    } catch (error) {
      console.error('Error saving location to history:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!battle) return

    if (!datePlayed) {
      setError('Date played is required')
      return
    }

    if (!opponentName.trim()) {
      setError('Opponent name is required')
      return
    }

    if (!selectedGame) {
      setError('Game is required')
      return
    }

    if (!result) {
      setError('Result is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedGameData = games.find(game => game.id === selectedGame)
      
      // Generate new battle name: "[Game] against [Opponent]"
      const generatedBattleName = `${selectedGameData?.name || 'Unknown Game'} against ${opponentName.trim()}`
      
      let imageUrl = currentImageUrl

      // Upload new image if selected
      if (selectedImage) {
        setCompressing(true)
        try {
          // Compress the image
          const compressedImage = await compressImage(selectedImage)
          
          // Generate unique filename
          const fileExt = compressedImage.name.split('.').pop()
          const fileName = `battle-images/${user?.id}/${Date.now()}.${fileExt}`
          
                     // Upload to Supabase Storage
           const { data: uploadData, error: uploadError } = await supabase.storage
             .from('battle-images')
             .upload(fileName, compressedImage, {
               cacheControl: '3600',
               upsert: true
             })

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('battle-images')
            .getPublicUrl(fileName)

          imageUrl = urlData.publicUrl
        } catch (imageError) {
          console.error('Error uploading image:', imageError)
          setError('Failed to upload image. Please try again.')
          setCompressing(false)
          return
        } finally {
          setCompressing(false)
        }
      }
      
      // Save location to history if provided
      if (location.trim()) {
        addLocationToHistory(location.trim())
      }
      
      const { error } = await supabase
        .from('battles')
        .update({
          battle_name: generatedBattleName,
          date_played: datePlayed,
          opp_name: opponentName.trim(),
          game_name: selectedGameData?.name || '',
          game_uid: selectedGame,
          result: result,
          image_url: imageUrl,
          battle_notes: battleNotes.trim() || null,
          location: location.trim() || null
        })
        .eq('id', battle.id)

      if (error) throw error

      // Close modal and trigger refresh
      onBattleUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating battle:', error)
      setError('Failed to update battle. Please try again.')
    } finally {
      setLoading(false)
    }
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
      const file = files[0]
      
      // Validate file type
      if (!isValidImageFile(file)) {
        setFileSizeError('Please select a valid image file (JPEG, PNG, or WebP)')
        setSelectedImage(null)
        e.target.value = ''
        return
      }

      const maxSize = 50 * 1024 * 1024 // 50MB in bytes
      
      if (file.size > maxSize) {
        setFileSizeError(`Your image must be 50MB or less. Current size: ${formatFileSize(file.size)}`)
        setSelectedImage(null)
        e.target.value = ''
      } else {
        setSelectedImage(file)
        
        // Show image cropper for the selected image
        setImageForCropping(file)
        setShowImageCropper(true)
        
        // Show compression info for larger files
        if (file.size > 1024 * 1024) { // Files larger than 1MB
          setCompressionInfo(`Original size: ${formatFileSize(file.size)}. Image will be automatically compressed before upload.`)
        }
      }
    } else {
      setSelectedImage(null)
    }
  }

  const handleCameraCapture = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setFileSizeError('Camera is not available on this device')
        return
      }

      // Clear any previous errors
      setFileSizeError('')

      // Try to get camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        } 
      })

      // Create a video element to display the camera feed
      const video = document.createElement('video')
      video.srcObject = stream
      video.autoplay = true
      video.playsInline = true
      video.muted = true
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
      captureBtn.style.cursor = 'pointer'

      // Create cancel button
      const cancelBtn = document.createElement('button')
      cancelBtn.textContent = '❌ Cancel'
      cancelBtn.style.position = 'fixed'
      cancelBtn.style.bottom = '20px'
      cancelBtn.style.right = '20px'
      cancelBtn.style.zIndex = '10000'
      cancelBtn.style.padding = '12px 24px'
      cancelBtn.style.backgroundColor = '#dc3545'
      cancelBtn.style.color = 'white'
      cancelBtn.style.border = 'none'
      cancelBtn.style.borderRadius = '8px'
      cancelBtn.style.fontSize = '16px'
      cancelBtn.style.fontWeight = 'bold'
      cancelBtn.style.cursor = 'pointer'

      // Function to capture photo
      const capturePhoto = () => {
        try {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          // Draw the current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              // Create a File object from the blob
              const file = new File([blob], `battle-photo-${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
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
                setSelectedImage(file)
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
        } catch (error) {
          console.error('Error capturing photo:', error)
          setFileSizeError('Error capturing photo. Please try again.')
          cleanup()
        }
      }

      // Function to cleanup
      const cleanup = () => {
        try {
          if (stream) {
            stream.getTracks().forEach(track => track.stop())
          }
          if (document.body.contains(video)) {
            document.body.removeChild(video)
          }
          if (document.body.contains(captureBtn)) {
            document.body.removeChild(captureBtn)
          }
          if (document.body.contains(cancelBtn)) {
            document.body.removeChild(cancelBtn)
          }
        } catch (error) {
          console.error('Error during cleanup:', error)
        }
      }

      // Add event listeners
      captureBtn.addEventListener('click', capturePhoto)
      cancelBtn.addEventListener('click', cleanup)

      // Add elements to DOM
      document.body.appendChild(video)
      document.body.appendChild(captureBtn)
      document.body.appendChild(cancelBtn)

      // Wait for video to be ready
      video.addEventListener('loadedmetadata', () => {
        console.log('Video ready, dimensions:', video.videoWidth, 'x', video.videoHeight)
      })

      video.addEventListener('error', (e) => {
        console.error('Video error:', e)
        setFileSizeError('Error loading camera feed. Please try again.')
        cleanup()
      })

    } catch (error) {
      console.error('Error accessing camera:', error)
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setFileSizeError('Camera access denied. Please allow camera permissions and try again.')
        } else if (error.name === 'NotFoundError') {
          setFileSizeError('No camera found on this device.')
        } else if (error.name === 'NotReadableError') {
          setFileSizeError('Camera is already in use by another application.')
        } else {
          setFileSizeError(`Camera error: ${error.message}`)
        }
      } else {
        setFileSizeError('Unable to access camera. Please try again or use the file upload option.')
      }
    }
  }

  const handleCrop = (croppedFile: File) => {
    setSelectedImage(croppedFile)
    setShowImageCropper(false)
    setImageForCropping(null)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('#location') && !target.closest('.location-dropdown')) {
        setShowLocationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!isOpen || !battle) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text font-overpass">
            Edit Battle
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Date Played */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-input-label font-overpass">
                Date Played
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <DatePicker
              value={datePlayed}
              onChange={setDatePlayed}
              placeholder="Select battle date"
              minDate=""
              disabled={loading}
            />
          </div>

          {/* Opponent */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="opponentName" className="block text-sm font-medium text-input-label font-overpass">
                Opponent
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
              <input
                type="text"
                id="opponentName"
                value={opponentName}
                onChange={(e) => setOpponentName(e.target.value)}
                placeholder="Enter opponent's name"
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
                disabled={loading}
              />
            </div>
          </div>

          {/* Result */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="result" className="block text-sm font-medium text-input-label font-overpass">
                Result
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <select
              id="result"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
              disabled={loading}
            >
              <option value="">Select result...</option>
              <option value="I won">I won</option>
              <option value={`${opponentName.trim() || 'Opponent'} won`}>
                {opponentName.trim() || 'Opponent'} won
              </option>
              <option value="Draw">Draw</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="location" className="block text-sm font-medium text-input-label font-overpass">
                Location
              </label>
              <span className="text-sm text-gray-500">Optional</span>
            </div>
            <div className="relative">
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setShowLocationDropdown(true)
                }}
                onFocus={() => setShowLocationDropdown(true)}
                placeholder="Enter battle location..."
                className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
                disabled={loading}
              />
              
                             {/* Location Dropdown */}
               {showLocationDropdown && getPreviousLocations().length > 0 && (
                 <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border-custom rounded-lg shadow-lg max-h-48 overflow-y-auto">
                   {getPreviousLocations()
                     .filter(loc => loc.toLowerCase().includes(location.toLowerCase()) || location === '')
                     .map((prevLocation, index) => (
                       <button
                         key={index}
                         type="button"
                         onMouseDown={(e) => {
                           e.preventDefault()
                           setLocation(prevLocation)
                           setShowLocationDropdown(false)
                         }}
                         className="w-full px-4 py-2 text-left hover:bg-bg-secondary text-text border-b border-border-custom last:border-b-0"
                       >
                         {prevLocation}
                       </button>
                     ))}
                 </div>
               )}
            </div>
          </div>

          {/* Game */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="game" className="block text-sm font-medium text-input-label font-overpass">
                Game
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <GameDropdown
              games={games}
              selectedGame={selectedGame}
              onGameSelect={handleGameSelect}
              placeholder="Choose a Game"
              favoriteGames={getFavoriteGames()}
            />
          </div>

          {/* Battle Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-input-label font-overpass">
                Battle Notes
              </label>
              <span className="text-sm text-gray-500">Optional</span>
            </div>
            <RichTextEditor
              value={battleNotes}
              onChange={(value) => setBattleNotes(value)}
              placeholder="Optional notes about this battle..."
              rows={4}
            />
          </div>

          {/* Battle Image */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-input-label font-overpass">
                Battle Image
              </label>
              <span className="text-sm text-gray-500">Optional</span>
            </div>
            
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-border-custom rounded-lg p-6 text-center hover:border-[var(--color-brand)] transition-colors">
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative mx-auto w-32 h-32">
                    <img
                      src={URL.createObjectURL(selectedImage)}
                      alt="Selected battle image"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null)
                        setFileSizeError('')
                        setCompressionInfo('')
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-secondary-text">{selectedImage.name}</p>
                </div>
              ) : currentImageUrl ? (
                <div className="space-y-4">
                  <div className="relative mx-auto w-32 h-32">
                    <img
                      src={currentImageUrl}
                      alt="Current battle image"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentImageUrl(null)
                        setFileSizeError('')
                        setCompressionInfo('')
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      title="Remove current image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-secondary-text">Current image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={loading}
                      />
                      <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors">
                        <Image className="w-8 h-8 text-icon" />
                        <span className="text-sm font-medium text-text">Upload Image</span>
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
                    JPEG, PNG, or WebP up to 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Error Messages */}
            {fileSizeError && (
              <p className="text-red-600 text-sm mt-2">{fileSizeError}</p>
            )}
            
            {compressionInfo && (
              <p className="text-blue-600 text-sm mt-2">{compressionInfo}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading || compressing}
            >
              {compressing ? 'Compressing...' : loading ? 'Updating...' : 'Update Battle'}
            </button>
          </div>
        </form>
      </div>

      {/* Image Cropper Modal */}
      {showImageCropper && imageForCropping && (
        <ImageCropper
          isOpen={showImageCropper}
          onClose={() => {
            setShowImageCropper(false)
            setImageForCropping(null)
          }}
          onCrop={handleCrop}
          imageFile={imageForCropping}
        />
      )}
    </div>
  )
}
