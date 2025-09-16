import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 56px "WoodenBridge", Arvo, serif',
    bodyFont: '32px Arvo, serif',
    smallFont: '28px Arvo, serif',
    tinyFont: '24px Arvo, serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using WoodenBridge font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for WoodenBridge
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('bold 56px "WoodenBridge"')
}

export const redFog: Theme = {
  id: 'red-fog',
  name: 'Red Fog',
  
  colors: {
    gradientColor: '150, 0, 0',
    borderColor: 'rgba(150, 0, 0, 1)'
  },
  
  fonts: {
    titleFont: 'bold 56px "WoodenBridge", Arvo, serif',
    bodyFont: '32px Arvo, serif',
    smallFont: '28px Arvo, serif',
    tinyFont: '24px Arvo, serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  isVisible: false,

  metadata: {
    description: 'Red Fog theme with atmospheric WoodenBridge title font',
    tags: ['atmospheric', 'dark', 'custom-font']
  }
}