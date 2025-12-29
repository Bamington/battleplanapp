import { Theme, ThemeRenderContext } from './types'
import { formatLocalDate } from '../utils/timezone'

// Custom Red Mist layout with model name at top-right
const renderRedMistLayout = async (context: ThemeRenderContext): Promise<void> => {
  const {
    ctx,
    canvas,
    model,
    user,
    userPublicName,
    shadowOpacity,
    textPosition,
    showPaintedDate,
    showCollectionName,
    showGameDetails,
    isDarkText
  } = context

  const fonts = {
    titleFont: '56px "Blight", "WoodenBridge", serif', // Use Blight font for model name, fallback to WoodenBridge
    bodyFont: '32px "lumier-bold", "WoodenBridge", sans-serif', // Fallback to WoodenBridge
    smallFont: '28px "lumier-bold", "WoodenBridge", sans-serif', // Fallback to WoodenBridge
    tinyFont: '24px "lumier-bold", "WoodenBridge", sans-serif' // Fallback to WoodenBridge
  }

  // Render model name in top-right with gradient background and full-width container
  ctx.font = fonts.titleFont

  // Create octagonal container at the top with margins and padding
  const containerHeight = 80
  const margin = 10
  const padding = 6 // Internal padding for content
  const cornerCut = 15 // Size of the cut corners to create octagonal shape

  const containerX = margin
  const containerY = margin
  const containerWidth = canvas.width - (margin * 2)
  const actualContainerHeight = containerHeight - (margin * 2)

  // Create green gradient for container background
  const headerBgGradient = ctx.createLinearGradient(containerX, containerY, containerX + containerWidth, containerY)
  headerBgGradient.addColorStop(0, '#0D3127')    // Dark green at 0%
  headerBgGradient.addColorStop(0.5, '#145141')  // Lighter green at 50%
  headerBgGradient.addColorStop(1, '#0D3127')    // Dark green at 100%

  // Create golden gradient for border
  const borderGradient = ctx.createLinearGradient(containerX, containerY, containerX + containerWidth, containerY)
  borderGradient.addColorStop(0, '#DFA66A')    // Golden brown at 0%
  borderGradient.addColorStop(0.5, '#F7E7A6')  // Light cream at 50%
  borderGradient.addColorStop(1, '#DFA66A')    // Golden brown at 100%

  // Draw octagonal shape with cut corners
  ctx.beginPath()
  ctx.moveTo(containerX + cornerCut, containerY) // Top left, start after corner cut
  ctx.lineTo(containerX + containerWidth - cornerCut, containerY) // Top right, before corner cut
  ctx.lineTo(containerX + containerWidth, containerY + cornerCut) // Top right corner cut
  ctx.lineTo(containerX + containerWidth, containerY + actualContainerHeight - cornerCut) // Right side, before bottom corner cut
  ctx.lineTo(containerX + containerWidth - cornerCut, containerY + actualContainerHeight) // Bottom right corner cut
  ctx.lineTo(containerX + cornerCut, containerY + actualContainerHeight) // Bottom left, before corner cut
  ctx.lineTo(containerX, containerY + actualContainerHeight - cornerCut) // Bottom left corner cut
  ctx.lineTo(containerX, containerY + cornerCut) // Left side, back to top corner cut
  ctx.closePath()

  // Fill the octagonal background
  ctx.fillStyle = headerBgGradient
  ctx.fill()

  // Add golden gradient border
  ctx.strokeStyle = borderGradient
  ctx.lineWidth = 2
  ctx.stroke()

  // Create golden gradient for text color: #DFA66A -> #F7E7A6 -> #DFA66A
  const textGradient = ctx.createLinearGradient(containerX, containerY, containerX + containerWidth, containerY)
  textGradient.addColorStop(0, '#DFA66A')    // Golden brown at 0%
  textGradient.addColorStop(0.5, '#F7E7A6')  // Light cream at 50%
  textGradient.addColorStop(1, '#DFA66A')    // Golden brown at 100%

  // Set text color to golden gradient
  ctx.fillStyle = textGradient
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  // Logo removed from top container - will be added at bottom

  // Position model name text in top-right of the container (accounting for margins, padding, and corner cuts)
  const textPadding = 20
  const modelNameX = containerX + containerWidth - textPadding - padding
  const modelNameY = containerY + actualContainerHeight / 2
  ctx.fillText(model.name, modelNameX, modelNameY)

  // Add game name and icon to the left side of the container (if game details enabled)
  if (showGameDetails) {
    const gameName = model.box?.game?.name || model.game?.name
    const gameIcon = model.box?.game?.icon || model.game?.icon

    if (gameName) {
      // Set font for game name (smaller than model name)
      ctx.font = fonts.smallFont
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'

      // Calculate positions - account for icon space first
      const iconSize = 28 // Icon size
      const iconPadding = 8 // Space between icon and text
      const baseStartX = containerX + padding + cornerCut + 10 // Start after corner cut with padding

      let gameNameX = baseStartX
      let iconX = baseStartX

      // If there's an icon, adjust positions
      if (gameIcon) {
        iconX = baseStartX
        gameNameX = baseStartX + iconSize + iconPadding // Text starts after icon + padding
      }

      const gameNameY = containerY + actualContainerHeight / 2

      // Draw game icon first (if exists) to the left of the text
      if (gameIcon) {
        try {
          const iconImg = new Image()
          iconImg.crossOrigin = 'anonymous'

          await new Promise<void>((resolve, reject) => {
            iconImg.onload = () => {
              const iconY = gameNameY - iconSize / 2 // Center vertically with text

              // Draw the game icon
              ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)

              resolve()
            }
            iconImg.onerror = () => {
              console.warn('Failed to load game icon in Red Fog theme')
              resolve()
            }
            iconImg.src = gameIcon
          })
        } catch (error) {
          console.warn('Error loading game icon in Red Fog theme:', error)
        }
      }

      // Draw game name after icon
      ctx.fillStyle = textGradient // Use same golden gradient
      ctx.fillText(gameName, gameNameX, gameNameY)
    }
  }

  // Reset shadow for other elements
  ctx.shadowColor = 'transparent'

  // Always use black text for this theme (ignore isDarkText setting)
  const primaryColor = '#000000'
  const secondaryColor = '#000000'
  const tertiaryColor = '#000000'
  const quaternaryColor = '#000000'

  // Collect all text elements to render
  const textElements: Array<{ text: string, font: string, color: string }> = []

  // Game name moved to top container - no longer in bottom text elements

  // Define smaller fonts for bottom container
  const bottomFonts = {
    collectionFont: '28px "lumier-bold", "WoodenBridge", sans-serif', // Reduced from 32px
    dateFont: '24px "lumier-bold", "WoodenBridge", sans-serif',       // Reduced from 28px
    userFont: '20px "lumier-bold", "WoodenBridge", sans-serif'        // Reduced from 24px
  }

  // Collection name - with drop shadow (only if enabled)
  if (showCollectionName && model.box?.name) {
    textElements.push({
      text: model.box.name,
      font: bottomFonts.collectionFont,
      color: secondaryColor
    })
  }

  // Painted date - with drop shadow (only if enabled)
  if (showPaintedDate && model.painted_date) {
    const formattedDate = formatLocalDate(model.painted_date, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    textElements.push({
      text: `Painted ${formattedDate}`,
      font: bottomFonts.dateFont,
      color: tertiaryColor
    })
  }

  // User's public name (bottom of container) - with drop shadow
  if (userPublicName || user?.user_metadata?.display_name) {
    let displayName = 'Unknown User'

    if (userPublicName && userPublicName.trim()) {
      displayName = userPublicName.trim()
    } else if (user?.user_metadata?.display_name && user.user_metadata.display_name.trim()) {
      displayName = user.user_metadata.display_name.trim()
    }

    textElements.push({
      text: `by ${displayName}`,
      font: bottomFonts.userFont,
      color: quaternaryColor
    })
  }

  // Calculate container dimensions
  if (textElements.length > 0) {
    // Calculate text dimensions to size the container
    let maxWidth = 0
    const lineHeights: number[] = []

    textElements.forEach(element => {
      ctx.font = element.font
      const metrics = ctx.measureText(element.text)
      maxWidth = Math.max(maxWidth, metrics.width)

      // Extract font size for line height calculation
      const fontSize = parseInt(element.font.match(/\d+/)?.[0] || '32')
      lineHeights.push(fontSize + 10) // Add some line spacing
    })

    // Container styling - reduced vertical padding for tighter container
    const containerHorizontalPadding = 30 // Keep horizontal padding for text readability
    const containerVerticalPadding = 15 // Reduced vertical padding (was 30)
    const containerWidth = maxWidth + (containerHorizontalPadding * 2)
    const containerHeight = lineHeights.reduce((sum, height) => sum + height, 0) + (containerVerticalPadding * 2)

    // Position container based on textPosition setting - align with top container margins
    const bottomMargin = 20 // Restored bottom margin for proper spacing
    const horizontalMargin = 10 // Same as top container margin for alignment

    let containerX: number
    let containerY = canvas.height - containerHeight - bottomMargin

    // Calculate horizontal position based on textPosition - aligned with top container
    console.log('Red Fog textPosition:', textPosition)

    switch (textPosition) {
      case 'bottom-left':
        containerX = horizontalMargin // Align with top container left edge
        break
      case 'bottom-right':
        containerX = canvas.width - containerWidth - horizontalMargin // Align with top container right edge
        break
      case 'bottom-center':
        containerX = (canvas.width - containerWidth) / 2
        break
      default:
        // Fallback to center for any unrecognized position
        containerX = (canvas.width - containerWidth) / 2
        break
    }

    // Create octagonal container for bottom text (smaller corner cuts than top)
    const bottomCornerCut = 8 // Smaller corner cuts for bottom container

    // Add soft drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)' // Soft black shadow
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 3 // Shadow slightly below container

    // Draw octagonal shape with cut corners
    ctx.beginPath()
    ctx.moveTo(containerX + bottomCornerCut, containerY) // Top left, start after corner cut
    ctx.lineTo(containerX + containerWidth - bottomCornerCut, containerY) // Top right, before corner cut
    ctx.lineTo(containerX + containerWidth, containerY + bottomCornerCut) // Top right corner cut
    ctx.lineTo(containerX + containerWidth, containerY + containerHeight - bottomCornerCut) // Right side, before bottom corner cut
    ctx.lineTo(containerX + containerWidth - bottomCornerCut, containerY + containerHeight) // Bottom right corner cut
    ctx.lineTo(containerX + bottomCornerCut, containerY + containerHeight) // Bottom left, before corner cut
    ctx.lineTo(containerX, containerY + containerHeight - bottomCornerCut) // Bottom left corner cut
    ctx.lineTo(containerX, containerY + bottomCornerCut) // Left side, back to top corner cut
    ctx.closePath()

    // Fill with solid background color
    ctx.fillStyle = '#DBCAB0' // Light brown/tan color
    ctx.fill()

    // Reset shadow before drawing border
    ctx.shadowColor = 'transparent'

    // Add thin border
    ctx.strokeStyle = '#E0A86C' // Golden brown border
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw text elements centered in container
    let currentY = containerY + containerVerticalPadding + lineHeights[0] - 10

    textElements.forEach((element, index) => {
      ctx.font = element.font
      ctx.fillStyle = element.color
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'

      // Add drop shadow
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // Draw text centered in container
      ctx.fillText(element.text, containerX + containerWidth / 2, currentY)

      // Reset shadow
      ctx.shadowColor = 'transparent'

      // Move to next line
      if (index < textElements.length - 1) {
        currentY += lineHeights[index + 1] || lineHeights[index]
      }
    })
  }

  // Add Battleplan logo to bottom, opposite side of text container
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => {
        // Calculate logo size - triple the previous size
        const logoSize = 180 // Tripled from 60px
        const logoAspectRatio = logoImg.width / logoImg.height

        let logoWidth = logoSize
        let logoHeight = logoSize

        if (logoAspectRatio > 1) {
          logoHeight = logoSize / logoAspectRatio
        } else {
          logoWidth = logoSize * logoAspectRatio
        }

        // Position logo opposite to text container - align with top container margins
        let logoX: number
        let logoY = canvas.height - 20 - logoHeight // 20px from bottom for better spacing with larger logo

        // Position based on text position - opposite side, aligned with top container (10px margin)
        if (textPosition === 'bottom-left') {
          // Text is on left, put logo on right - align with top container right edge
          logoX = canvas.width - 10 - logoWidth // 10px margin from right (same as top container)
        } else {
          // Text is on right or center, put logo on left - align with top container left edge
          logoX = 10 // 10px margin from left (same as top container)
        }

        // Draw the logo
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)

        resolve()
      }
      logoImg.onerror = () => {
        console.warn('Failed to load Battleplan logo at bottom in Red Fog theme')
        resolve()
      }
      logoImg.src = '/Battleplan-Logo-Purple.svg'
    })
  } catch (error) {
    console.warn('Error loading bottom logo in Red Fog theme:', error)
  }
}

