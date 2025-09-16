import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Standard layout rendering - uses default behavior
const renderStandardLayout = async (context: ThemeRenderContext): Promise<void> => {
  const fonts = {
    titleFont: 'bold 48px "Colus", Arvo, serif',
    bodyFont: '32px "Colus", Overpass, sans-serif',
    smallFont: '28px "Colus", Overpass, sans-serif',
    tinyFont: '24px "Colus", Overpass, sans-serif'
  }
  
  const currentY = renderStandardTextLayout(context, fonts)
  
  // Render model name using Colus font
  renderStandardModelName(context, currentY, {
    titleFont: fonts.titleFont
  })
}

// Font loading for Colus
const loadFonts = async (): Promise<void> => {
  await Promise.all([
    document.fonts.load('bold 48px "Colus"'),
    document.fonts.load('32px "Colus"'),
    document.fonts.load('28px "Colus"'),
    document.fonts.load('24px "Colus"')
  ])
}

export const miniMyths: Theme = {
  id: 'mini-myths',
  name: 'Mini Myths',
  
  colors: {
    gradientColor: '255, 184, 0',
    borderColor: 'rgba(255, 184, 0, 1)'
  },
  
  fonts: {
    titleFont: 'bold 48px "Colus", Arvo, serif',
    bodyFont: '32px "Colus", Overpass, sans-serif',
    smallFont: '28px "Colus", Overpass, sans-serif',
    tinyFont: '24px "Colus", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout,
    loadFonts
  },
  
  isDefault: true,
  isVisible: true,

  metadata: {
    description: 'Mini Myths theme with golden Colus typography',
    tags: ['fantasy', 'golden', 'custom-font']
  }
}