import React, { useState, useEffect } from 'react'
import { X, Package, Calendar, DollarSign, Image as ImageIcon, Trash2, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useGames } from '../hooks/useGames'
import { useRecentGames } from '../hooks/useRecentGames'
import { GameDropdown } from './GameDropdown'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { ImageSearchResults } from './ImageSearchResults'
import { getBoxWithImages, addBoxImage, deleteBoxImage, updateBoxImage, reorderBoxImages, type BoxWithImages } from '../utils/boxImageUtils'


interface EditBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onBoxUpdated: () => void
  box: BoxWithImages | null
}

export function EditBoxModal({ isOpen, onClose, onBoxUpdated, box }: EditBoxModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    game_id: '',
    purchase_date: '',
    image_url: ''
  })
  const { games, createGame } = useGames()
  const { addRecentGame } = useRecentGames()
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([])
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([])
  const [boxWithImages, setBoxWithImages] = useState<BoxWithImages | null>(null)
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
      fetchBoxImages()
    }
  }, [box])

  const fetchBoxImages = async () => {
    if (!box) return

    try {
      const boxImagesData = await getBoxWithImages(box.id)
      if (boxImagesData) {
        setBoxWithImages(boxImagesData)
      }
    } catch (err) {
      console.error('Error fetching box images:', err)
    }
  }


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Validate all files
    const invalidFiles = fileArray.filter(file => !isValidImageFile(file))
    if (invalidFiles.length > 0) {
      alert(`Invalid file type: ${invalidFiles[0].name}. Please select image files only.`)
      return
    }

    // Check file sizes
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert(`File too large: ${oversizedFiles[0].name}. Maximum size is 10MB.`)
      return
    }

    setSelectedImageFiles(prev => [...prev, ...fileArray])
  }

  const handleImageSelected = (imageUrl: string) => {
    setSelectedImageUrls(prev => [...prev, imageUrl])
    setShowImageSearch(false)
  }

  const removeNewImage = (index: number, type: 'file' | 'url') => {
    if (type === 'file') {
      setSelectedImageFiles(prev => prev.filter((_, i) => i !== index))
    } else {
      setSelectedImageUrls(prev => prev.filter((_, i) => i !== index))
    }
  }

  const removeExistingImage = async (imageId: string) => {
    if (!box) return

    try {
      setLoading(true)
      const success = await deleteBoxImage(imageId)
      if (success) {
        await fetchBoxImages() // Refresh images
      } else {
        alert('Failed to delete image')
      }
    } catch (err) {
      console.error('Error deleting image:', err)
      alert('Failed to delete image')
    } finally {
      setLoading(false)
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
      
      // Create search queries - normal and with 'box' appended
      const baseQuery = `${formData.name.trim()} ${gameName}`.trim()
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
    console.log('findMoreImages called with box name:', formData.name.trim())
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
      // Handle new game creation first
      let gameIdToSave = formData.game_id || null
      if (formData.game_id && formData.game_id.startsWith('new:')) {
        const gameName = formData.game_id.replace('new:', '')
        const newGame = await createGame(gameName)
        gameIdToSave = newGame.id
        // Add to recent games
        addRecentGame(newGame)
      }

      // Update the box basic information (without image_url, we use junction table now)
      const { error } = await supabase
        .from('boxes')
        .update({
          name: formData.name,
          game_id: gameIdToSave,
          purchase_date: formData.purchase_date || null
        })
        .eq('id', box.id)

      if (error) throw error

      // Handle new image URL selections
      const startingDisplayOrder = boxWithImages?.images?.length || 0
      for (let i = 0; i < selectedImageUrls.length; i++) {
        const imageUrl = selectedImageUrls[i]
        const isPrimary = i === 0 && (!boxWithImages?.images || boxWithImages.images.length === 0)
        const displayOrder = startingDisplayOrder + i
        await addBoxImage(box.id, imageUrl, isPrimary, displayOrder)
      }

      // Handle new file uploads
      setCompressing(true)
      for (let i = 0; i < selectedImageFiles.length; i++) {
        const file = selectedImageFiles[i]
        const isPrimary = i === 0 && selectedImageUrls.length === 0 && (!boxWithImages?.images || boxWithImages.images.length === 0)
        const displayOrder = startingDisplayOrder + selectedImageUrls.length + i

        try {
          // Compress the image before upload
          const compressedFile = await compressImage(file, 1200, 1200, 0.8)
          console.log(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`)

          const fileExt = compressedFile.name.split('.').pop()
          const fileName = `${boxWithImages?.user_id || 'user'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

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
          await addBoxImage(box.id, data.publicUrl, isPrimary, displayOrder)
          console.log('Uploaded and saved image URL:', data.publicUrl)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          // Continue with other images even if one fails
        }
      }
      setCompressing(false)

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
    setSelectedImageFiles([])
    setSelectedImageUrls([])
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] modal-container"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto modal-content">
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
                showAddNewButton={true}
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

            {/* Collection Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-input-label font-overpass">
                  Collection Images
                </label>
                <span className="text-sm text-gray-500">Optional</span>
              </div>

              {/* Existing Images */}
              {boxWithImages?.images && boxWithImages.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-text mb-2">Current Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {boxWithImages.images.map((image, index) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.image_url}
                          alt={`Collection image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          disabled={loading}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {image.is_primary && (
                          <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images to Add */}
              <div className="border-2 border-dashed border-border-custom rounded-lg p-6 text-center hover:border-[var(--color-brand)] transition-colors">
                {(selectedImageFiles.length > 0 || selectedImageUrls.length > 0) ? (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-text">New Images to Add</h4>
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
                            onClick={() => removeNewImage(index, 'url')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && selectedImageFiles.length === 0 && (!boxWithImages?.images || boxWithImages.images.length === 0) && (
                            <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}

                      {/* File Images */}
                      {selectedImageFiles.map((file, index) => (
                        <div key={`file-${index}`} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Selected file ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index, 'file')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && selectedImageUrls.length === 0 && (!boxWithImages?.images || boxWithImages.images.length === 0) && (
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
                        <ImageIcon className="w-6 h-6 text-icon mb-1" />
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
                          <ImageIcon className="w-8 h-8 text-icon" />
                          <span className="text-sm font-medium text-text">Add Images</span>
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
              {selectedImageFiles.length === 0 && selectedImageUrls.length === 0 && formData.name.trim() && (
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
            <div className="flex space-x-3 pt-4 modal-actions">
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