import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "Minion Pro", Arvo, serif',
    bodyFont: '32px "Minion Pro", Overpass, sans-serif',
    smallFont: '28px "Minion Pro", Overpass, sans-serif',
    tinyFont: '24px "Minion Pro", Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using Minion Pro font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for Minion Pro
const loadFonts = async (): Promise<void> => {
  await Promise.all([
    document.fonts.load('bold 48px "Minion Pro"'),
    document.fonts.load('32px "Minion Pro"'),
    document.fonts.load('28px "Minion Pro"'),
    document.fonts.load('24px "Minion Pro"')
  ])
}

export const eternal: Theme = {
  id: 'eternal',
  name: 'Eternal',
  
  colors: {
    gradientColor: '114, 77, 221',
    borderColor: 'rgba(114, 77, 221, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "Minion Pro", Arvo, serif',
    bodyFont: '32px "Minion Pro", Overpass, sans-serif',
    smallFont: '28px "Minion Pro", Overpass, sans-serif',
    tinyFont: '24px "Minion Pro", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  isVisible: false,

  metadata: {
    description: 'Eternal theme with elegant Minion Pro typography',
    tags: ['eternal', 'elegant', 'custom-font']
  }
}