// Font loading for Blight Regular and lumier-bold
const loadFonts = async (): Promise<void> => {
  console.log('Loading Red Fog fonts...')

  try {
    // Load only the fonts that are known to work
    const fontPromises = []

    // Always load WoodenBridge first as it's our fallback
    fontPromises.push(document.fonts.load('56px "WoodenBridge"'))

    // Try to load lumier-bold (this should work)
    fontPromises.push(
      document.fonts.load('32px "lumier-bold"'),
      document.fonts.load('28px "lumier-bold"'),
      document.fonts.load('24px "lumier-bold"')
    )

    // Try to load Blight font
    try {
      fontPromises.push(document.fonts.load('56px "Blight"'))
    } catch (blightError) {
      console.warn('Blight font unavailable, using WoodenBridge fallback')
    }

    await Promise.allSettled(fontPromises)
    console.log('Red Fog fonts loading completed')

    // Check font loading status
    console.log('Font loading status:')
    console.log('WoodenBridge:', document.fonts.check('56px "WoodenBridge"'))
    console.log('lumier-bold 32px:', document.fonts.check('32px "lumier-bold"'))
    console.log('Blight:', document.fonts.check('56px "Blight"'))

  } catch (error) {
    console.error('Error loading Red Fog fonts:', error)
    console.log('Falling back to system fonts')
  }
}

