import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering but with Beaufort font for all text
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "Beaufort", Arvo, serif',
    bodyFont: '32px "Beaufort", Overpass, sans-serif',
    smallFont: '28px "Beaufort", Overpass, sans-serif',
    tinyFont: '24px "Beaufort", Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name with Beaufort font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for Ringbearer theme
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('48px Beaufort')
}

export const ringbearer: Theme = {
  id: 'ringbearer',
  name: 'Ringbearer',
  
  colors: {
    gradientColor: '255, 215, 0', // Gold
    borderColor: 'rgba(255, 215, 0, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "Beaufort", Arvo, serif',
    bodyFont: '32px "Beaufort", Overpass, sans-serif',
    smallFont: '28px "Beaufort", Overpass, sans-serif',
    tinyFont: '24px "Beaufort", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  
  metadata: {
    description: 'Fantasy theme with elegant Beaufort font for all text',
    tags: ['fantasy', 'elegant', 'custom-font']
  }
}