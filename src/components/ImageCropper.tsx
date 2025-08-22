import React, { useState, useRef, useCallback, useEffect } from 'react'
import { X, RotateCw, ZoomIn, ZoomOut, Move } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedFile: File) => void
  imageFile: File
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageAdjustments {
  exposure: number
}

export function ImageCropper({ isOpen, onClose, onCrop, imageFile }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 200, height: 200 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [resizeHandle, setResizeHandle] = useState<string>('')
  const [adjustments, setAdjustments] = useState<ImageAdjustments>({ exposure: 0 })

  useEffect(() => {
    if (isOpen && imageFile) {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        // Calculate scale to fit image in canvas
        const canvasWidth = 600
        const canvasHeight = 400
        const scaleX = canvasWidth / img.width
        const scaleY = canvasHeight / img.height
        const fitScale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down
        
        // Calculate 80% square crop area based on the smaller dimension
        const scaledImageWidth = img.width * fitScale
        const scaledImageHeight = img.height * fitScale
        const smallerDimension = Math.min(scaledImageWidth, scaledImageHeight)
        const cropSize = smallerDimension * 0.8
        
        setCropArea({
          x: (canvasWidth - cropSize) / 2,
          y: (canvasHeight - cropSize) / 2,
          width: cropSize,
          height: cropSize // Square crop area
        })
        setScale(fitScale)
        setRotation(0)
        setAdjustments({ exposure: 0 })
      }
      img.src = URL.createObjectURL(imageFile)
      return () => URL.revokeObjectURL(img.src)
    }
  }, [isOpen, imageFile])

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context for transformations
    ctx.save()

    // Apply transformations to the image
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(scale, scale)

    // Apply exposure adjustment
    if (adjustments.exposure !== 0) {
      // Create a temporary canvas for exposure adjustment
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (tempCtx) {
        tempCanvas.width = image.width
        tempCanvas.height = image.height
        
        // Draw original image
        tempCtx.drawImage(image, 0, 0)
        
        // Apply exposure adjustment using composite operations
        if (adjustments.exposure > 0) {
          // Brighten: overlay white with opacity based on exposure
          tempCtx.globalCompositeOperation = 'screen'
          tempCtx.fillStyle = `rgba(255, 255, 255, ${adjustments.exposure / 100})`
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        } else if (adjustments.exposure < 0) {
          // Darken: overlay black with opacity based on exposure
          tempCtx.globalCompositeOperation = 'multiply'
          tempCtx.fillStyle = `rgba(0, 0, 0, ${Math.abs(adjustments.exposure) / 100})`
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        }
        
        // Draw the adjusted image
        ctx.drawImage(tempCanvas, -image.width / 2, -image.height / 2, image.width, image.height)
      }
    } else {
      // Draw image normally without adjustments
      ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height)
    }

    // Restore context
    ctx.restore()


    // Draw crop border
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 2
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

    // Draw resize handles
    const handleSize = 8
    const handles = [
      // Corner handles for independent width/height resizing
      { x: cropArea.x - handleSize / 2, y: cropArea.y - handleSize / 2 },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y - handleSize / 2 },
      { x: cropArea.x - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 },
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 },
      // Side handles for width/height only
      { x: cropArea.x + cropArea.width / 2 - handleSize / 2, y: cropArea.y - handleSize / 2 }, // top
      { x: cropArea.x + cropArea.width - handleSize / 2, y: cropArea.y + cropArea.height / 2 - handleSize / 2 }, // right
      { x: cropArea.x + cropArea.width / 2 - handleSize / 2, y: cropArea.y + cropArea.height - handleSize / 2 }, // bottom
      { x: cropArea.x - handleSize / 2, y: cropArea.y + cropArea.height / 2 - handleSize / 2 } // left
    ]

    ctx.fillStyle = '#F59E0B'
    handles.forEach(handle => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
    })
  }, [image, cropArea, scale, rotation, adjustments])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on resize handles
    const handleVisualSize = 8
    // Increase hit box on mobile devices
    const isMobile = window.innerWidth <= 768
    const handleClickSize = isMobile ? 40 : 20 // Much larger clickable area on mobile
    const handles = [
      // Corner handles
      { x: cropArea.x - handleClickSize / 2, y: cropArea.y - handleClickSize / 2, type: 'nw' },
      { x: cropArea.x + cropArea.width - handleClickSize / 2, y: cropArea.y - handleClickSize / 2, type: 'ne' },
      { x: cropArea.x - handleClickSize / 2, y: cropArea.y + cropArea.height - handleClickSize / 2, type: 'sw' },
      { x: cropArea.x + cropArea.width - handleClickSize / 2, y: cropArea.y + cropArea.height - handleClickSize / 2, type: 'se' },
      // Side handles
      { x: cropArea.x + cropArea.width / 2 - handleClickSize / 2, y: cropArea.y - handleClickSize / 2, type: 'n' },
      { x: cropArea.x + cropArea.width - handleClickSize / 2, y: cropArea.y + cropArea.height / 2 - handleClickSize / 2, type: 'e' },
      { x: cropArea.x + cropArea.width / 2 - handleClickSize / 2, y: cropArea.y + cropArea.height - handleClickSize / 2, type: 's' },
      { x: cropArea.x - handleClickSize / 2, y: cropArea.y + cropArea.height / 2 - handleClickSize / 2, type: 'w' }
    ]

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i]
      if (x >= handle.x && x <= handle.x + handleClickSize && y >= handle.y && y <= handle.y + handleClickSize) {
        setIsResizing(true)
        setResizeHandle(handle.type)
        setDragStart({ x, y })
        return
      }
    }

    // Check if clicking inside crop area (for moving crop area)
    if (x >= cropArea.x && x <= cropArea.x + cropArea.width && 
        y >= cropArea.y && y <= cropArea.y + cropArea.height) {
      setIsDragging(true)
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y })
    }
  }

  const [cursorStyle, setCursorStyle] = useState('crosshair')

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update cursor based on mouse position when not dragging or resizing
    if (!isDragging && !isResizing) {
      // Use same mobile-responsive hit box for hover detection
      const isMobile = window.innerWidth <= 768
      const handleClickSize = isMobile ? 40 : 20
      const handles = [
        // Corner handles
        { x: cropArea.x - handleClickSize / 2, y: cropArea.y - handleClickSize / 2, type: 'nw' },
        { x: cropArea.x + cropArea.width - handleClickSize / 2, y: cropArea.y - handleClickSize / 2, type: 'ne' },
        { x: cropArea.x - handleClickSize / 2, y: cropArea.y + cropArea.height - handleClickSize / 2, type: 'sw' },
        { x: cropArea.x + cropArea.width - handleClickSize / 2, y: cropArea.y + cropArea.height - handleClickSize / 2, type: 'se' },
        // Side handles
        { x: cropArea.x + cropArea.width / 2 - handleClickSize / 2, y: cropArea.y - handleClickSize / 2, type: 'n' },
        { x: cropArea.x + cropArea.width - handleClickSize / 2, y: cropArea.y + cropArea.height / 2 - handleClickSize / 2, type: 'e' },
        { x: cropArea.x + cropArea.width / 2 - handleClickSize / 2, y: cropArea.y + cropArea.height - handleClickSize / 2, type: 's' },
        { x: cropArea.x - handleClickSize / 2, y: cropArea.y + cropArea.height / 2 - handleClickSize / 2, type: 'w' }
      ]

      // Check if hovering over resize handles
      let overHandle = false
      for (let i = 0; i < handles.length; i++) {
        const handle = handles[i]
        if (x >= handle.x && x <= handle.x + handleClickSize && y >= handle.y && y <= handle.y + handleClickSize) {
          overHandle = true
          // Set appropriate resize cursor based on handle type
          switch (handle.type) {
            case 'nw':
            case 'se':
              setCursorStyle('nw-resize')
              break
            case 'ne':
            case 'sw':
              setCursorStyle('ne-resize')
              break
            case 'n':
            case 's':
              setCursorStyle('n-resize')
              break
            case 'e':
            case 'w':
              setCursorStyle('e-resize')
              break
          }
          break
        }
      }

      if (!overHandle) {
        // Check if inside crop area (for moving crop area)
        if (x >= cropArea.x && x <= cropArea.x + cropArea.width && 
            y >= cropArea.y && y <= cropArea.y + cropArea.height) {
          setCursorStyle('move')
        } else {
          // Outside crop area
          setCursorStyle('default')
        }
      }
    }

    if (isDragging) {
      setCursorStyle('move')
      const newX = Math.max(0, Math.min(x - dragStart.x, canvas.width - cropArea.width))
      const newY = Math.max(0, Math.min(y - dragStart.y, canvas.height - cropArea.height))
      setCropArea(prev => ({ ...prev, x: newX, y: newY }))
    } else if (isResizing) {
      const deltaX = x - dragStart.x
      const deltaY = y - dragStart.y
      
      setCropArea(prev => {
        let newX = prev.x
        let newY = prev.y
        let newWidth = prev.width
        let newHeight = prev.height
        
        switch (resizeHandle) {
          case 'nw': // Top-left corner
            newX = Math.max(0, Math.min(prev.x + deltaX, prev.x + prev.width - 50))
            newY = Math.max(0, Math.min(prev.y + deltaY, prev.y + prev.height - 50))
            newWidth = prev.width - (newX - prev.x)
            newHeight = prev.height - (newY - prev.y)
            break
          case 'ne': // Top-right corner
            newY = Math.max(0, Math.min(prev.y + deltaY, prev.y + prev.height - 50))
            newWidth = Math.max(50, Math.min(prev.width + deltaX, canvas.width - prev.x))
            newHeight = prev.height - (newY - prev.y)
            break
          case 'sw': // Bottom-left corner
            newX = Math.max(0, Math.min(prev.x + deltaX, prev.x + prev.width - 50))
            newWidth = prev.width - (newX - prev.x)
            newHeight = Math.max(50, Math.min(prev.height + deltaY, canvas.height - prev.y))
            break
          case 'se': // Bottom-right corner
            newWidth = Math.max(50, Math.min(prev.width + deltaX, canvas.width - prev.x))
            newHeight = Math.max(50, Math.min(prev.height + deltaY, canvas.height - prev.y))
            break
          case 'n': // Top side
            newY = Math.max(0, Math.min(prev.y + deltaY, prev.y + prev.height - 50))
            newHeight = prev.height - (newY - prev.y)
            break
          case 'e': // Right side
            newWidth = Math.max(50, Math.min(prev.width + deltaX, canvas.width - prev.x))
            break
          case 's': // Bottom side
            newHeight = Math.max(50, Math.min(prev.height + deltaY, canvas.height - prev.y))
            break
          case 'w': // Left side
            newX = Math.max(0, Math.min(prev.x + deltaX, prev.x + prev.width - 50))
            newWidth = prev.width - (newX - prev.x)
            break
        }
        
        return { x: newX, y: newY, width: newWidth, height: newHeight }
      })
      setDragStart({ x, y })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle('')
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleExposureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    setAdjustments(prev => ({ ...prev, exposure: value }))
  }

  const resetAdjustments = () => {
    setAdjustments({ exposure: 0 })
  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    // Calculate the transformation matrix to map canvas coordinates to original image coordinates
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    
    // Calculate the actual image bounds on the canvas after transformations
    const imageWidth = image.width * scale
    const imageHeight = image.height * scale
    
    // Calculate where the image appears on the canvas
    const imageLeft = centerX - imageWidth / 2
    const imageTop = centerY - imageHeight / 2
    
    // Calculate crop area relative to the transformed image on canvas
    const cropRelativeX = cropArea.x - imageLeft
    const cropRelativeY = cropArea.y - imageTop
    
    // Convert back to original image coordinates
    const originalCropX = cropRelativeX / scale
    const originalCropY = cropRelativeY / scale
    const originalCropWidth = cropArea.width / scale
    const originalCropHeight = cropArea.height / scale
    
    // Clamp to image boundaries
    const clampedX = Math.max(0, Math.min(originalCropX, image.width))
    const clampedY = Math.max(0, Math.min(originalCropY, image.height))
    const clampedWidth = Math.min(originalCropWidth, image.width - clampedX)
    const clampedHeight = Math.min(originalCropHeight, image.height - clampedY)
    
    // Create a new canvas for the cropped image at original resolution
    const cropCanvas = document.createElement('canvas')
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return

    // Set canvas size to the crop area size (maintaining original resolution)
    cropCanvas.width = Math.round(clampedWidth)
    cropCanvas.height = Math.round(clampedHeight)
    
    // Handle rotation by creating a temporary canvas if needed
    if (rotation !== 0 || adjustments.exposure !== 0) {
      // Create temporary canvas for rotation
      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      if (!tempCtx) return
      
      if (rotation !== 0) {
        // Size temp canvas to fit rotated image
        const radians = (rotation * Math.PI) / 180
        const cos = Math.abs(Math.cos(radians))
        const sin = Math.abs(Math.sin(radians))
        tempCanvas.width = image.width * cos + image.height * sin
        tempCanvas.height = image.width * sin + image.height * cos
        
        // Draw rotated image to temp canvas
        tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
        tempCtx.rotate(radians)
      } else {
        // No rotation, just use original dimensions
        tempCanvas.width = image.width
        tempCanvas.height = image.height
      }
      
      // Draw image (rotated or not)
      tempCtx.drawImage(image, -image.width / 2, -image.height / 2)
      
      // Apply exposure adjustment if needed
      if (adjustments.exposure !== 0) {
        if (adjustments.exposure > 0) {
          // Brighten
          tempCtx.globalCompositeOperation = 'screen'
          tempCtx.fillStyle = `rgba(255, 255, 255, ${adjustments.exposure / 100})`
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        } else {
          // Darken
          tempCtx.globalCompositeOperation = 'multiply'
          tempCtx.fillStyle = `rgba(0, 0, 0, ${Math.abs(adjustments.exposure) / 100})`
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
        }
      }
      
      // Calculate new crop coordinates on rotated image
      let finalCropX, finalCropY
      
      if (rotation !== 0) {
        const radians = (rotation * Math.PI) / 180
        const cos = Math.abs(Math.cos(radians))
        const sin = Math.abs(Math.sin(radians))
        finalCropX = (tempCanvas.width / 2) + (originalCropX - image.width / 2) * cos - (originalCropY - image.height / 2) * sin - clampedWidth / 2
        finalCropY = (tempCanvas.height / 2) + (originalCropX - image.width / 2) * sin + (originalCropY - image.height / 2) * cos - clampedHeight / 2
      } else {
        finalCropX = originalCropX
        finalCropY = originalCropY
      }
      
      // Crop from the rotated temp canvas
      cropCtx.drawImage(
        tempCanvas,
        Math.max(0, finalCropX),
        Math.max(0, finalCropY),
        clampedWidth,
        clampedHeight,
        0,
        0,
        clampedWidth,
        clampedHeight
      )
    } else {
      // No rotation or adjustments - crop directly from original image
      cropCtx.drawImage(
        image,
        clampedX,
        clampedY,
        clampedWidth,
        clampedHeight,
        0,
        0,
        clampedWidth,
        clampedHeight
      )
    }

    // Convert to blob and create file
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: imageFile.type,
          lastModified: Date.now()
        })
        onCrop(croppedFile)
      }
    }, imageFile.type, 1.0) // Use maximum quality for cropping
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-title">Crop Image</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="border border-border-custom rounded-lg w-full block"
            style={{ cursor: cursorStyle }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>

        <div className="space-y-4 mb-6">
          {/* Transform Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleZoomOut}
              className="p-2 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleRotate}
              className="p-2 border border-border-custom rounded-lg hover:bg-bg-secondary transition-colors"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-2 text-sm text-secondary-text">
              <span>Drag crop area or resize handles to adjust selection</span>
            </div>
          </div>
          
          {/* Image Adjustment Controls */}
          <div className="bg-bg-secondary rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-secondary-text">Exposure</label>
                  <span className="text-sm text-secondary-text">{adjustments.exposure > 0 ? '+' : ''}{adjustments.exposure}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={adjustments.exposure}
                  onChange={handleExposureChange}
                  className="w-full h-2 bg-border-custom rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-secondary-text mt-1">
                  <span>Darker</span>
                  <span>Brighter</span>
                </div>
              </div>
              <button
                onClick={resetAdjustments}
                className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                Reset Adjustments
              </button>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border-custom text-text rounded-lg hover:bg-bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Crop & Use
          </button>
        </div>
      </div>
    </div>
  )
}