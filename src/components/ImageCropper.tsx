import { useState, useRef, useEffect } from 'react'
import { Cropper, CropperRef } from 'react-advanced-cropper'
import 'react-advanced-cropper/dist/style.css'
import { X, RotateCcw, RotateCw, ZoomIn, ZoomOut, Move, Sun, Moon } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedFile: File) => void
  imageFile: File
}

export function ImageCropper({ isOpen, onClose, onCrop, imageFile }: ImageCropperProps) {
  const cropperRef = useRef<CropperRef>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [isMobile, setIsMobile] = useState(false)
  const [brightness, setBrightness] = useState(0)

  // Detect mobile device and handle orientation changes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load image when modal opens
  useEffect(() => {
    if (isOpen && imageFile) {
      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [isOpen, imageFile])

  // Disable body scroll when modal is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      document.body.style.overscrollBehavior = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.overscrollBehavior = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [isOpen])

  const handleCrop = async () => {
    const cropper = cropperRef.current
    if (!cropper) return

    const canvas = cropper.getCanvas()
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: imageFile.type,
          lastModified: Date.now()
        })
        onCrop(croppedFile)
      }
    }, imageFile.type, 0.9)
  }

  const handleZoomIn = () => {
    const cropper = cropperRef.current
    if (cropper) {
      cropper.zoomImage(1.2)
    }
  }

  const handleZoomOut = () => {
    const cropper = cropperRef.current
    if (cropper) {
      cropper.zoomImage(0.8)
    }
  }

  const handleRotateLeft = () => {
    const cropper = cropperRef.current
    if (cropper) {
      cropper.rotateImage(-90)
    }
  }

  const handleRotateRight = () => {
    const cropper = cropperRef.current
    if (cropper) {
      cropper.rotateImage(90)
    }
  }

  const handleReset = () => {
    const cropper = cropperRef.current
    if (cropper) {
      cropper.reset()
    }
    setBrightness(0)
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] ${
        isMobile ? 'p-0' : 'p-4'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={`bg-modal-bg w-full ${
        isMobile 
          ? 'h-full rounded-none flex flex-col' 
          : 'rounded-lg max-w-4xl h-full max-h-[90vh] flex flex-col'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between ${
          isMobile ? 'p-4 border-b border-border-custom' : 'p-6 border-b border-border-custom'
        }`}>
          <h2 className="text-lg font-bold text-title">Crop Image</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'} min-h-0`}>
          <div className="w-full h-full">
            {imageUrl && (
              <Cropper
                ref={cropperRef}
                src={imageUrl}
                className="w-full h-full"
                backgroundClassName="bg-gray-900"
                stencilProps={{
                  aspectRatio: undefined, // Allow free aspect ratio
                  movable: true,
                  resizable: true,
                  lines: true,
                  handlers: true,
                }}
                style={{
                  filter: brightness !== 0 ? `brightness(${1 + brightness / 100})` : undefined,
                }}
              />
            )}
          </div>
            </div>
            
        {/* Controls */}
        <div className={`${isMobile ? 'p-4 border-t border-border-custom' : 'p-6 border-t border-border-custom'}`}>
                    {/* Mobile-friendly control buttons */}
          <div className={`flex flex-wrap gap-2 mb-4 justify-center ${isMobile ? 'grid grid-cols-2' : ''}`}>
            <button
              onClick={handleZoomOut}
              className={`btn-ghost btn-sm flex items-center gap-2 ${
                isMobile ? 'px-4 py-3 justify-center' : 'px-3 py-2'
              }`}
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
              <span className={isMobile ? 'inline' : 'hidden sm:inline'}>Zoom Out</span>
            </button>
            <button
              onClick={handleZoomIn}
              className={`btn-ghost btn-sm flex items-center gap-2 ${
                isMobile ? 'px-4 py-3 justify-center' : 'px-3 py-2'
              }`}
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
              <span className={isMobile ? 'inline' : 'hidden sm:inline'}>Zoom In</span>
            </button>
            <button
              onClick={handleRotateLeft}
              className={`btn-ghost btn-sm flex items-center gap-2 ${
                isMobile ? 'px-4 py-3 justify-center' : 'px-3 py-2'
              }`}
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4" />
              <span className={isMobile ? 'inline' : 'hidden sm:inline'}>Rotate Left</span>
            </button>
            <button
              onClick={handleRotateRight}
              className={`btn-ghost btn-sm flex items-center gap-2 ${
                isMobile ? 'px-4 py-3 justify-center' : 'px-3 py-2'
              }`}
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4" />
              <span className={isMobile ? 'inline' : 'hidden sm:inline'}>Rotate Right</span>
            </button>
            {!isMobile && (
              <button
                onClick={handleReset}
                className="btn-ghost btn-sm flex items-center gap-2 px-3 py-2"
                title="Reset"
              >
                <Move className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          {/* Brightness Control */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrightness(Math.max(-100, brightness - 10))}
                className="btn-ghost btn-sm w-8 h-8 p-0 flex-shrink-0"
                disabled={brightness <= -100}
                title="Decrease Brightness"
              >
                <Moon className="w-4 h-4" />
              </button>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
              <button
                onClick={() => setBrightness(Math.min(100, brightness + 10))}
                className="btn-ghost btn-sm w-8 h-8 p-0 flex-shrink-0"
                disabled={brightness >= 100}
                title="Increase Brightness"
              >
                <Sun className="w-4 h-4" />
              </button>
            </div>
          </div>

                    {/* Reset button for mobile - separate row */}
          {isMobile && (
            <div className="mb-4">
              <button
                onClick={handleReset}
                className="btn-ghost btn-sm w-full flex items-center justify-center gap-2 px-4 py-3"
                title="Reset All"
              >
                <Move className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
          <button
            onClick={onClose}
              className={`btn-ghost btn-flex ${isMobile ? 'flex-1 py-4' : 'flex-1'}`}
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
              className={`btn-primary btn-flex ${isMobile ? 'flex-1 py-4' : 'flex-1'}`}
          >
            Crop & Use
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}