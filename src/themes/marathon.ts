import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout } from './utils'

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
    loadFonts
  },
  
  isDefault: true,
  
  metadata: {
    description: 'Sci-fi theme inspired by the Marathon game series',
    tags: ['sci-fi', 'gaming', 'futuristic']
  }
}