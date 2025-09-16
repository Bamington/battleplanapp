import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'
import { createPatternOverlay, createCornerDecorationOverlay } from './overlayUtils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using standard positioning
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// No special font loading needed for Battleplan (uses system fonts)
const loadFonts = async (): Promise<void> => {
  // Battleplan uses standard web fonts, no loading required
}

export const battleplan: Theme = {
  id: 'battleplan',
  name: 'Battleplan',
  
  colors: {
    gradientColor: '114, 77, 221', // Brand purple
    borderColor: 'rgba(114, 77, 221, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px Arvo, serif',
    bodyFont: '32px Overpass, sans-serif',
    smallFont: '28px Overpass, sans-serif',
    tinyFont: '24px Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts,
    visualOverlays: [
      createPatternOverlay(
        'battleplan-subtle-dots',
        'dots',
        80,
        'rgba(114, 77, 221, 0.8)',
        0.1,
        true
      ),
      createCornerDecorationOverlay(
        'battleplan-corner-flourish',
        'bottom-left',
        'geometric',
        60,
        'rgba(114, 77, 221, 0.6)',
        0.3,
        true
      )
    ]
  },
  
  isDefault: true,
  isVisible: true,

  metadata: {
    description: 'The classic Battleplan theme with brand colors',
    tags: ['default', 'classic']
  }
}