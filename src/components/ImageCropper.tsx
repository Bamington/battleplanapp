import React, { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCrop: (croppedFile: File) => void
  imageFile: File
}

export function ImageCropper({ isOpen, onClose, onCrop, imageFile }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [cropArea, setCropArea] = useState({ x: 100, y: 100, width: 200, height: 200 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Mobile detection
  const isMobile = window.innerWidth <= 768

  // Prevent scrolling on mobile when touching the canvas
  useEffect(() => {
    if (!isOpen || !isMobile) return

    const preventScroll = (e: TouchEvent) => {
      e.preventDefault()
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('touchmove', preventScroll, { passive: false })
      
      return () => {
        canvas.removeEventListener('touchmove', preventScroll)
      }
    }
  }, [isOpen, isMobile])

  // Disable body scroll when modal is open
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

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault()
          setZoom(prev => Math.min(5, prev + 0.1))
          break
        case '-':
          e.preventDefault()
          setZoom(prev => Math.max(0.1, prev - 0.1))
          break
        case 'r':
          e.preventDefault()
          setRotation(prev => prev + 90)
          break
        case 'l':
          e.preventDefault()
          setRotation(prev => prev - 90)
          break
        case '0':
          e.preventDefault()
          setZoom(1)
          setRotation(0)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Load image when modal opens
  useEffect(() => {
    if (isOpen && imageFile) {
      const img = new Image()
      img.onload = () => {
        setImage(img)
        // Set initial crop area
        setCropArea({ x: 100, y: 100, width: 200, height: 200 })
        // Reset zoom and rotation
        setZoom(1)
        setRotation(0)
      }
      img.src = URL.createObjectURL(imageFile)
      return () => URL.revokeObjectURL(img.src)
    }
  }, [isOpen, imageFile])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Move to center of canvas
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180)
    
    // Apply zoom
    ctx.scale(zoom, zoom)
    
    // Draw image centered
    const scaledWidth = image.width * zoom
    const scaledHeight = image.height * zoom
    ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
    
    // Restore context state
    ctx.restore()

    // Draw crop border in the original canvas space
    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 2
    ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height)

    // Draw corner handles - make them larger and more prominent on mobile
    const handleSize = isMobile ? 20 : 16
    ctx.fillStyle = '#F59E0B'
    
    // Top-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize)
    // Top-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize)
    // Bottom-left
    ctx.fillRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize)
    // Bottom-right
    ctx.fillRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize)

    // Add white borders to handles for better visibility
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(cropArea.x - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize)
    ctx.strokeRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y - handleSize/2, handleSize, handleSize)
    ctx.strokeRect(cropArea.x - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize)
    ctx.strokeRect(cropArea.x + cropArea.width - handleSize/2, cropArea.y + cropArea.height - handleSize/2, handleSize, handleSize)


  }, [image, cropArea, isMobile, zoom, rotation])

  // Handle touch events
  const handleTouchStart = (touch: any) => {
    console.log('handleTouchStart called with touch:', touch)
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('Canvas ref not available')
      return
    }

    const rect = canvas.getBoundingClientRect()
    // Calculate scale factors between HTML canvas size and CSS display size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    // Transform touch coordinates to account for zoom and rotation
    let x = (touch.clientX - rect.left) * scaleX
    let y = (touch.clientY - rect.top) * scaleY
    
    // The crop area is drawn in the original canvas space
    // We need to convert the transformed touch coordinates to match that space
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // First, reverse the rotation transformation
    if (rotation !== 0) {
      const cos = Math.cos(-rotation * Math.PI / 180)
      const sin = Math.sin(-rotation * Math.PI / 180)
      const dx = x - centerX
      const dy = y - centerY
      x = centerX + dx * cos - dy * sin
      y = centerY + dx * sin + dy * cos
    }
    
    // Then reverse the zoom transformation
    x = (x - centerX) / zoom + centerX
    y = (y - centerY) / zoom + centerY

    // Debug logging
    console.log('Touch detected:', { 
      touchX: touch.clientX, 
      touchY: touch.clientY, 
      canvasX: x, 
      canvasY: y,
      cropArea,
      isMobile,
      handleHitSize: isMobile ? 60 : 32,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      scaleX,
      scaleY
    })

    // Check if touching on corner handles
    const handleSize = isMobile ? 20 : 16
    const handleHitSize = isMobile ? 120 : 64 // Doubled the hit area for easier grabbing
    
    console.log('Checking touch position:', { x, y, handleHitSize, cropArea })

    // Top-left handle
    if (x >= cropArea.x - handleHitSize/2 && x <= cropArea.x + handleHitSize/2 &&
        y >= cropArea.y - handleHitSize/2 && y <= cropArea.y + handleHitSize/2) {
      console.log('Top-left handle touched!')
      // Handle top-left resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        // Transform the new touch coordinates the same way
        let newX = (touch.clientX - rect.left) * scaleX
        let newY = (touch.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial touch
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: Math.max(0, startCrop.x + deltaX),
          y: Math.max(0, startCrop.y + deltaY),
          width: Math.max(50, startCrop.width - deltaX),
          height: Math.max(50, startCrop.height - deltaY)
        })
      }

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: false })
      return
    }

    // Top-right handle
    if (x >= cropArea.x + cropArea.width - handleHitSize/2 && x <= cropArea.x + cropArea.width + handleHitSize/2 &&
        y >= cropArea.y - handleHitSize/2 && y <= cropArea.y + handleHitSize/2) {
      console.log('Top-right handle touched!')
      // Handle top-right resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        // Transform the new touch coordinates the same way
        let newX = (touch.clientX - rect.left) * scaleX
        let newY = (touch.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial touch
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: startCrop.x,
          y: Math.max(0, startCrop.y + deltaY),
          width: Math.max(50, startCrop.width + deltaX),
          height: Math.max(50, startCrop.height - deltaY)
        })
      }

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: false })
      return
    }

    // Bottom-left handle
    if (x >= cropArea.x - handleHitSize/2 && x <= cropArea.x + handleHitSize/2 &&
        y >= cropArea.y + cropArea.height - handleHitSize/2 && y <= cropArea.y + cropArea.height + handleHitSize/2) {
      console.log('Bottom-left handle touched!')
      // Handle bottom-left resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        // Transform the new touch coordinates the same way
        let newX = (touch.clientX - rect.left) * scaleX
        let newY = (touch.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial touch
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: Math.max(0, startCrop.x + deltaX),
          y: startCrop.y,
          width: Math.max(50, startCrop.width - deltaX),
          height: Math.max(50, startCrop.height + deltaY)
        })
      }

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: false })
        return
      }

    // Bottom-right handle
    if (x >= cropArea.x + cropArea.width - handleHitSize/2 && x <= cropArea.x + cropArea.width + handleHitSize/2 &&
        y >= cropArea.y + cropArea.height - handleHitSize/2 && y <= cropArea.y + cropArea.height + handleHitSize/2) {
      console.log('Bottom-right handle touched!')
      // Handle bottom-right resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0]
        // Transform the new touch coordinates the same way
        let newX = (touch.clientX - rect.left) * scaleX
        let newY = (touch.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial touch
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: startCrop.x,
          y: startCrop.y,
          width: Math.max(50, startCrop.width + deltaX),
          height: Math.max(50, startCrop.height + deltaY)
        })
      }

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }

      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: false })
      return
    }
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    // Calculate scale factors between HTML canvas size and CSS display size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    // Transform mouse coordinates to account for zoom and rotation
    let x = (e.clientX - rect.left) * scaleX
    let y = (e.clientY - rect.top) * scaleY
    
    // The crop area is drawn in the original canvas space
    // We need to convert the transformed mouse coordinates to match that space
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // First, reverse the rotation transformation
    if (rotation !== 0) {
      const cos = Math.cos(-rotation * Math.PI / 180)
      const sin = Math.sin(-rotation * Math.PI / 180)
      const dx = x - centerX
      const dy = y - centerY
      x = centerX + dx * cos - dy * sin
      y = centerY + dx * sin + dy * cos
    }
    
    // Then reverse the zoom transformation
    x = (x - centerX) / zoom + centerX
    y = (y - centerY) / zoom + centerY

    // Check if clicking on corner handles
    const handleSize = isMobile ? 20 : 16
    const handleHitSize = isMobile ? 120 : 64 // Doubled the hit area for easier grabbing

    // Top-left handle
    if (x >= cropArea.x - handleHitSize/2 && x <= cropArea.x + handleHitSize/2 &&
        y >= cropArea.y - handleHitSize/2 && y <= cropArea.y + handleHitSize/2) {
      // Handle top-left resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleMouseMove = (e: MouseEvent) => {
        // Transform the new mouse coordinates the same way
        let newX = (e.clientX - rect.left) * scaleX
        let newY = (e.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial click
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: Math.max(0, startCrop.x + deltaX),
          y: Math.max(0, startCrop.y + deltaY),
          width: Math.max(50, startCrop.width - deltaX),
          height: Math.max(50, startCrop.height - deltaY)
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return
    }

    // Top-right handle
    if (x >= cropArea.x + cropArea.width - handleHitSize/2 && x <= cropArea.x + cropArea.width + handleHitSize/2 &&
        y >= cropArea.y - handleHitSize/2 && y <= cropArea.y + handleHitSize/2) {
      // Handle top-right resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleMouseMove = (e: MouseEvent) => {
        // Transform the new mouse coordinates the same way
        let newX = (e.clientX - rect.left) * scaleX
        let newY = (e.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial click
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: startCrop.x,
          y: Math.max(0, startCrop.y + deltaY),
          width: Math.max(50, startCrop.width + deltaX),
          height: Math.max(50, startCrop.height - deltaY)
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return
    }

    // Bottom-left handle
    if (x >= cropArea.x - handleHitSize/2 && x <= cropArea.x + handleHitSize/2 &&
        y >= cropArea.y + cropArea.height - handleHitSize/2 && y <= cropArea.y + cropArea.height + handleHitSize/2) {
      // Handle bottom-left resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleMouseMove = (e: MouseEvent) => {
        // Transform the new mouse coordinates the same way
        let newX = (e.clientX - rect.left) * scaleX
        let newY = (e.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial click
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: Math.max(0, startCrop.x + deltaX),
          y: startCrop.y,
          width: Math.max(50, startCrop.width - deltaX),
          height: Math.max(50, startCrop.height + deltaY)
        })
      }

  const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return
    }

    // Bottom-right handle
    if (x >= cropArea.x + cropArea.width - handleHitSize/2 && x <= cropArea.x + cropArea.width + handleHitSize/2 &&
        y >= cropArea.y + cropArea.height - handleHitSize/2 && y <= cropArea.y + cropArea.height + handleHitSize/2) {
      // Handle bottom-right resize
      const startX = x
      const startY = y
      const startCrop = { ...cropArea }

      const handleMouseMove = (e: MouseEvent) => {
        // Transform the new mouse coordinates the same way
        let newX = (e.clientX - rect.left) * scaleX
        let newY = (e.clientY - rect.top) * scaleY
        
        // Apply the same transformations as the initial click
        const dx = newX - centerX
        const dy = newY - centerY
        
        if (rotation !== 0) {
          const cos = Math.cos(-rotation * Math.PI / 180)
          const sin = Math.sin(-rotation * Math.PI / 180)
          newX = centerX + dx * cos - dy * sin
          newY = centerY + dx * sin + dy * cos
        }
        
        newX = (newX - centerX) / zoom + centerX
        newY = (newY - centerY) / zoom + centerY
        
        const deltaX = newX - startX
        const deltaY = newY - startY

        setCropArea({
          x: startCrop.x,
          y: startCrop.y,
          width: Math.max(50, startCrop.width + deltaX),
          height: Math.max(50, startCrop.height + deltaY)
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return
    }


  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas || !image) return

    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas')
    const cropCtx = cropCanvas.getContext('2d')
    if (!cropCtx) return

    // Set crop canvas size
    cropCanvas.width = cropArea.width
    cropCanvas.height = cropArea.height

    // Create a temporary canvas to apply transformations
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    // Set temp canvas size to match the original image
    tempCanvas.width = image.width
    tempCanvas.height = image.height

    // Apply transformations to the temp canvas
    tempCtx.save()
    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
    tempCtx.rotate((rotation * Math.PI) / 180)
    tempCtx.scale(zoom, zoom)
    tempCtx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height)
    tempCtx.restore()

    // Calculate the actual crop area in the transformed image
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    
    // Convert crop area coordinates to transformed image coordinates
    let cropX = cropArea.x
    let cropY = cropArea.y
    
    // Account for zoom and rotation transformations
    if (zoom !== 1 || rotation !== 0) {
      // This is a simplified approach - for more accuracy, we'd need to reverse the transformations
      // For now, we'll use the crop area as-is and let the user adjust if needed
      cropX = cropArea.x
      cropY = cropArea.y
    }

    // Draw the cropped portion from the transformed image
    cropCtx.drawImage(
      tempCanvas,
      cropX,
      cropY,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    )

    // Convert to blob and create file
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], imageFile.name, {
          type: imageFile.type,
          lastModified: Date.now()
        })
        onCrop(croppedFile)
      }
    }, imageFile.type, 1.0)
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
          : 'rounded-lg max-w-2xl p-6'
      }`}>
        <div className={`flex items-center justify-between ${
          isMobile ? 'p-4 border-b border-border-custom' : 'mb-4'
        }`}>
          <h2 className="text-lg font-bold text-title">Crop Image</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className={`${isMobile ? 'flex-1 p-4' : 'mb-4'}`}>
          <div 
            className="relative select-none"
            style={{
              touchAction: 'none',
              overscrollBehavior: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <canvas
              ref={canvasRef}
              width={600}
              height={400}
              className={`border border-border-custom w-full block ${
                isMobile ? 'h-full object-contain' : 'rounded-lg'
              }`}
                      style={{ 
                        cursor: 'crosshair',
                        touchAction: 'none',
                        maxHeight: isMobile ? 'calc(100vh - 200px)' : '400px',
                        position: 'relative',
                        zIndex: 10,
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        MozUserSelect: 'none',
                        msUserSelect: 'none',
                        overscrollBehavior: 'none',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
              onMouseDown={handleMouseDown}
              onTouchStart={(e) => {
                // Handle touch start for cropping without preventDefault
                console.log('Canvas touch start event:', e.type, 'passive:', e.defaultPrevented)
                const touch = e.touches[0]
                handleTouchStart(touch)
              }}
            />
          </div>

          {/* Zoom and Rotation Controls */}
          <div className={`mt-4 ${isMobile ? 'space-y-4' : 'space-y-3'}`}>
            {/* Instructions */}
            <div className="text-xs text-secondary-text text-center">
              <span className="hidden sm:inline">Keyboard shortcuts: +/- zoom, r/l rotate, 0 reset</span>
            </div>
            
            {/* Controls Row */}
            <div className={`${isMobile ? 'space-y-4' : 'space-y-3'}`}>
              {/* Zoom Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
                  className="btn-ghost btn-sm w-8 h-8 p-0 flex-shrink-0"
                  disabled={zoom <= 0.1}
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                />
                <button
                  onClick={() => setZoom(Math.min(5, zoom + 0.1))}
                  className="btn-ghost btn-sm w-8 h-8 p-0 flex-shrink-0"
                  disabled={zoom >= 5}
                >
                  +
                </button>
              </div>

              {/* Rotation Controls */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setRotation(rotation - 90)}
                  className="btn-ghost btn-sm w-8 h-8 p-0 flex-shrink-0"
                >
                  ↺
                </button>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                />
                <button
                  onClick={() => setRotation(rotation + 90)}
                  className="btn-ghost btn-sm w-8 h-8 p-0 flex-shrink-0"
                >
                  ↻
                </button>
              </div>

              {/* Reset Button - Only show when values have changed */}
              {(zoom !== 1 || rotation !== 0 || cropArea.x !== 100 || cropArea.y !== 100 || cropArea.width !== 200 || cropArea.height !== 200) && (
                <button
                  onClick={() => {
                    setZoom(1)
                    setRotation(0)
                    setCropArea({ x: 100, y: 100, width: 200, height: 200 })
                  }}
                  className="btn-secondary w-full"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`flex space-x-3 ${isMobile ? 'p-4 border-t border-border-custom' : ''}`}>
          <button
            onClick={onClose}
            className={`btn-ghost btn-flex ${isMobile ? 'flex-1 py-3' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className={`btn-primary btn-flex ${isMobile ? 'flex-1 py-3' : ''}`}
          >
            Crop & Use
          </button>
        </div>
      </div>
    </div>
  )
}