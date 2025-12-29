import React, { useState, useEffect } from 'react'
import { X, Image, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useGames } from '../hooks/useGames'
import { useRecentGames } from '../hooks/useRecentGames'
import { GameDropdown } from './GameDropdown'
import { RichTextEditor } from './RichTextEditor'
import { DatePicker } from './DatePicker'
import { OpponentSelector } from './OpponentSelector'
import { useOpponents } from '../hooks/useOpponents'
import { useCampaigns } from '../hooks/useCampaigns'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { addBattleImage } from '../utils/battleImageUtils'


interface NewBattleModalProps {
  isOpen: boolean
  onClose: () => void
  onBattleCreated: () => Promise<void>
}

export function NewBattleModal({ isOpen, onClose, onBattleCreated }: NewBattleModalProps) {
  const [datePlayed, setDatePlayed] = useState('')
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null)
  const [selectedOpponentName, setSelectedOpponentName] = useState<string | null>(null)
  const [battleNotes, setBattleNotes] = useState('')
  const [selectedGame, setSelectedGame] = useState('')
  const [result, setResult] = useState('')
  const [location, setLocation] = useState('')
  const [showLocationDropdown, setShowLocationDropdown] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([])
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const { games, createGame } = useGames()
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [creatingOpponent, setCreatingOpponent] = useState(false)
  const [error, setError] = useState('')
  const [fileSizeError, setFileSizeError] = useState('')
  const [compressionInfo, setCompressionInfo] = useState('')
  const { user } = useAuth()
  const { addRecentGame } = useRecentGames()
  const { opponents, loading: opponentsLoading, createOpponent, findOrCreateOpponent } = useOpponents()
  const { campaigns } = useCampaigns()


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
      // Reset form when modal opens
      setDatePlayed('')
      setSelectedOpponentId(null)
      setSelectedOpponentName(null)
      setBattleNotes('')
      setSelectedGame('')
      setResult('')
      setLocation('')
      setSelectedCampaignId('')
      setSelectedImages([])
      setSelectedImageUrls([])
      setError('')
      setFileSizeError('')
      setCompressionInfo('')
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

    // If single file, show cropper. Otherwise add all files directly
    if (fileArray.length === 1) {
      setImageForCropping(fileArray[0])
      setShowImageCropper(true)
    } else {
      setSelectedImages(prev => [...prev, ...fileArray])
      setCompressionInfo(`Added ${fileArray.length} images`)
    }
  }

  const removeImage = (index: number, type: 'file' | 'url') => {
    if (type === 'file') {
      setSelectedImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setSelectedImageUrls(prev => prev.filter((_, i) => i !== index))
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
    setSelectedImages(prev => [...prev, croppedFile])
    setShowImageCropper(false)
    setImageForCropping(null)
  }

  const handleBackdropClick = (e: React.MouseCampaign) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseCampaign) => {
      const target = event.target as Element
      if (!target.closest('#location') && !target.closest('.location-dropdown')) {
        setShowLocationDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return


    if (!datePlayed) {
      setError('Date played is required')
      return
    }

    if (!selectedOpponentId) {
      
      // Check if there's text in the opponent field but no selection - try to create opponent
      const opponentInput = document.querySelector('input[placeholder*="opponent"]') as HTMLInputElement
      if (opponentInput && opponentInput.value.trim()) {
        setCreatingOpponent(true)
        setError('Creating opponent...')
        
        try {
          const newOpponent = await createOpponent(opponentInput.value.trim())
          
          if (newOpponent) {
            setSelectedOpponentId(newOpponent.id)
            setSelectedOpponentName(newOpponent.opp_name)
            setError('')
            setCreatingOpponent(false)
          } else {
            setError('Failed to create opponent. Please try again.')
            setCreatingOpponent(false)
            return
          }
        } catch (error) {
          console.error('Error auto-creating opponent:', error)
          setError('Failed to create opponent. Please try again.')
          setCreatingOpponent(false)
          return
        }
      } else {
        setError('Opponent is required')
        return
      }
    }


    if (!result) {
      setError('Result is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const selectedGameData = games.find(game => game.id === selectedGame)
      
      // Generate battle name: "[Game] against [Opponent]"
      const generatedBattleName = `${selectedGameData?.name || 'Unknown Game'} against ${selectedOpponentName || 'Unknown Opponent'}`
      
      // Create the battle first without image_url (we'll use junction table)
      const { data: battleData, error: battleError } = await supabase
        .from('battles')
        .insert({
          battle_name: generatedBattleName,
          date_played: datePlayed,
          opponent_id: selectedOpponentId,
          opp_name: selectedOpponentName, // Keep for backward compatibility
          game_name: selectedGameData?.name || '',
          game_uid: selectedGame,
          result: result,
          battle_notes: battleNotes.trim() || null,
          location: location.trim() || null,
          campaign_id: selectedCampaignId || null,
          user_id: user.id
        })
        .select()
        .single()

      if (battleError) throw battleError

      // Upload and save selected file images to junction table
      setCompressing(true)
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i]
        const isPrimary = i === 0 && selectedImageUrls.length === 0 // First file image is primary if no URL images
        const displayOrder = selectedImageUrls.length + i

        try {
          // Compress the image before upload
          const compressedFile = await compressImage(file, 1200, 1200, 0.8)

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
          await addBattleImage(battleData.id, data.publicUrl, isPrimary, displayOrder)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          // Continue with other images even if one fails
        }
      }
      setCompressing(false)

      // Save location to history if provided
      if (location.trim()) {
        addLocationToHistory(location.trim())
      }

      // Trigger refresh (this will also close the modal)
      await onBattleCreated()
    } catch (error) {
      console.error('Error creating battle:', error)
      setError('Failed to create battle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] modal-container"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col transition-all duration-300 ease-out transform">
        
        {/* Header - Fixed at top with shadow */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0 p-6 pb-4 shadow-sm bg-modal-bg rounded-t-lg">
          <h2 className="text-xl font-semibold text-text font-overpass">
            Log New Battle
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form - Scrollable content with padding */}
        <form id="battle-form" onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto px-6">
          <div className="py-4 space-y-6">
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
              <label htmlFor="opponent" className="block text-sm font-medium text-input-label font-overpass">
                Opponent
              </label>
              <span className="text-sm text-gray-500">Required</span>
            </div>
            <OpponentSelector
              selectedOpponentId={selectedOpponentId}
              onOpponentChange={(opponentId, opponentName) => {
                setSelectedOpponentId(opponentId)
                setSelectedOpponentName(opponentName)
              }}
              disabled={loading || creatingOpponent}
              placeholder="Select or create opponent..."
              opponents={opponents}
              loading={opponentsLoading}
              findOrCreateOpponent={findOrCreateOpponent}
            />
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
              <option value={`${selectedOpponentName || 'Opponent'} won`}>
                {selectedOpponentName || 'Opponent'} won
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

          {/* Campaign */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="event" className="block text-sm font-medium text-input-label font-overpass">
                Campaign
              </label>
              <span className="text-sm text-gray-500">Optional</span>
            </div>
            <select
              id="event"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] bg-bg-primary text-text"
              disabled={loading}
            >
              <option value="">No event selected</option>
              {campaigns.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                  {event.start_date && ` (${new Date(event.start_date).toLocaleDateString()})`}
                </option>
              ))}
            </select>
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
              showAddNewButton={true}
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

            {/* Error Messages */}
            {fileSizeError && (
              <p className="text-red-600 text-sm mt-2">{fileSizeError}</p>
            )}
            
            {compressionInfo && (
              <p className="text-blue-600 text-sm mt-2">{compressionInfo}</p>
            )}
          </div>
          </div>
        </form>
        
        {/* Submit Button - Fixed at bottom with shadow */}
        <div className="p-6 pt-4 shadow-sm bg-modal-bg rounded-b-lg flex-shrink-0">
          <div className="flex space-x-3">
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
              form="battle-form"
              className="flex-1 btn-primary"
              disabled={loading || compressing || creatingOpponent || !datePlayed || !selectedOpponentId || !result}
            >
              {compressing ? 'Compressing...' : creatingOpponent ? 'Creating Opponent...' : loading ? 'Creating...' : 'Log Battle'}
            </button>
          </div>
        </div>
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
