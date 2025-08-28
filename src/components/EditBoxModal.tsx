import React, { useState, useEffect } from 'react'
import { X, Package, Calendar, DollarSign, Image as ImageIcon, Trash2, Camera } from 'lucide-react'
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

              setSelectedImageFile(file);
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
            <h2 className="text-lg font-bold text-title">Edit Collection</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6 text-icon" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Box Name */}
            <div>
              <label htmlFor="boxName" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Collection Name
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="text"
                  id="boxName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter collection name..."
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
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
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="date"
                  id="purchaseDate"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
                {selectedImageFile ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32">
                      <img
                        src={URL.createObjectURL(selectedImageFile)}
                        alt="Selected collection image"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageFile(null)
                          setCroppedImageBlob(null)
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-secondary-text">{selectedImageFile.name}</p>
                  </div>
                ) : formData.image_url && !deleteImage ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32">
                      <img
                        src={formData.image_url}
                        alt="Current collection image"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove current image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-secondary-text">Current image</p>
                  </div>
                ) : selectedImageUrl ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32">
                      <img
                        src={selectedImageUrl}
                        alt="Selected collection image"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImageUrl('')
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-secondary-text">Selected image</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={loading}
                        />
                        <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-secondary transition-colors">
                          <ImageIcon className="w-8 h-8 text-icon" />
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

              {/* Status Messages */}
              {croppedImageBlob && (
                <p className="text-green-600 text-sm mt-2">
                  ✓ New image ready for upload
                </p>
              )}
              
              {deleteImage && (
                <p className="text-red-600 text-sm mt-2">
                  ✓ Image will be deleted when you save changes
                </p>
              )}
              
              {/* Image Search Button - only show if no current image and no new image selected */}
              {!formData.image_url && !croppedImageBlob && !selectedImageUrl && formData.name.trim() && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={searchForImages}
                    disabled={searchingImages}
                    className="btn-secondary btn-full"
                  >
                    {searchingImages ? 'Searching for images...' : 'Find images for this collection'}
                  </button>
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
                className="btn-ghost btn-flex"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={loading || compressing}
                className="btn-primary btn-flex"
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