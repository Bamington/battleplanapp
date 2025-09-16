import React, { useState, useRef, useEffect } from 'react'
import { X, Copy, Download, Save } from 'lucide-react'
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
    share_name?: string | null
    share_artist?: string | null
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
  const [savingImage, setSavingImage] = useState(false)
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
  const [activeTab, setActiveTab] = useState<'Photo' | 'Theme' | 'Content'>('Photo')
  const [brightness, setBrightness] = useState(1)
  const [saturation, setSaturation] = useState(1)
  const [customModelName, setCustomModelName] = useState('')
  const [customCollectionName, setCustomCollectionName] = useState('')
  const [customGameName, setCustomGameName] = useState('')
  const [customPaintedDate, setCustomPaintedDate] = useState('')
  const [customUserName, setCustomUserName] = useState('')

  // Temporary input states for editing without triggering updates
  const [tempModelName, setTempModelName] = useState('')
  const [tempCollectionName, setTempCollectionName] = useState('')
  const [tempGameName, setTempGameName] = useState('')
  const [tempPaintedDate, setTempPaintedDate] = useState('')
  const [tempUserName, setTempUserName] = useState('')

  // Original values for change detection
  const [originalModelName, setOriginalModelName] = useState('')
  const [originalUserName, setOriginalUserName] = useState('')

  // Save state
  const [savingChanges, setSavingChanges] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const [customGradientColor, setCustomGradientColor] = useState('')
  const [customBorderColor, setCustomBorderColor] = useState('')
  const [gradientOpacity, setGradientOpacity] = useState(0.4)
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

  // Initialize custom colors when theme changes
  useEffect(() => {
    const theme = getTheme(selectedTheme)
    // Convert RGB string "255, 128, 0" to hex color
    const rgbToHex = (rgbString: string) => {
      const [r, g, b] = rgbString.split(',').map(s => parseInt(s.trim()))
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    }
    
    try {
      setCustomGradientColor(rgbToHex(theme.colors.gradientColor))
      setCustomBorderColor(theme.colors.borderColor)
    } catch (error) {
      console.warn('Error converting theme colors:', error)
      // Fallback colors
      setCustomGradientColor('#8B5CF6') // Purple
      setCustomBorderColor('#8B5CF6')
    }
  }, [selectedTheme])

  // Initialize custom text fields when modal opens
  useEffect(() => {
    if (isOpen && model) {
      // Use saved share values if available, otherwise use original values
      const modelName = model.share_name || model.name || ''
      const collectionName = model.box?.name || ''
      const gameName = model.box?.game?.name || model.game?.name || ''
      const paintedDate = model.painted_date ? formatLocalDate(model.painted_date, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }) : ''

      // Set custom user name - use saved share_artist if available
      let userName = ''
      if (model.share_artist) {
        userName = model.share_artist
      } else if (userPublicName && userPublicName.trim()) {
        userName = userPublicName.trim()
      } else if (user?.user_metadata?.display_name && user.user_metadata.display_name.trim()) {
        userName = user.user_metadata.display_name.trim()
      }

      // Store original values for change detection
      setOriginalModelName(model.name || '')
      setOriginalUserName(userPublicName?.trim() || user?.user_metadata?.display_name?.trim() || '')

      // Set both custom and temp states
      setCustomModelName(modelName)
      setCustomCollectionName(collectionName)
      setCustomGameName(gameName)
      setCustomPaintedDate(paintedDate)
      setCustomUserName(userName)

      setTempModelName(modelName)
      setTempCollectionName(collectionName)
      setTempGameName(gameName)
      setTempPaintedDate(paintedDate)
      setTempUserName(userName)

      // Reset save state
      setHasUnsavedChanges(false)

      // Preload fonts when modal opens
      ensureFontsLoaded().catch(console.warn)
    }
  }, [isOpen, model, userPublicName, user?.user_metadata?.display_name])

  // Helper function to check if there are unsaved changes
  const checkForUnsavedChanges = (newModelName: string, newUserName: string) => {
    const modelChanged = newModelName !== originalModelName
    const userChanged = newUserName !== originalUserName
    setHasUnsavedChanges(modelChanged || userChanged)
  }

  // Helper functions to handle input field updates
  const handleModelNameUpdate = () => {
    setCustomModelName(tempModelName)
    checkForUnsavedChanges(tempModelName, customUserName)
  }
  const handleCollectionNameUpdate = () => setCustomCollectionName(tempCollectionName)
  const handleGameNameUpdate = () => setCustomGameName(tempGameName)
  const handlePaintedDateUpdate = () => setCustomPaintedDate(tempPaintedDate)
  const handleUserNameUpdate = () => {
    setCustomUserName(tempUserName)
    checkForUnsavedChanges(customModelName, tempUserName)
  }

  const handleKeyDown = (e: React.KeyboardEvent, updateFn: () => void) => {
    if (e.key === 'Enter') {
      updateFn()
    }
  }

  // Save changes to database
  const saveChanges = async () => {
    if (!model || !hasUnsavedChanges) return

    setSavingChanges(true)
    try {
      // Prepare update object
      const updates: { share_name?: string | null; share_artist?: string | null } = {}

      // Only update share_name if model name has changed
      if (customModelName !== originalModelName) {
        updates.share_name = customModelName || null
      }

      // Only update share_artist if user name has changed
      if (customUserName !== originalUserName) {
        updates.share_artist = customUserName || null
      }

      // Update the database
      const { error } = await supabase
        .from('models')
        .update(updates)
        .eq('id', model.id)

      if (error) {
        console.error('Error saving changes:', error)
        setToastMessage('Failed to save changes')
        setShowToast(true)
      } else {
        // Update original values to reflect the saved state
        if (updates.share_name !== undefined) {
          setOriginalModelName(customModelName)
        }
        if (updates.share_artist !== undefined) {
          setOriginalUserName(customUserName)
        }

        setHasUnsavedChanges(false)
        setToastMessage('Changes saved successfully!')
        setShowToast(true)
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      setToastMessage('Failed to save changes')
      setShowToast(true)
    } finally {
      setSavingChanges(false)
    }
  }

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
      // Debounce the screenshot generation to prevent multiple simultaneous renders
      const timeoutId = setTimeout(() => {
        generateScreenshot()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isOpen, model, isDarkText, showPaintedDate, showCollectionName, showGameDetails, shadowOpacity, textPosition, selectedTheme, userPublicName, showVisualOverlays, overlayOpacity, customModelName, customCollectionName, customGameName, customPaintedDate, customUserName, customGradientColor, customBorderColor, gradientOpacity])

  const ensureFontsLoaded = async () => {
    // Check if document.fonts is available (modern browsers)
    if ('fonts' in document) {
      try {
        // Wait for all fonts to be loaded
        await document.fonts.ready
        
        // Additionally check for specific fonts that might be used
        const fontFaces = [
          new FontFace('Overpass', 'url(/fonts/overpass-regular.woff2)'),
          new FontFace('Overpass', 'url(/fonts/overpass-semibold.woff2)', { weight: '600' }),
          new FontFace('Overpass', 'url(/fonts/overpass-bold.woff2)', { weight: 'bold' })
        ]
        
        // Load common font weights that might be used
        const fontPromises = fontFaces.map(async (font) => {
          try {
            await font.load()
            document.fonts.add(font)
          } catch (error) {
            // Font might not exist or already be loaded, continue
            console.warn('Font loading warning (this is usually not an issue):', error)
          }
        })
        
        await Promise.allSettled(fontPromises)
        
        // Additional check - force browser to render fonts by creating a test element
        const testDiv = document.createElement('div')
        testDiv.style.fontFamily = 'Overpass, sans-serif'
        testDiv.style.fontSize = '1px'
        testDiv.style.position = 'absolute'
        testDiv.style.left = '-9999px'
        testDiv.textContent = 'Test'
        document.body.appendChild(testDiv)
        
        // Force layout
        testDiv.offsetHeight
        
        // Clean up
        document.body.removeChild(testDiv)
        
      } catch (error) {
        console.warn('Font loading check failed, proceeding anyway:', error)
      }
    } else {
      // Fallback for older browsers - just wait a bit
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  const generateScreenshot = async () => {
    if (!model || !canvasRef.current || generating) return

    console.log('Share Screenshot Debug - Generating screenshot with:', {
      userPublicName,
      userEmail: user?.email,
      userDisplayName: user?.user_metadata?.display_name,
      modelName: model.name,
      selectedTheme
    })

    setGenerating(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Clear the entire canvas to prevent overlapping from previous renders
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      // Ensure fonts are loaded before proceeding
      await ensureFontsLoaded()
      
      // Load fonts for current theme
      if (currentTheme.renderOptions.loadFonts) {
        await currentTheme.renderOptions.loadFonts()
      }
      
      // Wait a bit more to ensure fonts are fully rendered
      await new Promise(resolve => setTimeout(resolve, 300))
      // Load the model image first to get its aspect ratio
      let imageLoaded = false
      if (model.image_url) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        try {
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
              
              // Apply brightness and saturation filters
              ctx.filter = `brightness(${brightness}) saturate(${saturation})`
              
              // Draw the image to fill the entire canvas (no rounded corners)
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
              
              // Reset filter for subsequent draws
              ctx.filter = 'none'
              
              imageLoaded = true
            
            // Add gradients if visual overlays are enabled
            if (showVisualOverlays) {
              // Convert hex color to RGB
              const hexToRgb = (hex: string) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
                return result ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16)
                } : { r: 139, g: 92, b: 246 } // Fallback to purple
              }

              const gradientRgb = hexToRgb(customGradientColor)
              const gradientRgbString = `${gradientRgb.r}, ${gradientRgb.g}, ${gradientRgb.b}`

              // Add gradient at the top using custom colors and opacity
              const gradientHeight = canvas.height * 0.2 // 20% of image height
              const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight)
              gradient.addColorStop(0, `rgba(${gradientRgbString}, ${gradientOpacity})`) // Custom color at custom opacity
              gradient.addColorStop(1, `rgba(${gradientRgbString}, 0)`)   // Fully transparent
              
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
              radialGradient.addColorStop(0, `rgba(${gradientRgbString}, ${gradientOpacity})`) // Custom color at custom opacity at center
              radialGradient.addColorStop(1, `rgba(${gradientRgbString}, 0)`)   // Fully transparent at edge
              
              ctx.fillStyle = radialGradient
              ctx.fillRect(0, 0, canvas.width, canvas.height)
            }
            
              resolve()
            }
            img.onerror = (error) => {
              console.error('Failed to load model/collection image:', model.image_url, error)
              reject(new Error(`Failed to load image: ${model.image_url}`))
            }
            img.src = model.image_url!
          })
        } catch (error) {
          console.warn('Image loading failed, continuing with fallback:', error)
          imageLoaded = false
        }
      }
      
      // Fallback if no image or image failed to load
      if (!imageLoaded) {
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
        model: {
          ...model,
          name: customModelName || model.name,
          painted_date: customPaintedDate || model.painted_date,
          box: model.box ? {
            ...model.box,
            name: customCollectionName || model.box.name,
            game: model.box.game ? {
              ...model.box.game,
              name: customGameName || model.box.game.name
            } : model.box.game
          } : model.box,
          game: model.game ? {
            ...model.game,
            name: customGameName || model.game.name
          } : model.game
        },
        user,
        userPublicName: customUserName || userPublicName,
        shadowOpacity,
        textPosition,
        showPaintedDate,
        showCollectionName,
        showGameDetails,
        isDarkText,
        showVisualOverlays,
        overlayOpacity,
        customGradientColor,
        customBorderColor,
        gradientOpacity
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

      // Draw border on top of everything (last step) - with or without rounded corners based on theme
      ctx.save()
      const borderWidth = 3
      const useRoundedCorners = selectedTheme !== 'marathon' // Marathon theme uses square corners
      const borderCornerRadius = useRoundedCorners ? 8 : 0 // matches Tailwind rounded-lg (0.5rem = 8px) or square
      ctx.strokeStyle = customBorderColor
      ctx.lineWidth = borderWidth
      
      // Draw border inside the canvas bounds
      const borderOffset = borderWidth / 2
      const borderX = borderOffset
      const borderY = borderOffset
      const borderW = canvas.width - borderWidth
      const borderH = canvas.height - borderWidth
      const innerBorderRadius = Math.max(0, borderCornerRadius - borderOffset)
      
      ctx.beginPath()
      if (useRoundedCorners) {
        ctx.roundRect(borderX, borderY, borderW, borderH, innerBorderRadius)
      } else {
        ctx.rect(borderX, borderY, borderW, borderH)
      }
      ctx.stroke()
      ctx.restore()

    } catch (error) {
      console.error('Error generating screenshot:', error)
    } finally {
      setGenerating(false)
    }
  }

  const createImageForExport = () => {
    if (!canvasRef.current) return null

    // If no CSS filters are applied, return original canvas
    if (brightness === 1 && saturation === 1) {
      return canvasRef.current
    }

    // Create a new canvas to apply CSS filters for export
    const exportCanvas = document.createElement('canvas')
    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) return canvasRef.current

    // Set canvas size to match original
    exportCanvas.width = canvasRef.current.width
    exportCanvas.height = canvasRef.current.height

    // Apply brightness and saturation filters
    exportCtx.filter = `brightness(${brightness}) saturate(${saturation})`
    
    // Draw the original canvas with filters applied
    exportCtx.drawImage(canvasRef.current, 0, 0)
    
    // Reset filter
    exportCtx.filter = 'none'
    
    return exportCanvas
  }

  const copyToClipboard = async () => {
    if (!canvasRef.current) return

    setCopying(true)
    try {
      const canvas = createImageForExport()
      if (canvas) {
        await new Promise<void>((resolve, reject) => {
          canvas.toBlob(async (blob) => {
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

    setSavingImage(true)
    try {
      const canvas = createImageForExport()
      if (canvas) {
        const link = document.createElement('a')
        link.download = `${model.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_share.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    } catch (error) {
      console.error('Error saving image:', error)
    } finally {
      setSavingImage(false)
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
            <div className="rounded-lg overflow-hidden shadow-lg">
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto"
                style={{ 
                  maxHeight: '70vh',
                  filter: `brightness(${brightness}) saturate(${saturation})`
                }}
              />
            </div>
          </div>

          {/* Loading State */}
          {generating && (
            <div className="text-center text-secondary-text">
              Generating screenshot...
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="flex bg-bg-secondary rounded-lg p-1">
              {(['Photo', 'Theme', 'Content'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-brand text-white'
                      : 'text-secondary-text hover:text-text'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'Photo' && (
              <div className="space-y-6">
                {/* Image Adjustments Section */}
                <div className="bg-bg-secondary/50 rounded-xl p-4 space-y-4">
                  
                  {/* Brightness & Saturation - Stacked on Mobile, Side by Side on Desktop */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Brightness Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-text">Brightness</label>
                        <span className="text-xs text-secondary-text bg-bg-primary px-2 py-1 rounded-md">{Math.round(brightness * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-secondary-text w-8 text-center">Dark</span>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.1"
                          value={brightness}
                          onChange={(e) => setBrightness(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-brand/50"
                          style={{
                            background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${((brightness - 0.5) / 1.0) * 100}%, var(--color-bg-primary) ${((brightness - 0.5) / 1.0) * 100}%, var(--color-bg-primary) 100%)`
                          }}
                        />
                        <span className="text-xs text-secondary-text w-8 text-center">Bright</span>
                      </div>
                    </div>

                    {/* Saturation Slider */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-text">Saturation</label>
                        <span className="text-xs text-secondary-text bg-bg-primary px-2 py-1 rounded-md">{Math.round(saturation * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-secondary-text w-8 text-center">Gray</span>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={saturation}
                          onChange={(e) => setSaturation(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-brand/50"
                          style={{
                            background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${(saturation / 2.0) * 100}%, var(--color-bg-primary) ${(saturation / 2.0) * 100}%, var(--color-bg-primary) 100%)`
                          }}
                        />
                        <span className="text-xs text-secondary-text w-8 text-center">Vivid</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Styling Section */}
                <div className="bg-bg-secondary/50 rounded-xl p-4 space-y-4">
                  
                  {/* Text Color & Position Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Text Color Toggle */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-secondary-text">Text Color</label>
                      <div className="flex items-center justify-between bg-bg-primary rounded-lg p-3">
                        <span className={`text-sm transition-colors ${!isDarkText ? 'text-text font-medium' : 'text-secondary-text'}`}>
                          Light
                        </span>
                        <button
                          onClick={() => setIsDarkText(!isDarkText)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg-secondary ${
                            isDarkText ? 'bg-brand' : 'bg-border-custom'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              isDarkText ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-sm transition-colors ${isDarkText ? 'text-text font-medium' : 'text-secondary-text'}`}>
                          Dark
                        </span>
                      </div>
                    </div>

                    {/* Text Position - Hidden for themes with custom text positioning */}
                    {!currentTheme.renderOptions.customTextPosition && (
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-secondary-text">Text Position</label>
                        <select
                          value={textPosition}
                          onChange={(e) => setTextPosition(e.target.value as 'bottom-right' | 'bottom-left')}
                          className="w-full px-3 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Text Shadow Slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-secondary-text">Text Shadow</label>
                      <span className="text-xs text-secondary-text bg-bg-primary px-2 py-1 rounded-md">{Math.round(shadowOpacity * 100)}%</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-secondary-text w-8 text-center">None</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={shadowOpacity}
                        onChange={(e) => setShadowOpacity(parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-brand/50"
                        style={{
                          background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${shadowOpacity * 100}%, var(--color-bg-primary) ${shadowOpacity * 100}%, var(--color-bg-primary) 100%)`
                        }}
                      />
                      <span className="text-xs text-secondary-text w-8 text-center">Strong</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Theme' && (
              <div className="space-y-6">
                {/* Theme Selection Section */}
                <div className="bg-bg-secondary/50 rounded-xl p-4 space-y-4">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-secondary-text">Theme</label>
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value as ThemeId)}
                      className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors"
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
                </div>

                {/* Visual Effects Section */}
                <div className="bg-bg-secondary/50 rounded-xl p-4 space-y-4">
                  
                  {/* Gradients Toggle */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-secondary-text">Gradients</label>
                    <div className="flex items-center justify-between bg-bg-primary rounded-lg p-3">
                      <span className={`text-sm transition-colors ${!showVisualOverlays ? 'text-secondary-text' : 'text-text font-medium'}`}>
                        {showVisualOverlays ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => setShowVisualOverlays(!showVisualOverlays)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg-secondary ${
                          showVisualOverlays ? 'bg-brand' : 'bg-border-custom'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                            showVisualOverlays ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Gradient Controls - Only show when gradients are enabled */}
                  {showVisualOverlays && (
                    <>
                      {/* Color Pickers Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Gradient Color */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-secondary-text">Gradient Color</label>
                          <div className="flex items-center space-x-3 bg-bg-primary rounded-lg p-3">
                            <input
                              type="color"
                              value={customGradientColor}
                              onChange={(e) => setCustomGradientColor(e.target.value)}
                              className="w-10 h-10 border-2 border-border-custom rounded-lg cursor-pointer focus:ring-2 focus:ring-brand/50 focus:outline-none"
                              title="Choose gradient color"
                            />
                            <div className="flex-1">
                              <span className="text-xs text-secondary-text font-mono bg-bg-secondary px-2 py-1 rounded">{customGradientColor.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Border Color */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-secondary-text">Border Color</label>
                          <div className="flex items-center space-x-3 bg-bg-primary rounded-lg p-3">
                            <input
                              type="color"
                              value={customBorderColor}
                              onChange={(e) => setCustomBorderColor(e.target.value)}
                              className="w-10 h-10 border-2 border-border-custom rounded-lg cursor-pointer focus:ring-2 focus:ring-brand/50 focus:outline-none"
                              title="Choose border color"
                            />
                            <div className="flex-1">
                              <span className="text-xs text-secondary-text font-mono bg-bg-secondary px-2 py-1 rounded">{customBorderColor.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gradient Opacity Slider */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-secondary-text">Gradient Opacity</label>
                          <span className="text-xs text-secondary-text bg-bg-primary px-2 py-1 rounded-md">{Math.round(gradientOpacity * 100)}%</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-secondary-text w-12 text-center">Subtle</span>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={gradientOpacity}
                            onChange={(e) => setGradientOpacity(parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-brand/50"
                            style={{
                              background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${gradientOpacity * 100}%, var(--color-bg-primary) ${gradientOpacity * 100}%, var(--color-bg-primary) 100%)`
                            }}
                          />
                          <span className="text-xs text-secondary-text w-12 text-center">Strong</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Theme Overlay Intensity - Only show if theme has overlays and gradients are enabled */}
                  {showVisualOverlays && currentTheme.renderOptions.visualOverlays && currentTheme.renderOptions.visualOverlays.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border-custom">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-text">Theme Overlay Intensity</label>
                        <span className="text-xs text-secondary-text bg-bg-primary px-2 py-1 rounded-md">{Math.round(overlayOpacity * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-secondary-text w-12 text-center">Subtle</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={overlayOpacity}
                          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-bg-primary rounded-lg appearance-none cursor-pointer slider focus:outline-none focus:ring-2 focus:ring-brand/50"
                          style={{
                            background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${overlayOpacity * 100}%, var(--color-bg-primary) ${overlayOpacity * 100}%, var(--color-bg-primary) 100%)`
                          }}
                        />
                        <span className="text-xs text-secondary-text w-12 text-center">Bold</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Content' && (
              <div className="space-y-6">
                {/* Model Information Section */}
                <div className="bg-bg-secondary/50 rounded-xl p-4 space-y-4">
                  
                  {/* Model/Collection Name - Always shown */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-secondary-text">
                      {model?.box === null ? 'Collection Name' : 'Model Name'}
                    </label>
                    <input
                      type="text"
                      value={tempModelName}
                      onChange={(e) => setTempModelName(e.target.value)}
                      onBlur={handleModelNameUpdate}
                      onKeyDown={(e) => handleKeyDown(e, handleModelNameUpdate)}
                      className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors placeholder:text-secondary-text"
                      placeholder="Enter model name"
                    />
                  </div>

                  {/* Artist Name */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-secondary-text">Artist Name</label>
                    <input
                      type="text"
                      value={tempUserName}
                      onChange={(e) => setTempUserName(e.target.value)}
                      onBlur={handleUserNameUpdate}
                      onKeyDown={(e) => handleKeyDown(e, handleUserNameUpdate)}
                      className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors placeholder:text-secondary-text"
                      placeholder="Enter your name or leave blank to hide"
                    />
                    <p className="text-xs text-secondary-text">Leave blank to hide artist credit from the screenshot</p>
                  </div>
                </div>

                {/* Optional Details Section */}
                <div className="bg-bg-secondary/50 rounded-xl p-4 space-y-4">

                  {/* Collection Name - Only show for models, not collections themselves */}
                  {model.box?.name && model.box !== null && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-text">Collection</label>
                        <button
                          onClick={() => setShowCollectionName(!showCollectionName)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg-secondary ${
                            showCollectionName ? 'bg-brand' : 'bg-border-custom'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              showCollectionName ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {showCollectionName && (
                        <input
                          type="text"
                          value={tempCollectionName}
                          onChange={(e) => setTempCollectionName(e.target.value)}
                          onBlur={handleCollectionNameUpdate}
                          onKeyDown={(e) => handleKeyDown(e, handleCollectionNameUpdate)}
                          className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors placeholder:text-secondary-text"
                          placeholder="Enter collection name"
                        />
                      )}
                    </div>
                  )}

                  {/* Game Name */}
                  {(model.box?.game?.name || model.game?.name) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-text">Game</label>
                        <button
                          onClick={() => setShowGameDetails(!showGameDetails)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg-secondary ${
                            showGameDetails ? 'bg-brand' : 'bg-border-custom'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              showGameDetails ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {showGameDetails && (
                        <input
                          type="text"
                          value={tempGameName}
                          onChange={(e) => setTempGameName(e.target.value)}
                          onBlur={handleGameNameUpdate}
                          onKeyDown={(e) => handleKeyDown(e, handleGameNameUpdate)}
                          className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors placeholder:text-secondary-text"
                          placeholder="Enter game name"
                        />
                      )}
                    </div>
                  )}

                  {/* Painted Date */}
                  {model.painted_date && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-secondary-text">Painted Date</label>
                        <button
                          onClick={() => setShowPaintedDate(!showPaintedDate)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-bg-secondary ${
                            showPaintedDate ? 'bg-brand' : 'bg-border-custom'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              showPaintedDate ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      {showPaintedDate && (
                        <input
                          type="text"
                          value={tempPaintedDate}
                          onChange={(e) => setTempPaintedDate(e.target.value)}
                          onBlur={handlePaintedDateUpdate}
                          onKeyDown={(e) => handleKeyDown(e, handlePaintedDateUpdate)}
                          className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-primary text-text text-sm transition-colors placeholder:text-secondary-text"
                          placeholder="Enter painted date (e.g., January 15, 2024)"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>


          {/* Save Changes Button - Only show if there are unsaved changes */}
          {hasUnsavedChanges && (
            <div className="flex justify-center">
              <button
                onClick={saveChanges}
                disabled={savingChanges}
                className="btn-secondary btn-with-icon"
              >
                <Save className="w-4 h-4" />
                <span>{savingChanges ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}

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
              disabled={generating || savingImage}
              className="btn-primary btn-with-icon flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4" />
              <span>{savingImage ? 'Downloading...' : 'Download Image'}</span>
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