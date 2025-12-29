import React, { useState } from 'react'
import { X, Share2, Edit, Trash2, Calendar, Hash, Palette, FileText, Package, Gamepad2, Info, BookOpen, Brush, ChevronLeft, ChevronRight, Camera, Image, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DeleteModelModal } from './DeleteModelModal'
import { EditModelModal } from './EditModelModal'
import { ShareModelModal } from './ShareModelModal'
import { ShareScreenshotPreview } from './ShareScreenshotPreview'
import { Toast } from './Toast'
import { RichTextEditor } from './RichTextEditor'
import { DatePicker } from './DatePicker'
import { ImageCropper } from './ImageCropper'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatLocalDate } from '../utils/timezone'
import { getModelBoxes } from '../utils/modelBoxUtils'
import { useAuth } from '../hooks/useAuth'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'


interface PaintingTableModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelDeleted?: () => void
  onModelUpdated?: () => void
  onViewBox?: (box: any) => void
  model: {
    id: string
    name: string
    status: string
    count: number
    image_url: string
    game_id: string | null
    notes: string | null
    painted_date: string | null
    purchase_date: string | null
    public: boolean | null
    lore_name?: string | null
    lore_description?: string | null
    painting_notes?: string | null
    images?: {
      id: string
      model_id: string
      image_url: string
      display_order: number
      is_primary: boolean
      created_at: string
      user_id: string
    }[]
    box: {
      id: string
      name: string
      purchase_date: string
      game: {
        name: string
        image?: string
        icon?: string
      } | null
    } | null
    game: {
      name: string
      image?: string
      icon?: string
    } | null
  } | null
}

