import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "SerifGothic", Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using SerifGothic font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for SerifGothic
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('bold 48px "SerifGothic"')
}

export const dragonslayer: Theme = {
  id: 'dragonslayer',
  name: 'Dragonslayer',
  
  colors: {
    gradientColor: '139, 69, 19',
    borderColor: 'rgba(139, 69, 19, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "SerifGothic", Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  isVisible: false,

  metadata: {
    description: 'Dragonslayer theme with bold SerifGothic title font',
    tags: ['fantasy', 'adventure', 'custom-font']
  }
}