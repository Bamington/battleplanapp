import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'
import { createPatternOverlay, createSymbolOverlay, createCornerDecorationOverlay } from './overlayUtils'

// Custom model name rendering with uppercase for Imperium theme
const renderImperiumModelName = (context: ThemeRenderContext, currentY: number): void => {
  const { ctx, model, shadowOpacity, textPosition, isDarkText } = context
  
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const padding = 40
  const textX = textPosition === 'bottom-right' ? context.canvas.width - padding : padding
  const textAlign = textPosition === 'bottom-right' ? 'right' : 'left'

  // Model name in uppercase for imperial authority
  const modelNameText = model.name.toUpperCase()
  ctx.font = 'bold 58px "Conduit ITC", Arvo, serif'
  ctx.textAlign = textAlign as CanvasTextAlign
  
  // Draw model name with drop shadow
  ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillStyle = primaryColor
  ctx.fillText(modelNameText, textX, currentY)
  
  // Reset shadow
  ctx.shadowColor = 'transparent'
}

// Standard layout rendering with custom uppercase model name
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 58px "Conduit ITC", Arvo, serif',
    bodyFont: 'bold 32px "Conduit ITC", Overpass, sans-serif',
    smallFont: '28px "Conduit ITC", Overpass, sans-serif',
    tinyFont: '24px "Conduit ITC", Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Use custom model name rendering with uppercase
  renderImperiumModelName(context, currentY)
}

// Font loading for Conduit ITC
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('58px "Conduit ITC"')
}

export const imperium: Theme = {
  id: 'imperium',
  name: 'Imperium',
  
  colors: {
    gradientColor: '16, 58, 75',
    borderColor: 'rgba(16, 58, 75, 1)'
  },
  
  fonts: {
    titleFont: 'bold 58px "Conduit ITC", Arvo, serif',
    bodyFont: 'bold 32px "Conduit ITC", Overpass, sans-serif',
    smallFont: '28px "Conduit ITC", Overpass, sans-serif',
    tinyFont: '24px "Conduit ITC", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts,
    visualOverlays: [
      // Gothic pattern overlay reminiscent of Imperial architecture
      createPatternOverlay(
        'imperium-gothic-lines',
        'lines',
        40,
        'rgba(180, 160, 100, 0.4)',
        0.06,
        true
      ),
      // Imperial Aquila-inspired symbol
      createSymbolOverlay(
        'imperium-aquila',
        'imperial-eagle',
        { x: 'center', y: 'top' },
        { width: 120, height: 80 },
        'rgba(180, 160, 100, 0.8)',
        0.2,
        true,
        // Custom Imperial Eagle renderer
        (context, overlay) => {
          const { ctx, canvas, overlayOpacity = 1 } = context
          const pos = { x: canvas.width / 2, y: 60 }
          
          const finalOpacity = overlay.opacity * overlayOpacity
          ctx.globalAlpha = finalOpacity
          ctx.strokeStyle = 'rgba(180, 160, 100, 0.9)'
          ctx.fillStyle = 'rgba(180, 160, 100, 0.3)'
          ctx.lineWidth = 2
          
          ctx.save()
          ctx.translate(pos.x, pos.y)
          
          // Draw simplified Imperial Eagle/Aquila
          ctx.beginPath()
          // Eagle body
          ctx.ellipse(0, 0, 15, 25, 0, 0, 2 * Math.PI)
          ctx.fill()
          
          // Wings
          ctx.beginPath()
          ctx.moveTo(-15, -10)
          ctx.bezierCurveTo(-40, -20, -50, 0, -35, 15)
          ctx.bezierCurveTo(-25, 10, -15, 5, -15, -10)
          ctx.fill()
          
          ctx.beginPath()
          ctx.moveTo(15, -10)
          ctx.bezierCurveTo(40, -20, 50, 0, 35, 15)
          ctx.bezierCurveTo(25, 10, 15, 5, 15, -10)
          ctx.fill()
          
          // Head
          ctx.beginPath()
          ctx.arc(0, -25, 8, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.restore()
          ctx.globalAlpha = 1
        }
      ),
      // Corner purity seals
      createCornerDecorationOverlay(
        'imperium-purity-seal',
        'top-right',
        'organic',
        40,
        'rgba(180, 160, 100, 0.7)',
        0.4,
        true
      )
    ]
  },
  
  isDefault: true,
  
  metadata: {
    description: 'Imperial theme with bold Conduit ITC typography and uppercase model names',
    tags: ['imperial', 'bold', 'custom-font', 'uppercase']
  }
}