export function PaintingTableModelModal({ isOpen, onClose, onModelDeleted, onModelUpdated, onViewBox, model }: PaintingTableModelModalProps) {
  const { user } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
  const [showScreenshotModal, setShowScreenshotModal] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const [currentModel, setCurrentModel] = React.useState(model)
  const [paintingData, setPaintingData] = React.useState({
    painting_notes: '',
    status: '',
    painted_date: ''
  })
  const [originalPaintingData, setOriginalPaintingData] = React.useState({
    painting_notes: '',
    status: '',
    painted_date: ''
  })
  const [isEditingPaintingNotes, setIsEditingPaintingNotes] = React.useState(false)
  const [modelImages, setModelImages] = React.useState<{
    id: string
    model_id: string
    image_url: string
    display_order: number
    is_primary: boolean
    created_at: string
    user_id: string
  }[]>([])
  const [imagesLoading, setImagesLoading] = React.useState(false)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [selectedImages, setSelectedImages] = React.useState<File[]>([])
  const [showImageCropper, setShowImageCropper] = React.useState(false)
  const [imageForCropping, setImageForCropping] = React.useState<File | null>(null)
  const [dragActive, setDragActive] = React.useState(false)
  const [compressing, setCompressing] = React.useState(false)
  const [fileSizeError, setFileSizeError] = React.useState('')
  const [compressionInfo, setCompressionInfo] = React.useState('')

  // Fetch model images
  const fetchModelImages = async () => {
    if (!model?.id) return

    setImagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('model_images')
        .select('*')
        .eq('model_id', model.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching model images:', error)
        setModelImages([])
      } else {
        const images = data || []

        // Reorder images: primary first, then rest by creation date
        const primaryImage = images.find(img => img.is_primary)
        const nonPrimaryImages = images.filter(img => !img.is_primary).sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )

        const orderedImages = primaryImage ? [primaryImage, ...nonPrimaryImages] : nonPrimaryImages

        setModelImages(orderedImages)

        // Always start at index 0 since primary is now always first
        setCurrentImageIndex(0)
      }
    } catch (error) {
      console.error('Error fetching model images:', error)
      setModelImages([])
      setCurrentImageIndex(0)
    } finally {
      setImagesLoading(false)
    }
  }

  // Carousel navigation functions
  const goToPreviousImage = () => {
    setCurrentImageIndex(prev =>
      prev === 0 ? modelImages.length - 1 : prev - 1
    )
  }

  const goToNextImage = () => {
    setCurrentImageIndex(prev =>
      prev === modelImages.length - 1 ? 0 : prev + 1
    )
  }

  const goToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Image upload functions (copied from AddModelModal)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
    e.target.value = '' // Clear input to allow re-selecting same files
  }

  const processFiles = (files: File[]) => {
    setFileSizeError('')
    setCompressionInfo('')

    if (files.length === 0) return

    const maxSize = 50 * 1024 * 1024 // 50MB in bytes
    const validFiles: File[] = []

    for (const file of files) {
      // Validate file type
      if (!isValidImageFile(file)) {
        setFileSizeError(`Invalid file: ${file.name}. Please select valid image files (JPEG, PNG, or WebP)`)
        return
      }

      if (file.size > maxSize) {
        setFileSizeError(`File too large: ${file.name} (${formatFileSize(file.size)}). Maximum size is 50MB`)
        return
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setSelectedImages(validFiles)

      // Show image cropper for the first selected image
      setImageForCropping(validFiles[0])
      setShowImageCropper(true)

      // Show compression info for larger files
      const largeFiles = validFiles.filter(file => file.size > 1024 * 1024)
      if (largeFiles.length > 0) {
        setCompressionInfo(`${largeFiles.length} large file(s) will be automatically compressed before upload.`)
      }
    }
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
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

      // Try to get camera access with more flexible constraints
      let stream: MediaStream
      try {
        // First try with environment camera (back camera)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        })
      } catch (error) {
        // Fallback to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
      }

      // Create a video element to capture the frame
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.addEventListener('loadedmetadata', resolve)
      })

      // Create canvas to capture the frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(video, 0, 0)

        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' })

            // Stop the camera stream
            stream.getTracks().forEach(track => track.stop())

            // Process the captured image
            setSelectedImages([file])

            // Show image cropper for the captured image
            setImageForCropping(file)
            setShowImageCropper(true)

            // Show compression info for larger files
            if (file.size > 1024 * 1024) { // Files larger than 1MB
              setCompressionInfo(`Original size: ${formatFileSize(file.size)}. Image will be automatically compressed before upload.`)
            }
          }
        }, 'image/jpeg', 0.8)
      }
    } catch (error) {
      console.error('Camera capture error:', error)
      setFileSizeError('Unable to access camera. Please check permissions or try uploading an image instead.')
    }
  }

  const handleCroppedImage = (croppedFile: File) => {
    // Replace the first image with the cropped version, keep other images unchanged
    setSelectedImages(prev => {
      const newImages = [...prev]
      newImages[0] = croppedFile // Replace first image with cropped version
      return newImages
    })
    setShowImageCropper(false)
    setImageForCropping(null)

    // Mark that this is a cropped image (no compression needed)
    setCompressionInfo(`Cropped image ready for upload (${formatFileSize(croppedFile.size)})`)
  }

  const handleCropperClose = () => {
    setShowImageCropper(false)
    setImageForCropping(null)
    // Clear the file input
    const fileInput = document.getElementById('progress-image') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const uploadProgressPhotos = async () => {
    if (selectedImages.length === 0 || !currentModel || !user) return

    setCompressing(true)

    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i]

        // Check if this is a cropped image (it will have been processed by our cropper)
        const isCroppedImage = compressionInfo.includes('Cropped image ready')

        let compressedFile: File
        if (isCroppedImage && i === 0) {
          // Compress cropped image before upload
          try {
            compressedFile = await compressImage(file, 1200, 1200, 0.8)
            console.log(`Cropped progress photo compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`)
          } catch (compressionError) {
            console.error('Cropped image compression error:', compressionError)
            // Fallback to original file if compression fails
            compressedFile = file
          }
        } else {
          // Original compression logic for non-cropped images
          try {
            compressedFile = await compressImage(file, 1200, 1200, 0.8)
            console.log(`Progress photo compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`)
          } catch (compressionError) {
            console.error('Image compression error:', compressionError)
            // Fallback to original file if compression fails
            compressedFile = file
          }
        }

        const fileExt = compressedFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-progress-${Math.random().toString(36).substring(2)}.${fileExt}`

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('model-images')
          .upload(fileName, compressedFile)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw new Error(`Failed to upload image: ${uploadError.message}`)
        }

        const { data } = supabase.storage
          .from('model-images')
          .getPublicUrl(uploadData.path)

        // Insert into model_images table
        const { error: imageError } = await supabase
          .from('model_images')
          .insert({
            model_id: currentModel.id,
            image_url: data.publicUrl,
            is_primary: false,
            display_order: 999 + i, // Put progress photos at the end
            user_id: user.id
          })

        if (imageError) {
          console.error('Database insert error:', imageError)
          throw imageError
        }
      }

      // Clear the selected images and refresh
      setSelectedImages([])
      setCompressionInfo('')
      setFileSizeError('')

      // Clear file input
      const fileInput = document.getElementById('progress-image') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      // Refresh the images
      await fetchModelImages()

      console.log('Progress photos uploaded successfully')

    } catch (error) {
      console.error('Error uploading progress photos:', error)
      setFileSizeError('Failed to upload progress photos. Please try again.')
    } finally {
      setCompressing(false)
    }
  }


  // Update current model when prop changes
  React.useEffect(() => {
    setCurrentModel(model)
    if (model) {
      const newPaintingData = {
        painting_notes: model.painting_notes || '',
        status: model.status || '',
        painted_date: model.painted_date || ''
      }
      setPaintingData(newPaintingData)
      setOriginalPaintingData(newPaintingData)

      // Reset to primary image when model changes
      setCurrentImageIndex(0)

      // Fetch images when model changes and modal is open
      if (isOpen) {
        fetchModelImages()
      }
    }
  }, [model, isOpen])

  // Handle model updates by refreshing the model data
  const handleModelUpdated = async () => {
    // Notify parent component to refresh data
    onModelUpdated?.()
  }

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Keyboard navigation for carousel
  React.useEffect(() => {
    if (!isOpen || modelImages.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousImage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextImage()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, modelImages.length])

  if (!isOpen || !model) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close if edit modal is open
    if (showEditModal) return

    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

  const getStatusText = (status: string, count: number) => {
    return `${count} Model${count > 1 ? 's' : ''}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Painted': return 'bg-green-100 text-green-800'
      case 'Partially Painted': return 'bg-yellow-100 text-yellow-800'
      case 'Primed': return 'bg-blue-100 text-blue-800'
      case 'Assembled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaintedDate = () => {
    // Return the painted date if it exists
    return model?.painted_date || null
  }

  const getPaintNotes = () => {
    return model?.notes || null
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!model) return

    setDeleting(true)

    try {
      // Delete associated image from storage if it exists
      if (model.image_url &&
          typeof model.image_url === 'string' &&
          model.image_url.includes('supabase')) {
        // Extract the file path from the URL
        const urlParts = model.image_url.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'model-images')
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')
          await supabase.storage
            .from('model-images')
            .remove([filePath])
        }
      }

      // Delete the model from the database
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', model.id)

      if (error) throw error

      // Close modals and refresh data
      setShowDeleteModal(false)
      onClose()

      // Notify parent component to refresh the models list
      if (onModelDeleted) {
        onModelDeleted()
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      // You could add error handling UI here
    } finally {
      setDeleting(false)
    }
  }

  const handleShareModel = () => {
    setShowShareModal(true)
  }

  const handleScreenshotShare = () => {
    setShowScreenshotModal(true)
  }

  const handleEditSuccess = async () => {
    // Close both edit modal and view modal, return to collections
    setShowEditModal(false)
    onClose()

    // Refresh the data in the background
    if (onModelUpdated) {
      await onModelUpdated()
    }
  }

  const handleSavePainting = async () => {
    if (!currentModel) return

    const { error } = await supabase
      .from('models')
      .update({
        painting_notes: paintingData.painting_notes,
        status: paintingData.status,
        painted_date: paintingData.painted_date || null
      })
      .eq('id', currentModel.id)

    if (error) {
      console.error('Error saving painting notes:', error)
      // You could add error handling UI here
    } else {
      setCurrentModel(prev => prev ? {
        ...prev,
        painting_notes: paintingData.painting_notes,
        status: paintingData.status,
        painted_date: paintingData.painted_date
      } : null)
      setOriginalPaintingData(paintingData)
      setIsEditingPaintingNotes(false)
      
      // Notify parent component to refresh data
      if (onModelUpdated) {
        await onModelUpdated()
      }
    }
  }

  const handleCancelPaintingEdit = () => {
    setPaintingData(originalPaintingData)
    setIsEditingPaintingNotes(false)
  }

  // Check if painting data has changed
  const hasPaintingChanges = paintingData.painting_notes !== originalPaintingData.painting_notes ||
                            paintingData.status !== originalPaintingData.status ||
                            paintingData.painted_date !== originalPaintingData.painted_date

  if (!isOpen || !currentModel) return null

  return (
    <>
      <div
        className={`fixed inset-0 bg-black flex items-center justify-center p-0 sm:p-4 z-50 modal-container ${
          showEditModal ? 'bg-opacity-25' : 'bg-opacity-50'
        }`}
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-2xl w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col modal-content">
          {/* Sticky Close Button */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 md:absolute text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 z-20"
          >
            <X className="w-6 h-6 text-icon" />
          </button>

          {/* Content - Scrollable area */}
          <div className="flex-1 overflow-y-auto">
            {/* Image Carousel */}
            <div className="relative">
              {(modelImages.length > 0 || (!imagesLoading && model.image_url)) ? (
                <>
                  {/* Current Image */}
                  <img
                    src={(() => {
                      // If we have images from model_images table, use those
                      if (modelImages.length > 0) {
                        const currentImage = modelImages[currentImageIndex]
                        if (currentImage?.image_url) {
                          return currentImage.image_url
                        }
                      }

                      // Fallback to model.image_url (legacy)
                      if (model.image_url &&
                         typeof model.image_url === 'string' &&
                         model.image_url.trim() !== '' &&
                         model.image_url !== 'undefined' &&
                         model.image_url !== 'null') {
                        return model.image_url
                      }

                      // Final fallback
                      return '/bp-unkown.svg'
                    })()}
                    alt={`${model.name} - Image ${currentImageIndex + 1}`}
                    className="w-full object-cover rounded-none sm:rounded-t-lg"
                    style={{
                      marginTop: 'calc(-1 * max(1rem, env(safe-area-inset-top)))',
                      paddingTop: 'max(1rem, env(safe-area-inset-top))'
                    }}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const fallbackUrl = '/bp-unkown.svg'
                      if (target.src !== fallbackUrl) {
                        console.log('Modal image failed to load:', target.src, 'Falling back to default')
                        target.src = fallbackUrl
                      }
                    }}
                  />

                  {/* Carousel Controls - Only show if multiple images from model_images table */}
                  {modelImages.length > 1 && (
                    <>
                      {/* Previous Button */}
                      <button
                        onClick={goToPreviousImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>

                      {/* Next Button */}
                      <button
                        onClick={goToNextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-opacity z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>

                      {/* Image Indicators */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                        {modelImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex
                                ? 'bg-white'
                                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* Image Counter */}
                      <div className="absolute top-6 right-6 bg-black bg-opacity-25 text-white text-sm px-2 py-1 rounded z-10">
                        {currentImageIndex + 1} / {modelImages.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                /* No image available - show game icon or default */
                <img
                  src={(() => {
                    // Try to use the game's icon as fallback
                    const gameIcon = model.box?.game?.icon || model.game?.icon
                    if (gameIcon &&
                        typeof gameIcon === 'string' &&
                        gameIcon.trim() !== '' &&
                        gameIcon !== 'undefined' &&
                        gameIcon !== 'null' &&
                        gameIcon.startsWith('http')) {
                      return gameIcon
                    }

                    // Final fallback to default image
                    return '/bp-unkown.svg'
                  })()}
                  alt={model.name}
                  className="w-full object-cover rounded-none sm:rounded-t-lg"
                  style={{
                    marginTop: 'calc(-1 * max(1rem, env(safe-area-inset-top)))',
                    paddingTop: 'max(1rem, env(safe-area-inset-top))'
                  }}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    const fallbackUrl = '/bp-unkown.svg'
                    if (target.src !== fallbackUrl) {
                      console.log('Modal image failed to load:', target.src, 'Falling back to default')
                      target.src = fallbackUrl
                    }
                  }}
                />
              )}
            </div>

            <div className="p-6">
            {/* Title Section */}
            <div className="text-center mb-6 relative">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-title">{model.name}</h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              {model.box ? (
                <button
                  onClick={() => {
                    onClose()
                    onViewBox?.(model.box)
                  }}
                  className="text-base text-secondary-text mb-3 hover:text-amber-600 transition-colors"
                >
                  {model.box.name}
                </button>
              ) : null}
              <div className="flex items-center justify-center space-x-4">
                {(model.box?.game?.icon || model.game?.icon) ? (
                  <img
                    src={model.box?.game?.icon || model.game?.icon}
                    alt={`${model.box?.game?.name || model.game?.name || 'Unknown Game'} icon`}
                    className="object-cover rounded max-h-[32px]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      console.warn('Game icon failed to load:', target.src, 'Falling back to letter icon')
                      // Hide the broken image and show fallback
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback && fallback.classList.contains('icon-fallback')) {
                        fallback.style.display = 'flex'
                      }
                    }}
                    onLoad={(e) => {
                      // Hide fallback when image loads successfully
                      const target = e.target as HTMLImageElement
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback && fallback.classList.contains('icon-fallback')) {
                        fallback.style.display = 'none'
                      }
                    }}
                  />
                ) : null}
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: (model.box?.game?.icon || model.game?.icon) ? 'none' : 'flex' }}>
                  <span className="text-white text-xs font-bold">
                    {(model.box?.game?.name || model.game?.name || 'Unknown Game').charAt(0)}
                  </span>
                </div>
                <span className="text-lg font-semibold text-secondary-text">
                  {model.box?.game?.name || model.game?.name || 'Unknown Game'}
                </span>
              </div>
            </div>

            {/* Painting Section (No tab selector - directly show painting content) */}
            <div className="space-y-3">
              {/* Painted Status */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text">
                    Painted Status
                  </label>
                  {!isEditingPaintingNotes && (
                    <button
                      onClick={() => setIsEditingPaintingNotes(true)}
                      className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                      title="Edit painting status"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingPaintingNotes ? (
                  <select
                    value={paintingData.status}
                    onChange={(e) => setPaintingData({ ...paintingData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Status</option>
                    <option value="Assembled">Assembled</option>
                    <option value="Primed">Primed</option>
                    <option value="Partially Painted">Partially Painted</option>
                    <option value="Painted">Painted</option>
                  </select>
                ) : (
                  <div className="text-base text-text font-medium">
                    {paintingData.status || 'No status selected'}
                  </div>
                )}
              </div>

              {/* Painted Date - Only show if status is Painted */}
              {(paintingData.status === 'Painted' || (!isEditingPaintingNotes && getPaintedDate())) && (
                <div className="bg-bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-text">
                      Painted Date
                    </label>
                    {!isEditingPaintingNotes && (
                      <button
                        onClick={() => setIsEditingPaintingNotes(true)}
                        className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                        title="Edit painted date"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isEditingPaintingNotes ? (
                    <DatePicker
                      value={paintingData.painted_date}
                      onChange={(date) => setPaintingData({ ...paintingData, painted_date: date })}
                      placeholder="Select painted date"
                      minDate=""
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-secondary-text" />
                      <span className="text-base text-text font-medium">
                        {paintingData.painted_date ? `Painted ${formatDate(paintingData.painted_date)}` : 'No painted date selected'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Painting Information */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text">
                    Painting Information
                  </label>
                  {!isEditingPaintingNotes && (
                    <button
                      onClick={() => setIsEditingPaintingNotes(true)}
                      className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                      title="Edit painting information"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingPaintingNotes ? (
                  <>
                    <RichTextEditor
                      value={paintingData.painting_notes}
                      onChange={(value) => setPaintingData({ ...paintingData, painting_notes: value })}
                      placeholder="Enter painting information..."
                      rows={6}
                    />
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleSavePainting}
                        disabled={!hasPaintingChanges}
                        className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelPaintingEdit}
                        className="btn-danger-outline flex-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="min-h-[6rem]">
                    {paintingData.painting_notes ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-base text-text">{children}</p>,
                            h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-text">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-text">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-text">{children}</h3>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="text-base text-text">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                            em: ({ children }) => <em className="italic text-text">{children}</em>,
                            code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                            pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2 text-text">{children}</blockquote>,
                          }}
                        >
                          {paintingData.painting_notes}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-secondary-text italic flex items-center justify-center h-24">
                        No painting information added yet. Click the edit button to add some!
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Notes - only show if notes exist */}
              {getPaintNotes() && (
                <div className="bg-bg-secondary rounded-lg p-4 flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-secondary-text mt-0.5" />
                  <div className="flex-1">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-base text-text">{children}</p>,
                        h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-text">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-text">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-text">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-base text-text">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                        em: ({ children }) => <em className="italic text-text">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2 text-text">{children}</blockquote>,
                      }}
                    >
                      {getPaintNotes()}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {!getPaintedDate() && !getPaintNotes() && !paintingData.painting_notes && (
                <div className="bg-bg-secondary rounded-lg p-4">
                  <div className="text-center text-secondary-text">
                    <Brush className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No painting information available</p>
                  </div>
                </div>
              )}

              {/* Progress Photo Upload */}
              <div className="bg-bg-secondary rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-text">
                    Upload progress photo
                  </label>
                  <span className="text-sm text-gray-500">Optional</span>
                </div>

                {/* Image Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive
                      ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/5'
                      : 'border-border-custom hover:border-[var(--color-brand)]'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {selectedImages.length > 0 ? (
                    <div className="space-y-4">
                      {/* Show first image as main */}
                      <div className="relative mx-auto w-32 h-32">
                        <img
                          src={URL.createObjectURL(selectedImages[0])}
                          alt="Main progress photo"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImages([])
                            setFileSizeError('')
                            setCompressionInfo('')
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[var(--color-brand)] text-white text-xs px-2 py-1 rounded">
                          Progress Photo
                        </div>
                      </div>

                      {/* Show additional images if any */}
                      {selectedImages.length > 1 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {selectedImages.slice(1).map((file, index) => (
                            <div key={index + 1} className="relative w-16 h-16">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Additional progress photo ${index + 2}`}
                                className="w-full h-full object-cover rounded border-2 border-border-custom"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedImages(prev => prev.filter((_, i) => i !== index + 1))
                                }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors text-xs"
                              >
                                <X className="w-2 h-2" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-sm text-secondary-text">
                        <p className="font-medium">{selectedImages[0].name} {selectedImages.length > 1 && `+ ${selectedImages.length - 1} more`}</p>
                        <p className="text-xs mt-1">Photos will be added to your model's image gallery</p>
                      </div>

                      {/* Upload Button */}
                      <button
                        onClick={uploadProgressPhotos}
                        disabled={compressing}
                        className="btn-secondary btn-with-icon w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4" />
                        <span>
                          {compressing ? 'Uploading...' : 'Upload Progress Photo(s)'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dragActive && (
                        <div className="mb-4">
                          <p className="text-lg font-medium text-[var(--color-brand)]">Drop images here</p>
                        </div>
                      )}

                      <div className="flex justify-center space-x-4">
                        <label className="cursor-pointer">
                          <input
                            id="progress-image"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={compressing}
                          />
                          <div className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-primary transition-colors">
                            <Image className="w-8 h-8 text-icon" />
                            <span className="text-sm font-medium text-text">Upload Images</span>
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={handleCameraCapture}
                          disabled={compressing}
                          className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-bg-primary transition-colors"
                        >
                          <Camera className="w-8 h-8 text-icon" />
                          <span className="text-sm font-medium text-text">Take Photo</span>
                        </button>
                      </div>
                      <p className="text-xs text-secondary-text">
                        {dragActive ? 'Drop multiple images here' : 'JPEG, PNG, or WebP up to 50MB each. Drag & drop or click to select multiple images.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Error Messages */}
                {fileSizeError && (
                  <p className="text-red-600 text-sm mt-2">{fileSizeError}</p>
                )}

                {/* Compression Info */}
                {compressionInfo && (
                  <div className="text-blue-600 text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mt-2">
                    {compressionInfo}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 modal-actions">
              <div className="space-y-3">
                {/* Share Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShareModel}
                    className="btn-secondary btn-full btn-with-icon"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Model</span>
                  </button>
                  <button
                    onClick={handleScreenshotShare}
                    className="btn-secondary btn-full btn-with-icon"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Share Screenshot</span>
                  </button>
                </div>
                <button
                  onClick={handleDeleteClick}
                  className="btn-danger-outline w-full"
                >
                  Delete this model
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModelModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        modelName={model.name}
        loading={deleting}
      />

      <EditModelModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onModelUpdated={handleEditSuccess}
        model={model}
      />

      <ShareModelModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onModelUpdated={handleModelUpdated}
        model={currentModel}
      />

      <Toast
        message="A share link has been copied to your clipboard"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <ShareScreenshotPreview
        isOpen={showScreenshotModal}
        onClose={() => setShowScreenshotModal(false)}
        model={currentModel ? {
          ...currentModel,
          images: modelImages
        } : null}
      />

      {imageForCropping && (
        <ImageCropper
          isOpen={showImageCropper}
          onClose={handleCropperClose}
          onCrop={handleCroppedImage}
          imageFile={imageForCropping}
        />
      )}
    </>
  )
}