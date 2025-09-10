import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

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
    loadFonts
  },
  
  isDefault: true,
  
  metadata: {
    description: 'Imperial theme with bold Conduit ITC typography and uppercase model names',
    tags: ['imperial', 'bold', 'custom-font', 'uppercase']
  }
}