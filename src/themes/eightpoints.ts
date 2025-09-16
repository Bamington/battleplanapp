import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "Rodchenko", Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using Rodchenko font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for Rodchenko
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('bold 48px "Rodchenko"')
}

export const eightpoints: Theme = {
  id: 'eightpoints',
  name: 'Eightpoints',
  
  colors: {
    gradientColor: '220, 20, 60',
    borderColor: 'rgba(220, 20, 60, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "Rodchenko", Arvo, serif',
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
    description: 'Eightpoints theme with constructivist Rodchenko typography',
    tags: ['constructivist', 'bold', 'custom-font']
  }
}