import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "Agency FB", Arvo, serif',
    bodyFont: 'bold 32px "Agency FB", Overpass, sans-serif',
    smallFont: 'bold 28px "Agency FB", Overpass, sans-serif',
    tinyFont: 'bold 24px "Agency FB", Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using Agency FB font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for Agency FB
const loadFonts = async (): Promise<void> => {
  await Promise.all([
    document.fonts.load('bold 48px "Agency FB"'),
    document.fonts.load('bold 32px "Agency FB"'),
    document.fonts.load('bold 28px "Agency FB"'),
    document.fonts.load('bold 24px "Agency FB"')
  ])
}

export const heroic: Theme = {
  id: 'heroic',
  name: 'Heroic',
  
  colors: {
    gradientColor: '114, 77, 221',
    borderColor: 'rgba(114, 77, 221, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "Agency FB", Arvo, serif',
    bodyFont: 'bold 32px "Agency FB", Overpass, sans-serif',
    smallFont: 'bold 28px "Agency FB", Overpass, sans-serif',
    tinyFont: 'bold 24px "Agency FB", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  isVisible: false,

  metadata: {
    description: 'Heroic theme with dynamic Agency FB typography',
    tags: ['heroic', 'dynamic', 'custom-font']
  }
}