import React, { useEffect, useRef } from 'react'
import { Edit, Palette, Lock } from 'lucide-react'
import { type Theme } from '../themes'
import { useModels } from '../hooks/useModels'

interface ThemeListProps {
  themes: Theme[]
  onEditTheme: (theme: Theme) => void
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

function ThemePreview({ theme, model }: { theme: Theme; model: Model }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    generatePreview()
  }, [theme, model])

  const generatePreview = async () => {
    if (!model?.image_url || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // Load fonts if needed
      const titleFontMatch = theme.fonts.titleFont.match(/\"([^\"]+)\"/);
      if (titleFontMatch) {
        await document.fonts.load(`24px ${titleFontMatch[1]}`)
      }

      // Load the model image
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Fixed canvas size for consistent preview dimensions
          const canvasWidth = 320  // 20rem in pixels (w-80)
          const canvasHeight = 180  // 11.25rem in pixels (h-45)
          
          canvas.width = canvasWidth
          canvas.height = canvasHeight
          
          // Calculate how to fill the canvas while maintaining aspect ratio (crop if needed)
          const imgAspect = img.width / img.height
          const canvasAspect = canvasWidth / canvasHeight
          
          let drawWidth, drawHeight, drawX, drawY
          
          if (imgAspect > canvasAspect) {
            // Image is wider than canvas - fill to height, crop width
            drawHeight = canvasHeight
            drawWidth = canvasHeight * imgAspect
            drawX = (canvasWidth - drawWidth) / 2
            drawY = 0
          } else {
            // Image is taller than canvas - fill to width, crop height
            drawWidth = canvasWidth
            drawHeight = canvasWidth / imgAspect
            drawX = 0
            drawY = (canvasHeight - drawHeight) / 2
          }
          
          // Create rounded clipping path  
          const cornerRadius = 12
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(0, 0, canvasWidth, canvasHeight, cornerRadius)
          ctx.clip()
          
          // Draw the image centered and properly scaled
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
          ctx.restore()
          
          // Add radial gradient overlay (matches actual screenshot)
          const rgb = theme.colors.gradientColor.split(',').map(c => parseInt(c.trim()))
          const cornerCenterX = canvasWidth * 0.85
          const cornerCenterY = canvasHeight * 0.15
          const gradientRadius = Math.min(canvasWidth, canvasHeight) * 0.4
          
          const radialGradient = ctx.createRadialGradient(
            cornerCenterX, cornerCenterY, 0,
            cornerCenterX, cornerCenterY, gradientRadius
          )
          radialGradient.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.4)`)
          radialGradient.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`)
          
          ctx.fillStyle = radialGradient
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
          
          // Add rounded border (matches actual screenshot)
          const borderWidth = 2
          const borderOffset = borderWidth / 2
          ctx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1)`
          ctx.lineWidth = borderWidth
          ctx.beginPath()
          ctx.roundRect(borderOffset, borderOffset, canvasWidth - borderWidth, canvasHeight - borderWidth, cornerRadius - borderOffset)
          ctx.stroke()
          
          // Text positioning (bottom-right, matches actual screenshot)
          const padding = 16
          const textX = canvasWidth - padding
          let currentY = canvasHeight - padding
          
          // User name (bottom - smallest text)
          ctx.font = theme.fonts.tinyFont.replace(/\d+px/, '10px')
          ctx.textAlign = 'right'
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
          ctx.shadowBlur = 4
          ctx.shadowOffsetX = 1
          ctx.shadowOffsetY = 1
          ctx.fillText('by User', textX, currentY)
          currentY -= 14
          
          // Collection name (if exists)
          if (model.box?.name) {
            ctx.font = theme.fonts.bodyFont.replace(/\d+px/, '16px')
            ctx.fillText(model.box.name, textX, currentY)
            currentY -= 20
          }
          
          // Game name (if exists)
          const gameName = model.box?.game?.name || model.game?.name
          if (gameName) {
            ctx.font = theme.fonts.tinyFont.replace(/\d+px/, '10px')
            ctx.fillText(gameName, textX, currentY)
            currentY -= 14
          }
          
          // Model name (top - largest text, title font)
          ctx.font = theme.fonts.titleFont.replace(/\d+px/, '20px')
          ctx.fillText(model.name, textX, currentY)
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          
          resolve()
        }
        img.onerror = reject
        img.src = model.image_url!
      })
    } catch (error) {
      console.error('Error generating preview:', error)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-80 h-45 rounded-lg shadow-sm"
    />
  )
}

export function ThemeList({ themes, onEditTheme }: ThemeListProps) {
  const { models } = useModels()
  
  // Find a model with an image for preview
  const previewModel = models.find(model => model.image_url)
  const getPreviewColor = (gradientColor: string) => {
    const rgb = gradientColor.split(',').map(c => parseInt(c.trim()))
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
  }

  const getFontPreview = (theme: any) => {
    // Check if theme has fonts property
    if (!theme.fonts) {
      return 'serif' // fallback if no fonts defined
    }

    // Handle new font system with legacy fonts
    if (theme.fonts.legacyFonts?.titleFont) {
      const titleFont = theme.fonts.legacyFonts.titleFont
      const fontMatch = titleFont.match(/"([^"]+)"|'([^']+)'|(\w+)/g)
      if (fontMatch && fontMatch.length > 0) {
        let fontFamily = fontMatch[0].replace(/['"]/g, '')
        if (fontFamily === 'bold') {
          fontFamily = fontMatch[1]?.replace(/['"]/g, '') || 'serif'
        }
        return fontFamily
      }
    }

    // Handle old font system (direct titleFont)
    if (theme.fonts.titleFont) {
      const titleFont = theme.fonts.titleFont
      const fontMatch = titleFont.match(/"([^"]+)"|'([^']+)'|(\w+)/g)
      if (fontMatch && fontMatch.length > 0) {
        let fontFamily = fontMatch[0].replace(/['"]/g, '')
        if (fontFamily === 'bold') {
          fontFamily = fontMatch[1]?.replace(/['"]/g, '') || 'serif'
        }
        return fontFamily
      }
    }

    // Fallback for new font system without legacy fonts
    if (theme.fonts.overrides?.title?.family) {
      const familyMap = {
        'sans': 'Arial, sans-serif',
        'serif': 'Georgia, serif',
        'mono': 'Monaco, monospace'
      }
      return familyMap[theme.fonts.overrides.title.family as keyof typeof familyMap] || 'serif'
    }

    return 'serif'
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-secondary-text">
        Manage screenshot themes. Default themes are read-only but can be duplicated to create custom versions.
      </div>

      <div className="space-y-4">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="bg-bg-card border border-border-custom rounded-lg p-6 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-6">
              {/* Theme Preview */}
              <div className="flex-shrink-0">
                {previewModel ? (
                  <ThemePreview theme={theme} model={previewModel} />
                ) : (
                  <div 
                    className="w-80 h-45 rounded-lg flex items-center justify-center relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${getPreviewColor(theme.colors.gradientColor)}20, ${getPreviewColor(theme.colors.gradientColor)}40)`,
                      border: `2px solid ${getPreviewColor(theme.colors.gradientColor)}60`
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="text-lg font-bold text-title mb-1"
                        style={{ fontFamily: getFontPreview(theme) }}
                      >
                        {theme.name}
                      </div>
                      <div className="text-xs text-secondary-text">
                        {getFontPreview(theme)}
                      </div>
                    </div>
                    
                    {/* Color indicator */}
                    <div 
                      className="absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: getPreviewColor(theme.colors.gradientColor) }}
                    />
                  </div>
                )}
              </div>

              {/* Theme Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-title flex items-center space-x-2">
                    <span>{theme.name}</span>
                    {theme.isDefault && (
                      <Lock className="w-4 h-4 text-secondary-text" title="Default theme (read-only)" />
                    )}
                  </h3>
                </div>

                <div className="text-sm text-secondary-text space-y-1">
                  <div>
                    <span className="font-medium">Title Font:</span> {getFontPreview(theme.fonts.titleFont)}
                  </div>
                  <div>
                    <span className="font-medium">Color:</span> rgb({theme.colors.gradientColor})
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex space-x-2">
                <button
                  onClick={() => onEditTheme(theme)}
                  className="btn-secondary btn-with-icon"
                >
                  <Edit className="w-4 h-4" />
                  <span>{theme.isDefault ? 'View' : 'Edit'}</span>
                </button>
                
                {theme.isDefault && (
                  <button
                    onClick={() => {
                      const duplicatedTheme: Theme = {
                        ...theme,
                        id: '',
                        name: `${theme.name} Copy`,
                        isDefault: false
                      }
                      onEditTheme(duplicatedTheme)
                    }}
                    className="btn-primary btn-with-icon"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Duplicate</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}