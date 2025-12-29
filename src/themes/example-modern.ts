import { Theme } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'

// Example theme showcasing the new font system
const renderModernLayout = async (context: any): Promise<void> => {
  // This theme will use the modern font system
  const themeFonts = {
    overrides: {
      title: {
        family: 'sans',
        weight: 'extrabold',
        size: '6xl',
        transform: 'uppercase',
        letterSpacing: 'wider'
      },
      body: {
        family: 'serif',
        weight: 'medium',
        size: 'xl',
        style: 'italic'
      },
      small: {
        family: 'mono',
        weight: 'light',
        size: 'sm',
        transform: 'lowercase',
        letterSpacing: 'wide'
      }
    }
  }

  const currentY = renderStandardTextLayout(context, themeFonts)
  renderStandardModelName(context, currentY, themeFonts)
}

export const exampleModern: Theme = {
  id: 'example-modern',
  name: 'Modern Example',

  colors: {
    gradientColor: '59, 130, 246', // Blue
    borderColor: 'rgba(59, 130, 246, 1)'
  },

  fonts: {
    // This theme demonstrates selective overrides
    overrides: {
      title: {
        family: 'sans',
        weight: 'extrabold',
        size: '6xl',
        transform: 'uppercase',
        letterSpacing: 'wider'
      },
      body: {
        family: 'serif',
        weight: 'medium',
        size: 'xl',
        style: 'italic'
      },
      small: {
        family: 'mono',
        weight: 'light',
        size: 'sm',
        transform: 'lowercase',
        letterSpacing: 'wide'
      }
      // Note: tiny, caption, header, etc. will use defaults
    }
  },

  renderOptions: {
    renderStandardLayout: renderModernLayout
  },

  isDefault: false,
  isVisible: true,

  metadata: {
    description: 'Example theme showcasing the new font system with mixed font families and styles',
    tags: ['example', 'modern', 'mixed-fonts', 'demonstration']
  }
}