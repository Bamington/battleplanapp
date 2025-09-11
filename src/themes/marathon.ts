import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout } from './utils'
import { createPatternOverlay, createSymbolOverlay, createShapeOverlay } from './overlayUtils'

// Custom model name rendering for Marathon theme
const renderMarathonModelName = (context: ThemeRenderContext): void => {
  const { ctx, canvas, model, shadowOpacity } = context
  
  const modelNameText = model.name
  const padding = 40
  
  // Marathon theme: model name in top-right with background
  ctx.font = 'bold 48px "AUTOMATA", Arvo, serif'
  ctx.textAlign = 'right'
  
  // Measure text to create background
  const textMetrics = ctx.measureText(modelNameText)
  const textWidth = textMetrics.width
  const textHeight = 60 // Approximate height for 48px font
  
  // Position in top-right corner
  const marathonTextX = canvas.width - padding
  const marathonTextY = padding + textHeight
  
  // Draw background rectangle
  const bgPadding = 16
  ctx.fillStyle = '#2E4650'
  ctx.fillRect(
    marathonTextX - textWidth - bgPadding,
    marathonTextY - textHeight + 10,
    textWidth + (bgPadding * 2),
    textHeight
  )
  
  // Draw model name text (white on the background)
  ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillStyle = '#ffffff'
  ctx.fillText(modelNameText, marathonTextX - bgPadding, marathonTextY)
  
  // Reset shadow
  ctx.shadowColor = 'transparent'
}

// Standard layout rendering for other elements
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "AUTOMATA", Arvo, serif',
    bodyFont: '32px "AUTOMATA", Overpass, sans-serif',
    smallFont: '28px "AUTOMATA", Overpass, sans-serif',
    tinyFont: '24px "AUTOMATA", Overpass, sans-serif'
  }
  
  renderStandardTextLayout(context, fonts)
}

// Font loading for Marathon theme
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('48px AUTOMATA')
}

export const marathon: Theme = {
  id: 'marathon',
  name: 'Marathon',
  
  colors: {
    gradientColor: '46, 70, 80', // Updated Marathon color #2E4650
    borderColor: 'rgba(46, 70, 80, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "AUTOMATA", Arvo, serif',
    bodyFont: '32px "AUTOMATA", Overpass, sans-serif',
    smallFont: '28px "AUTOMATA", Overpass, sans-serif',
    tinyFont: '24px "AUTOMATA", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    renderModelName: renderMarathonModelName,
    customTextPosition: true, // Marathon always uses top-right for model name
    loadFonts,
    visualOverlays: [
      // Hexagonal grid pattern reminiscent of Halo tech
      createPatternOverlay(
        'marathon-hex-grid',
        'grid',
        120,
        'rgba(46, 70, 80, 0.4)',
        0.08,
        true
      ),
      // UNSC-style angular decorations in corners
      createSymbolOverlay(
        'marathon-unsc-symbol',
        'unsc-emblem',
        { x: 'right', y: 'bottom' },
        { width: 100, height: 100 },
        'rgba(46, 70, 80, 0.6)',
        0.25,
        true,
        // Custom UNSC-style emblem renderer
        (context, overlay) => {
          const { ctx, canvas, overlayOpacity = 1 } = context
          const pos = { x: canvas.width - 140, y: canvas.height - 140 }
          
          const finalOpacity = overlay.opacity * overlayOpacity
          ctx.globalAlpha = finalOpacity
          ctx.strokeStyle = 'rgba(46, 70, 80, 0.8)'
          ctx.fillStyle = 'rgba(46, 70, 80, 0.3)'
          ctx.lineWidth = 2
          
          ctx.save()
          ctx.translate(pos.x + 50, pos.y + 50)
          
          // Draw angular, sci-fi emblem
          ctx.beginPath()
          // Outer ring
          ctx.arc(0, 0, 40, 0, 2 * Math.PI)
          ctx.stroke()
          
          // Inner angular design
          ctx.beginPath()
          ctx.moveTo(-25, -15)
          ctx.lineTo(0, -30)
          ctx.lineTo(25, -15)
          ctx.lineTo(25, 15)
          ctx.lineTo(0, 30)
          ctx.lineTo(-25, 15)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          
          // Central details
          ctx.beginPath()
          ctx.moveTo(-15, 0)
          ctx.lineTo(15, 0)
          ctx.moveTo(0, -15)
          ctx.lineTo(0, 15)
          ctx.stroke()
          
          ctx.restore()
          ctx.globalAlpha = 1
        }
      ),
      // Energy shield effect as subtle background element
      createShapeOverlay(
        'marathon-energy-field',
        'hexagon',
        { x: 'center', y: 'center' },
        { width: '60%', height: '60%' },
        'rgba(100, 150, 200, 0.3)',
        0.05,
        true
      )
    ]
  },
  
  isDefault: true,
  
  metadata: {
    description: 'Sci-fi theme inspired by the Marathon game series',
    tags: ['sci-fi', 'gaming', 'futuristic']
  }
}