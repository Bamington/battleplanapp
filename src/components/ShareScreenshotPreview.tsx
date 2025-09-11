import React, { useState, useRef, useEffect } from 'react'
import { X, Copy, Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { formatLocalDate } from '../utils/timezone'
import { supabase } from '../lib/supabase'
import { themes, getTheme, type ThemeId } from '../themes'
import { Toast } from './Toast'

interface ShareScreenshotPreviewProps {
  isOpen: boolean
  onClose: () => void
  model: {
    id: string
    name: string
    image_url?: string
    painted_date?: string | null
    box?: {
      name: string
      game?: {
        id: string
        name: string
        icon?: string | null
        default_theme?: string | null
      } | null
    } | null
    game?: {
      id: string
      name: string
      icon?: string | null
      default_theme?: string | null
    } | null
  } | null
}

export function ShareScreenshotPreview({ isOpen, onClose, model }: ShareScreenshotPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(false)
  const [copying, setCopying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isDarkText, setIsDarkText] = useState(false)
  const [showPaintedDate, setShowPaintedDate] = useState(true)
  const [showCollectionName, setShowCollectionName] = useState(false)
  const [showGameDetails, setShowGameDetails] = useState(true)
  const [shadowOpacity, setShadowOpacity] = useState(0.2)
  const [textPosition, setTextPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [userPublicName, setUserPublicName] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showVisualOverlays, setShowVisualOverlays] = useState(true)
  const [overlayOpacity, setOverlayOpacity] = useState(0.3)
  const { user, isBetaTester } = useAuth()

  // Helper function to get the appropriate theme based on the model's game
  const getGameTheme = (model: ShareScreenshotPreviewProps['model']): ThemeId => {
    if (!model) return 'battleplan'
    
    // Check if the model has a direct game with default_theme
    if (model.game?.default_theme && themes[model.game.default_theme as ThemeId]) {
      return model.game.default_theme as ThemeId
    }
    
    // Check if the model's box has a game with default_theme
    if (model.box?.game?.default_theme && themes[model.box.game.default_theme as ThemeId]) {
      return model.box.game.default_theme as ThemeId
    }
    
    // Fallback to battleplan theme
    return 'battleplan'
  }

  // Initialize theme based on the model's game
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(() => getGameTheme(model))

  // Get current theme from the new theme system
  const currentTheme = getTheme(selectedTheme)

  // Update theme when model changes
  useEffect(() => {
    if (model) {
      const gameTheme = getGameTheme(model)
      setSelectedTheme(gameTheme)
    }
  }, [model])

  // Fetch user's public name when modal opens
  useEffect(() => {
    const fetchUserPublicName = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('user_name_public')
            .eq('id', user.id)
            .single()

          if (error) {
            console.warn('Error fetching user public name:', error)
            setUserPublicName(null)
          } else {
            setUserPublicName(data?.user_name_public || null)
          }
        } catch (error) {
          console.warn('Error fetching user public name:', error)
          setUserPublicName(null)
        }
      }
    }

    if (isOpen && user?.id) {
      fetchUserPublicName()
    }
  }, [isOpen, user?.id])

  // Generate the screenshot when modal opens or any setting changes
  useEffect(() => {
    if (isOpen && model) {
      generateScreenshot()
    }
  }, [isOpen, model, isDarkText, showPaintedDate, showCollectionName, showGameDetails, shadowOpacity, textPosition, selectedTheme, userPublicName, showVisualOverlays, overlayOpacity])

  const generateScreenshot = async () => {
    if (!model || !canvasRef.current) return

    setGenerating(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // Load fonts for current theme
      if (currentTheme.renderOptions.loadFonts) {
        await currentTheme.renderOptions.loadFonts()
      }
      // Load the model image first to get its aspect ratio
      if (model.image_url) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Set canvas dimensions based on image aspect ratio
            const aspectRatio = img.width / img.height
            const maxSize = 1200 // Higher resolution for better quality
            
            if (aspectRatio > 1) {
              canvas.width = maxSize
              canvas.height = maxSize / aspectRatio
            } else {
              canvas.width = maxSize * aspectRatio
              canvas.height = maxSize
            }
            
            // Create rounded clipping path for the image
            const imageCornerRadius = 20
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(0, 0, canvas.width, canvas.height, imageCornerRadius)
            ctx.clip()
            
            // Draw the image to fill the entire canvas (now clipped to rounded corners)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            
            // Restore context to remove clipping for subsequent draws
            ctx.restore()
            
            // Add gradient at the top using theme colors
            const gradientHeight = canvas.height * 0.2 // 20% of image height
            const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight)
            const gradientColor = currentTheme.colors.gradientColor
            gradient.addColorStop(0, `rgba(${gradientColor}, 0.4)`) // Theme color at 40% opacity
            gradient.addColorStop(1, `rgba(${gradientColor}, 0)`)   // Fully transparent
            
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, gradientHeight)
            
            // Add radial gradient to bottom-right corner
            const cornerRadius = Math.min(canvas.width, canvas.height) * 0.3 // 30% of smallest dimension
            const cornerCenterX = canvas.width
            const cornerCenterY = canvas.height
            
            const radialGradient = ctx.createRadialGradient(
              cornerCenterX, cornerCenterY, 0, // Inner circle (center point, no radius)
              cornerCenterX, cornerCenterY, cornerRadius // Outer circle
            )
            radialGradient.addColorStop(0, `rgba(${gradientColor}, 0.4)`) // Theme color at 40% opacity at center
            radialGradient.addColorStop(1, `rgba(${gradientColor}, 0)`)   // Fully transparent at edge
            
            ctx.fillStyle = radialGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Add 3px thick rounded border using theme color
            const borderColor = currentTheme.colors.borderColor
            const borderWidth = 3
            const borderCornerRadius = 20 // Match the corner radius used in createRoundedImage
            ctx.strokeStyle = borderColor
            ctx.lineWidth = borderWidth
            
            // Draw rounded border inside the canvas bounds
            const borderOffset = borderWidth / 2
            const borderX = borderOffset
            const borderY = borderOffset
            const borderW = canvas.width - borderWidth
            const borderH = canvas.height - borderWidth
            const innerBorderRadius = borderCornerRadius - borderOffset // Adjust radius for inner border
            
            ctx.beginPath()
            ctx.roundRect(borderX, borderY, borderW, borderH, innerBorderRadius)
            ctx.stroke()
            
            resolve()
          }
          img.onerror = reject
          img.src = model.image_url!
        })
      } else {
        // Fallback dimensions if no image
        canvas.width = 1200
        canvas.height = 1200
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      // Add Battleplan logo to top-left
      try {
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => {
            // Calculate logo size (proportional to canvas size) - reduced by 25% from previous
            const logoMaxSize = Math.min(canvas.width, canvas.height) * 0.24 // 24% of smallest dimension (75% of previous size)
            const logoAspectRatio = logoImg.width / logoImg.height
            
            let logoWidth = logoMaxSize
            let logoHeight = logoMaxSize
            
            if (logoAspectRatio > 1) {
              logoHeight = logoMaxSize / logoAspectRatio
            } else {
              logoWidth = logoMaxSize * logoAspectRatio
            }
            
            // Position in top-left with padding
            const logoPadding = 40
            const logoX = logoPadding
            const logoY = logoPadding
            
            // Draw the logo
            ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)
            
            resolve()
          }
          logoImg.onerror = () => {
            // If logo fails to load, just continue without it
            console.warn('Failed to load Battleplan logo')
            resolve()
          }
          // Use the same Battleplan logo for both themes
          logoImg.src = '/Battleplan-Logo-Purple.svg'
        })
      } catch (error) {
        console.warn('Error loading logo:', error)
      }

      // Use new theme system for rendering
      const renderContext = {
        ctx,
        canvas,
        model,
        user,
        userPublicName,
        shadowOpacity,
        textPosition,
        showPaintedDate,
        showCollectionName,
        showGameDetails,
        isDarkText,
        showVisualOverlays,
        overlayOpacity
      }

      // Render visual overlays if enabled and theme supports them
      if (showVisualOverlays && currentTheme.renderOptions.visualOverlays) {
        for (const overlay of currentTheme.renderOptions.visualOverlays) {
          if (overlay.enabled) {
            // Save current context state
            ctx.save()
            
            try {
              overlay.render(renderContext, overlay)
            } catch (error) {
              console.warn('Error rendering visual overlay:', overlay.id, error)
            }
            
            // Restore context state
            ctx.restore()
          }
        }
      }

      // Check if theme has custom rendering logic
      if (currentTheme.renderOptions.renderModelName) {
        // Theme has custom model name rendering (like Marathon)
        currentTheme.renderOptions.renderModelName(renderContext)
      }

      // Render other text elements using theme's standard layout
      if (currentTheme.renderOptions.renderStandardLayout) {
        await currentTheme.renderOptions.renderStandardLayout(renderContext)
      }

    } catch (error) {
      console.error('Error generating screenshot:', error)
    } finally {
      setGenerating(false)
    }
  }

  const createRoundedImage = () => {
    if (!canvasRef.current) return null

    const originalCanvas = canvasRef.current
    const roundedCanvas = document.createElement('canvas')
    const roundedCtx = roundedCanvas.getContext('2d')
    
    if (!roundedCtx) return null

    roundedCanvas.width = originalCanvas.width
    roundedCanvas.height = originalCanvas.height

    // Create rounded rectangle clipping path
    const cornerRadius = 20
    roundedCtx.beginPath()
    roundedCtx.roundRect(0, 0, roundedCanvas.width, roundedCanvas.height, cornerRadius)
    roundedCtx.clip()

    // Draw the original image into the clipped area
    roundedCtx.drawImage(originalCanvas, 0, 0)

    return roundedCanvas
  }

  const copyToClipboard = async () => {
    if (!canvasRef.current) return

    setCopying(true)
    try {
      const roundedCanvas = createRoundedImage()
      if (roundedCanvas) {
        await new Promise<void>((resolve, reject) => {
          roundedCanvas.toBlob(async (blob) => {
            try {
              if (blob) {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob })
                ])
                // Show success toast
                setToastMessage('Image copied to clipboard!')
                setShowToast(true)
                resolve()
              } else {
                reject(new Error('Failed to create blob'))
              }
            } catch (error) {
              reject(error)
            }
          }, 'image/png')
        })
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    } finally {
      setCopying(false)
    }
  }

  const saveImage = () => {
    if (!canvasRef.current || !model) return

    setSaving(true)
    try {
      const roundedCanvas = createRoundedImage()
      if (roundedCanvas) {
        const link = document.createElement('a')
        link.download = `${model.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_share.png`
        link.href = roundedCanvas.toDataURL('image/png')
        link.click()
      }
    } catch (error) {
      console.error('Error saving image:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !model) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-[80]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-5xl w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-title">Share Screenshot</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6 text-icon" />
          </button>
        </div>

        <div className="flex-1 flex flex-col space-y-6">
          {/* Canvas Preview - Maintain aspect ratio on all devices */}
          <div className="flex justify-center bg-transparent">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto shadow-lg"
              style={{ maxHeight: '70vh' }}
            />
          </div>

          {/* Loading State */}
          {generating && (
            <div className="text-center text-secondary-text">
              Generating screenshot...
            </div>
          )}

          {/* Controls - Moved below image */}
          <div className="space-y-4">
            {/* Text Color Switch */}
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-secondary-text">Text Color:</span>
              <div className="flex items-center space-x-3">
                <span className={`text-sm ${!isDarkText ? 'text-text font-medium' : 'text-secondary-text'}`}>
                  Light
                </span>
                <button
                  onClick={() => setIsDarkText(!isDarkText)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                    isDarkText ? 'bg-brand' : 'bg-secondary-text'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkText ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-sm ${isDarkText ? 'text-text font-medium' : 'text-secondary-text'}`}>
                  Dark
                </span>
              </div>
            </div>

            {/* Shadow Opacity Slider */}
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-secondary-text">Text Shadow:</span>
              <div className="flex items-center space-x-3 w-48">
                <span className="text-xs text-secondary-text">None</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={shadowOpacity}
                  onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${shadowOpacity * 100}%, #e5e7eb ${shadowOpacity * 100}%, #e5e7eb 100%)`
                  }}
                />
                <span className="text-xs text-secondary-text">Strong</span>
              </div>
            </div>

            {/* Text Position Dropdown - Hidden for Marathon theme */}
            {selectedTheme !== 'marathon' && (
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm text-secondary-text">Text Position:</span>
                <select
                  value={textPosition}
                  onChange={(e) => setTextPosition(e.target.value as 'bottom-right' | 'bottom-left')}
                  className="px-3 py-1 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand bg-bg-primary text-text text-sm"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
            )}

            {/* Theme Selector - Available for All Users */}
            <div className="flex items-center justify-center space-x-4">
              <span className="text-sm text-secondary-text">Theme:</span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value as ThemeId)}
                className="px-3 py-1 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand bg-bg-primary text-text text-sm"
              >
                {Object.entries(themes)
                  .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                  .map(([key, theme]) => (
                    <option key={key} value={key}>
                      {theme.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Visual Overlays Controls */}
            {currentTheme.renderOptions.visualOverlays && currentTheme.renderOptions.visualOverlays.length > 0 && (
              <>
                {/* Visual Overlays Toggle */}
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-sm text-secondary-text">Visual Overlays:</span>
                  <button
                    onClick={() => setShowVisualOverlays(!showVisualOverlays)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                      showVisualOverlays ? 'bg-brand' : 'bg-secondary-text'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showVisualOverlays ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${showVisualOverlays ? 'text-text font-medium' : 'text-secondary-text'}`}>
                    {showVisualOverlays ? 'Show' : 'Hide'}
                  </span>
                </div>

                {/* Overlay Opacity Slider */}
                {showVisualOverlays && (
                  <div className="flex items-center justify-center space-x-4">
                    <span className="text-sm text-secondary-text">Overlay Intensity:</span>
                    <div className="flex items-center space-x-3 w-48">
                      <span className="text-xs text-secondary-text">Subtle</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={overlayOpacity}
                        onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${overlayOpacity * 100}%, #e5e7eb ${overlayOpacity * 100}%, #e5e7eb 100%)`
                        }}
                      />
                      <span className="text-xs text-secondary-text">Bold</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Show/Hide Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8">
              {/* Show Painted Date */}
              {model.painted_date && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-secondary-text">Painted Date:</span>
                  <button
                    onClick={() => setShowPaintedDate(!showPaintedDate)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                      showPaintedDate ? 'bg-brand' : 'bg-secondary-text'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showPaintedDate ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${showPaintedDate ? 'text-text font-medium' : 'text-secondary-text'}`}>
                    {showPaintedDate ? 'Show' : 'Hide'}
                  </span>
                </div>
              )}

              {/* Show Collection Name */}
              {model.box?.name && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-secondary-text">Collection:</span>
                  <button
                    onClick={() => setShowCollectionName(!showCollectionName)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                      showCollectionName ? 'bg-brand' : 'bg-secondary-text'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showCollectionName ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${showCollectionName ? 'text-text font-medium' : 'text-secondary-text'}`}>
                    {showCollectionName ? 'Show' : 'Hide'}
                  </span>
                </div>
              )}

              {/* Show Game Details */}
              {(model.box?.game?.name || model.game?.name) && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-secondary-text">Game:</span>
                  <button
                    onClick={() => setShowGameDetails(!showGameDetails)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 ${
                      showGameDetails ? 'bg-brand' : 'bg-secondary-text'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showGameDetails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${showGameDetails ? 'text-text font-medium' : 'text-secondary-text'}`}>
                    {showGameDetails ? 'Show' : 'Hide'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Both primary now */}
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={copyToClipboard}
              disabled={generating || copying}
              className="btn-primary btn-with-icon flex-1 sm:flex-initial"
            >
              <Copy className="w-4 h-4" />
              <span>{copying ? 'Copying...' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={saveImage}
              disabled={generating || saving}
              className="btn-primary btn-with-icon flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Image'}</span>
            </button>
          </div>
        </div>
      </div>
      
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}