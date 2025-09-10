import React, { useState, useRef, useEffect } from 'react'
import { Save, X, Search, Eye } from 'lucide-react'
import { useModels } from '../hooks/useModels'
import { useAuth } from '../hooks/useAuth'
import { type Theme } from '../themes'

interface ThemeEditPageProps {
  theme: Theme
  isCreate: boolean
  onSave: (theme: Theme) => void
  onCancel: () => void
}

interface Model {
  id: string
  name: string
  image_url?: string
  painted_date?: string | null
  box?: {
    name: string
    game?: {
      name: string
      icon?: string
    }
  } | null
  game?: {
    name: string
    icon?: string
  } | null
}

export function ThemeEditPage({ theme, isCreate, onSave, onCancel }: ThemeEditPageProps) {
  const [editedTheme, setEditedTheme] = useState<Theme>(theme)
  const [previewModel, setPreviewModel] = useState<Model | null>(null)
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { models } = useModels()
  const { user } = useAuth()

  // Filter models for dropdown
  const filteredModels = models.filter(model => 
    model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) &&
    model.image_url
  ).slice(0, 10) // Limit to 10 results

  // Set default preview model
  useEffect(() => {
    if (!previewModel && models.length > 0) {
      const modelWithImage = models.find(m => m.image_url)
      if (modelWithImage) {
        setPreviewModel(modelWithImage)
      }
    }
  }, [models, previewModel])

  // Generate preview when theme or model changes
  useEffect(() => {
    if (previewModel) {
      generatePreview()
    }
  }, [editedTheme, previewModel])

  const generatePreview = async () => {
    if (!previewModel || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // Load fonts if needed
      const titleFontMatch = editedTheme.fonts.titleFont.match(/"([^"]+)"/);
      if (titleFontMatch) {
        await document.fonts.load(`48px ${titleFontMatch[1]}`)
      }

      // Load the model image
      if (previewModel.image_url) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Set canvas dimensions
            const aspectRatio = img.width / img.height
            const maxSize = 400
            
            if (aspectRatio > 1) {
              canvas.width = maxSize
              canvas.height = maxSize / aspectRatio
            } else {
              canvas.width = maxSize * aspectRatio
              canvas.height = maxSize
            }
            
            // Create rounded clipping path
            const cornerRadius = 10
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(0, 0, canvas.width, canvas.height, cornerRadius)
            ctx.clip()
            
            // Draw the image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            ctx.restore()
            
            // Add gradient overlay
            const gradientHeight = canvas.height * 0.2
            const gradient = ctx.createLinearGradient(0, 0, 0, gradientHeight)
            const rgb = editedTheme.colors.gradientColor.split(',').map(c => parseInt(c.trim()))
            gradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`)
            gradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)
            
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, gradientHeight)
            
            // Add border
            ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(1, 1, canvas.width - 2, canvas.height - 2, cornerRadius - 1)
            ctx.stroke()
            
            // Add text
            const padding = 20
            let currentY = canvas.height - padding
            
            // Model name (title)
            ctx.font = editedTheme.fonts.titleFont.replace('48px', '24px') // Scale down for preview
            ctx.textAlign = 'right'
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
            ctx.shadowBlur = 4
            ctx.shadowOffsetX = 1
            ctx.shadowOffsetY = 1
            ctx.fillText(previewModel.name, canvas.width - padding, currentY)
            ctx.shadowColor = 'transparent'
            currentY -= 25
            
            // Collection name
            if (previewModel.box?.name) {
              ctx.font = editedTheme.fonts.bodyFont.replace('32px', '16px')
              ctx.fillText(previewModel.box.name, canvas.width - padding, currentY)
              currentY -= 20
            }
            
            // Game name
            const gameName = previewModel.box?.game?.name || previewModel.game?.name
            if (gameName) {
              ctx.font = editedTheme.fonts.smallFont.replace('28px', '14px')
              ctx.fillText(gameName, canvas.width - padding, currentY)
            }
            
            resolve()
          }
          img.onerror = reject
          img.src = previewModel.image_url!
        })
      }
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  const handleSave = () => {
    if (!editedTheme.name.trim()) {
      alert('Please enter a theme name')
      return
    }

    // Generate ID if creating new theme
    if (isCreate && !editedTheme.id) {
      editedTheme.id = editedTheme.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    }

    onSave(editedTheme)
  }

  const updateThemeField = (field: string, value: string) => {
    setEditedTheme(prev => {
      if (field.startsWith('fonts.')) {
        const fontField = field.replace('fonts.', '') as keyof typeof prev.fonts
        return {
          ...prev,
          fonts: {
            ...prev.fonts,
            [fontField]: value
          }
        }
      } else if (field.startsWith('colors.')) {
        const colorField = field.replace('colors.', '') as keyof typeof prev.colors
        return {
          ...prev,
          colors: {
            ...prev.colors,
            [colorField]: value
          }
        }
      } else {
        return {
          ...prev,
          [field]: value
        }
      }
    })
  }

  const parseColorToRgb = (colorStr: string): string => {
    // If it's already in RGB format, return as is
    if (colorStr.includes(',')) {
      return colorStr
    }
    
    // Try to parse hex color
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1)
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return `${r}, ${g}, ${b}`
    }
    
    return colorStr
  }

  const rgbToHex = (rgb: string): string => {
    const values = rgb.split(',').map(v => parseInt(v.trim()))
    if (values.length === 3) {
      return '#' + values.map(v => v.toString(16).padStart(2, '0')).join('')
    }
    return '#724ddd' // fallback
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Form */}
      <div className="space-y-6">
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          <h3 className="text-lg font-semibold text-title mb-4">Theme Settings</h3>
          
          <div className="space-y-4">
            {/* Theme Name */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Theme Name
              </label>
              <input
                type="text"
                value={editedTheme.name}
                onChange={(e) => updateThemeField('name', e.target.value)}
                placeholder="Enter theme name"
                className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={editedTheme.isDefault}
              />
            </div>

            {/* Title Font */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Title Font (Model Name)
              </label>
              <input
                type="text"
                value={editedTheme.fonts.titleFont}
                onChange={(e) => updateThemeField('fonts.titleFont', e.target.value)}
                placeholder="e.g., bold 48px Arial, sans-serif"
                className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={editedTheme.isDefault}
              />
            </div>

            {/* Body Font */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Body Font (Collection Name)
              </label>
              <input
                type="text"
                value={editedTheme.fonts.bodyFont}
                onChange={(e) => updateThemeField('fonts.bodyFont', e.target.value)}
                placeholder="e.g., 32px Arial, sans-serif"
                className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={editedTheme.isDefault}
              />
            </div>

            {/* Small Font */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Small Font (Game Name)
              </label>
              <input
                type="text"
                value={editedTheme.fonts.smallFont}
                onChange={(e) => updateThemeField('fonts.smallFont', e.target.value)}
                placeholder="e.g., 28px Arial, sans-serif"
                className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={editedTheme.isDefault}
              />
            </div>

            {/* Tiny Font */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Tiny Font (User Name)
              </label>
              <input
                type="text"
                value={editedTheme.fonts.tinyFont}
                onChange={(e) => updateThemeField('fonts.tinyFont', e.target.value)}
                placeholder="e.g., 24px Arial, sans-serif"
                className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                disabled={editedTheme.isDefault}
              />
            </div>

            {/* Theme Color */}
            <div>
              <label className="block text-sm font-medium text-input-label mb-2">
                Theme Color
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  value={rgbToHex(editedTheme.colors.gradientColor)}
                  onChange={(e) => {
                    const rgb = parseColorToRgb(e.target.value)
                    updateThemeField('colors.gradientColor', rgb)
                    updateThemeField('colors.borderColor', `rgba(${rgb}, 1)`)
                  }}
                  className="w-12 h-10 border border-border-custom rounded-lg"
                  disabled={editedTheme.isDefault}
                />
                <input
                  type="text"
                  value={editedTheme.colors.gradientColor}
                  onChange={(e) => {
                    const rgb = parseColorToRgb(e.target.value)
                    updateThemeField('colors.gradientColor', rgb)
                    updateThemeField('colors.borderColor', `rgba(${rgb}, 1)`)
                  }}
                  placeholder="e.g., 114, 77, 221"
                  className="flex-1 px-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  disabled={editedTheme.isDefault}
                />
              </div>
              <p className="text-xs text-secondary-text mt-1">
                Enter RGB values (e.g., "114, 77, 221") or use the color picker
              </p>
            </div>
          </div>
        </div>

        {/* Model Selection for Preview */}
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          <h3 className="text-lg font-semibold text-title mb-4">Preview Model</h3>
          
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
              <input
                type="text"
                value={previewModel?.name || modelSearchQuery}
                onChange={(e) => {
                  setModelSearchQuery(e.target.value)
                  setShowModelDropdown(true)
                }}
                onFocus={() => setShowModelDropdown(true)}
                placeholder="Search for a model..."
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand text-sm bg-bg-primary text-text"
              />
            </div>

            {showModelDropdown && filteredModels.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border-custom rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setPreviewModel(model)
                      setModelSearchQuery('')
                      setShowModelDropdown(false)
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-bg-secondary flex items-center space-x-3 transition-colors"
                  >
                    {model.image_url && (
                      <img
                        src={model.image_url}
                        alt={model.name}
                        className="w-8 h-8 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                    <div>
                      <div className="font-medium text-text">{model.name}</div>
                      {model.box?.name && (
                        <div className="text-xs text-secondary-text">{model.box.name}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="btn-ghost btn-with-icon flex-1"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            disabled={editedTheme.isDefault}
            className="btn-primary btn-with-icon flex-1"
          >
            <Save className="w-4 h-4" />
            <span>{isCreate ? 'Create Theme' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Right Column - Preview */}
      <div className="space-y-6">
        <div className="bg-bg-card border border-border-custom rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Eye className="w-5 h-5 text-brand" />
            <h3 className="text-lg font-semibold text-title">Live Preview</h3>
          </div>
          
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-border-custom rounded-lg shadow-sm"
            />
          </div>
          
          {!previewModel && (
            <div className="text-center text-secondary-text py-8">
              Select a model to see the preview
            </div>
          )}
        </div>

        {editedTheme.isDefault && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Read-only theme:</strong> This is a default theme and cannot be edited. 
              Use the "Duplicate" button to create a custom version.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}