export const redFog: Theme = {
  id: 'red-fog',
  name: 'Warcrow',

  colors: {
    gradientColor: '223, 166, 106', // Golden brown (#DFA66A)
    borderColor: 'rgba(223, 166, 106, 1)' // Golden brown border
  },

  fonts: {
    overrides: {
      title: {
        family: 'serif',
        weight: 'bold',
        size: '5xl',
        transform: 'normal-case',
        letterSpacing: 'normal'
      },
      header: {
        family: 'sans',
        weight: 'bold',
        size: 'xl',
        transform: 'uppercase'
      },
      body: {
        family: 'sans',
        weight: 'bold',
        size: 'lg'
      },
      small: {
        family: 'sans',
        weight: 'bold',
        size: 'base'
      },
      tiny: {
        family: 'sans',
        weight: 'bold',
        size: 'sm'
      }
    },
    legacyFonts: {
      titleFont: '56px "Blight", "WoodenBridge", "Times New Roman", serif',
      bodyFont: '32px "lumier-bold", "WoodenBridge", "Arial Black", sans-serif',
      smallFont: '28px "lumier-bold", "WoodenBridge", "Arial", sans-serif',
      tinyFont: '24px "lumier-bold", "WoodenBridge", "Arial", sans-serif'
    }
  },

  renderOptions: {
    renderStandardLayout: renderRedMistLayout,
    loadFonts
  },

  // Theme-specific default settings
  defaultSettings: {
    showCollectionName: true, // Show collection name by default
    textPosition: 'bottom-center' // Default to center position
  },

  // Custom controls for this theme
  customControls: {
    hideDarkTextToggle: true, // Remove dark/light text controls
    hideTextShadow: true, // Remove text shadow control
    hideGradientColor: true, // Remove gradient color control
    hideBorderColor: true, // Remove border color control
    hideGradientOpacity: true, // Remove gradient opacity control
    hideVisualOverlays: true, // Remove visual overlays/gradient enable toggle
    textPositionOptions: [
      { value: 'bottom-left', label: 'Bottom Left' },
      { value: 'bottom-center', label: 'Bottom Center' },
      { value: 'bottom-right', label: 'Bottom Right' }
    ]
  },

  isDefault: true,
  isVisible: true,

  metadata: {
    description: 'Red Fog theme with parchment container and positioning controls',
    tags: ['parchment', 'positioning', 'custom-font', 'green-header']
  }
}