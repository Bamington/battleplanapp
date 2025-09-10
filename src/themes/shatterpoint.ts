import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Custom model name rendering with uppercase for Shatterpoint theme
const renderShatterpointModelName = (context: ThemeRenderContext, currentY: number): void => {
  const { ctx, model, shadowOpacity, textPosition, isDarkText } = context
  
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const padding = 40
  const textX = textPosition === 'bottom-right' ? context.canvas.width - padding : padding
  const textAlign = textPosition === 'bottom-right' ? 'right' : 'left'

  // Model name in uppercase for dramatic effect
  const modelNameText = model.name.toUpperCase()
  ctx.font = 'bold 48px "TeutonFett", Arvo, serif'
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
    titleFont: 'bold 48px "TeutonFett", Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Use custom model name rendering with uppercase
  renderShatterpointModelName(context, currentY)
}

// Font loading for TeutonFett and Overpass
const loadFonts = async (): Promise<void> => {
  await Promise.all([
    document.fonts.load('48px "TeutonFett"'),
    document.fonts.load('32px Overpass'),
    document.fonts.load('28px Overpass'),
    document.fonts.load('24px Overpass')
  ])
}

export const shatterpoint: Theme = {
  id: 'shatterpoint',
  name: 'Shatterpoint',
  
  colors: {
    gradientColor: '252, 215, 3',
    borderColor: 'rgba(252, 215, 3, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "TeutonFett", Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  
  metadata: {
    description: 'Shatterpoint theme with dramatic TeutonFett typography and small caps model names',
    tags: ['dramatic', 'bold', 'custom-font', 'small-caps']
  }
}