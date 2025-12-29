import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout } from './utils'

// Custom model name rendering in top container for Shatterpoint theme
const renderShatterpointModelName = (context: ThemeRenderContext): void => {
  const { ctx, canvas, model, customBannerColor } = context

  // Container dimensions and positioning
  const containerHeight = 100 // Blue container height
  const outerPaddingLeft = 20 // Left padding for model name (reduced by 50%)
  const textContainerHeight = 60 // Increased text container height for internal padding
  const textPaddingLeft = 10 // Left padding inside text container (reduced by 50%)
  const textPaddingRight = 60 // Significant right padding inside text container (reduced by 50%)
  const textPaddingVertical = 5 // Equal top and bottom padding inside text container (reduced by 50%)

  // Calculate equal vertical padding for text container within blue container
  const verticalPadding = (containerHeight - textContainerHeight) / 2

  // Draw banner container background at the top (use custom color or default)
  ctx.fillStyle = customBannerColor || '#304D82'
  ctx.fillRect(0, 0, canvas.width, containerHeight)

  // Model name text styling (increased by 30%, small-caps)
  const modelNameText = model.name.toUpperCase()
  const baseFontSize = 36
  const increasedFontSize = Math.round(baseFontSize * 1.3) // 30% increase
  ctx.font = `bold ${increasedFontSize}px "TeutonFett", Arvo, serif`
  ctx.fontVariant = 'small-caps'

  // Measure text to determine container width
  const textMetrics = ctx.measureText(modelNameText)
  const textWidth = textMetrics.width

  // Text container dimensions (extends from left edge with proper padding)
  const textContainerX = 0 // Start at left edge
  const textContainerY = verticalPadding // Equal padding above and below
  const textContainerWidth = textWidth + textPaddingLeft + textPaddingRight + outerPaddingLeft

  // Calculate 10-degree slant offset (opposite direction)
  const slantAngle = 10 * (Math.PI / 180) // Convert to radians
  const slantOffset = textContainerHeight * Math.tan(slantAngle)

  // Draw dark text container with slanted right edge using path
  ctx.fillStyle = '#231F21'
  ctx.beginPath()

  // Start at top-left corner
  ctx.moveTo(textContainerX, textContainerY)

  // Draw to top-right (no offset)
  ctx.lineTo(textContainerX + textContainerWidth, textContainerY)

  // Draw to bottom-right (with slant offset inward - creates opposite slant)
  ctx.lineTo(textContainerX + textContainerWidth - slantOffset, textContainerY + textContainerHeight)

  // Draw to bottom-left
  ctx.lineTo(textContainerX, textContainerY + textContainerHeight)

  // Close the path back to start
  ctx.closePath()
  ctx.fill()

  // Draw text inside the dark container
  ctx.fillStyle = '#ffffff' // White text
  ctx.textAlign = 'left'

  // Position text within the text container (properly centered with internal padding)
  const textX = outerPaddingLeft + textPaddingLeft // Combined left padding
  const textY = textContainerY + (textContainerHeight / 2) + (increasedFontSize / 3) // Center in container with font baseline adjustment

  ctx.fillText(modelNameText, textX, textY)

  // Add game name, collection name, and icon to the right side of the blue container
  const gameName = context.model.box?.game?.name || context.model.game?.name
  const gameIcon = context.model.box?.game?.icon || context.model.game?.icon
  const collectionName = context.model.box?.name

  if (context.showGameDetails && gameName) {
    // Text styling - consistent for both game and collection
    const textFontSize = 24 // Font size for both game and collection
    ctx.font = `bold ${textFontSize}px "AvenirNextLTPro-Bold", "Avenir Next", sans-serif`

    // Prepare text content
    const gameNameText = gameName.toUpperCase()
    const collectionNameText = collectionName ? collectionName.toUpperCase() : ''

    // Measure text widths
    const gameTextMetrics = ctx.measureText(gameNameText)
    const gameTextWidth = gameTextMetrics.width

    let collectionTextWidth = 0
    if (collectionNameText) {
      const collectionTextMetrics = ctx.measureText(collectionNameText)
      collectionTextWidth = collectionTextMetrics.width
    }

    // Icon dimensions
    const iconSize = 30 // Icon size (increased by 50% from 20px)
    const iconPadding = 8 // Space between text and icon
    const lineSpacing = 6 // Space between game name and collection name lines

    // Calculate maximum width needed (game name + icon vs collection name)
    const gameLineWidth = gameTextWidth + (gameIcon ? iconSize + iconPadding : 0)
    const maxLineWidth = Math.max(gameLineWidth, collectionTextWidth)
    const rightPadding = 20 // Padding from right edge of canvas

    // Calculate vertical positioning - center single line or position two lines
    let gameTextY, collectionTextY
    const baseX = canvas.width - rightPadding - maxLineWidth

    if (collectionNameText && context.showCollectionName) {
      // Two lines: position as a group centered in container
      const totalTextHeight = textFontSize * 2 + lineSpacing
      const startY = (containerHeight - totalTextHeight) / 2 + textFontSize

      gameTextY = startY
      collectionTextY = startY + textFontSize + lineSpacing
    } else {
      // Single line: center the game name vertically in the container
      gameTextY = containerHeight / 2 + (textFontSize / 3)
      collectionTextY = 0 // Not used
    }

    // Game name positioning
    const gameTextX = baseX + (maxLineWidth - gameLineWidth) // Right-align within the allocated space

    // Collection name positioning (if it exists)
    const collectionTextX = baseX + (maxLineWidth - collectionTextWidth) // Right-align within the allocated space

    // Draw game name text
    ctx.fillStyle = '#ffffff' // White text
    ctx.textAlign = 'left'
    ctx.fillText(gameNameText, gameTextX, gameTextY)

    // Draw collection name text (if it exists)
    if (collectionNameText && context.showCollectionName) {
      ctx.fillText(collectionNameText, collectionTextX, collectionTextY)
    }

    // Draw game icon if available
    if (gameIcon) {
      console.log('Shatterpoint: Attempting to load game icon:', gameIcon)

      try {
        const iconImg = new Image()
        iconImg.crossOrigin = 'anonymous'

        iconImg.onload = () => {
          console.log('Shatterpoint: Game icon loaded successfully')

          // Position icon to the right of the game name text
          const iconX = gameTextX + gameTextWidth + iconPadding
          const iconY = gameTextY - textFontSize + (textFontSize - iconSize) / 2 // Align with game name line

          // Save context state
          ctx.save()

          // Draw the icon
          ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)

          // Restore context state
          ctx.restore()
        }

        iconImg.onerror = (error) => {
          console.error('Shatterpoint: Failed to load game icon:', gameIcon, error)
        }

        // Set the source to trigger loading
        iconImg.src = gameIcon

      } catch (error) {
        console.error('Shatterpoint: Error setting up game icon:', error)
      }
    } else {
      console.log('Shatterpoint: No game icon available for game:', gameName)
    }
  }
}

// Custom bottom container rendering for Shatterpoint theme
const renderShatterpointBottomContainer = async (context: ThemeRenderContext): Promise<void> => {
  const { ctx, canvas, model, user, userPublicName, showPaintedDate, customBannerColor } = context

  // Bottom container dimensions (smaller than top)
  const bottomContainerHeight = 60 // Smaller than top container (100px)
  const originalHeight = canvas.height

  // Extend canvas height to accommodate bottom container
  const newHeight = originalHeight + bottomContainerHeight

  // Preserve existing content
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  if (!tempCtx) return

  tempCanvas.width = canvas.width
  tempCanvas.height = originalHeight
  tempCtx.drawImage(canvas, 0, 0)

  // Resize main canvas
  canvas.height = newHeight
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Restore original content
  ctx.drawImage(tempCanvas, 0, 0)

  // Bottom container positioned below the original image
  const bottomContainerY = originalHeight

  // Bottom bar always matches top bar color
  const bottomContainerColor = customBannerColor || '#304D82'

  // Draw bottom banner container background
  ctx.fillStyle = bottomContainerColor
  ctx.fillRect(0, bottomContainerY, canvas.width, bottomContainerHeight)

  // Text styling for bottom container (smaller than top)
  const textFontSize = 18 // Smaller than top container (24px)
  ctx.font = `bold ${textFontSize}px "AvenirNextLTPro-Bold", "Avenir Next", sans-serif`
  ctx.fillStyle = '#ffffff' // White text
  ctx.textAlign = 'left'

  const leftPadding = 20
  const rightPadding = 20

  // Painted date (left side of bottom container)
  if (showPaintedDate && model.painted_date) {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(model.painted_date))
    const dateText = `PAINTED ${formattedDate.toUpperCase()}`

    const dateY = bottomContainerY + (bottomContainerHeight / 2) + (textFontSize / 3)
    ctx.fillText(dateText, leftPadding, dateY)
  }

  // Artist/user name (right side of bottom container)
  if (userPublicName || user?.user_metadata?.display_name) {
    let displayName = 'Unknown User'

    if (userPublicName && userPublicName.trim()) {
      displayName = userPublicName.trim()
    } else if (user?.user_metadata?.display_name && user.user_metadata.display_name.trim()) {
      displayName = user.user_metadata.display_name.trim()
    }

    const artistText = `BY ${displayName.toUpperCase()}`

    // Measure text to position it on the right
    const artistMetrics = ctx.measureText(artistText)
    const artistX = canvas.width - rightPadding - artistMetrics.width
    const artistY = bottomContainerY + (bottomContainerHeight / 2) + (textFontSize / 3)

    ctx.textAlign = 'left'
    ctx.fillText(artistText, artistX, artistY)
  }

  // Add Battleplan logo in the center of the bottom container
  try {
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => {
        console.log('Shatterpoint: Battleplan logo loaded successfully')

        // Calculate logo size (doubled again)
        const originalLogoSize = 40 // Base size for bottom container
        const reducedSize = Math.round(originalLogoSize * 0.7) // Previously reduced by 30%
        const doubledSize = reducedSize * 2 // Previously doubled to 56px
        const logoSize = doubledSize * 2 // Double again to 112px
        const logoAspectRatio = logoImg.width / logoImg.height

        let logoWidth = logoSize
        let logoHeight = logoSize

        if (logoAspectRatio > 1) {
          logoHeight = logoSize / logoAspectRatio
        } else {
          logoWidth = logoSize * logoAspectRatio
        }

        // Position logo in the center of the bottom container
        const logoX = (canvas.width - logoWidth) / 2
        const logoY = bottomContainerY + (bottomContainerHeight - logoHeight) / 2

        // Save context state
        ctx.save()

        // Draw the logo
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight)

        // Restore context state
        ctx.restore()

        resolve()
      }

      logoImg.onerror = (error) => {
        console.error('Shatterpoint: Failed to load Battleplan logo:', error)
        resolve() // Don't fail the entire render if logo fails
      }

      logoImg.src = '/Battleplan-Logo-White.svg'
    })
  } catch (error) {
    console.error('Shatterpoint: Error loading Battleplan logo:', error)
  }
}

// Custom layout rendering for Shatterpoint theme
const renderShatterpointLayout = async (context: ThemeRenderContext): Promise<void> => {
  // Render model name in top container first
  renderShatterpointModelName(context)

  // Render bottom container with painted date, artist, and logo
  await renderShatterpointBottomContainer(context)

  // No need to render standard layout since all content is now in the top and bottom containers
}

// Font loading for TeutonFett, Overpass, and Avenir Next LT Pro
const loadFonts = async (): Promise<void> => {
  // Create and load Avenir Next LT Pro font faces
  const avenirRegular = new FontFace('AvenirNextLTPro-Regular', 'url(/fonts/shatterpoint/AvenirNextLTPro-Regular.otf)')
  const avenirItalic = new FontFace('AvenirNextLTPro-It', 'url(/fonts/shatterpoint/AvenirNextLTPro-It.otf)')
  const avenirBold = new FontFace('AvenirNextLTPro-Bold', 'url(/fonts/shatterpoint/AvenirNextLTPro-Bold.otf)')

  try {
    // Load the new fonts
    await avenirRegular.load()
    await avenirItalic.load()
    await avenirBold.load()

    // Add them to the document
    document.fonts.add(avenirRegular)
    document.fonts.add(avenirItalic)
    document.fonts.add(avenirBold)

    console.log('Shatterpoint Avenir fonts loaded successfully')
  } catch (error) {
    console.warn('Failed to load Avenir fonts, falling back to system fonts:', error)
  }

  // Load existing fonts
  await Promise.all([
    document.fonts.load('48px "TeutonFett"'),
    document.fonts.load('32px Overpass'),
    document.fonts.load('28px Overpass'),
    document.fonts.load('24px Overpass'),
    document.fonts.load('28px "AvenirNextLTPro-Bold"'),
    document.fonts.load('24px "AvenirNextLTPro-Bold"'),
    document.fonts.load('20px "AvenirNextLTPro-Bold"')
  ])
}

export const shatterpoint: Theme = {
  id: 'shatterpoint',
  name: 'Shatterpoint',

  colors: {
    gradientColor: '252, 215, 3',
    borderColor: 'rgba(252, 215, 3, 1)'
  },

  fonts: {
    overrides: {
      title: {
        family: 'serif',
        weight: 'bold',
        size: '5xl',
        transform: 'uppercase',
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
      titleFont: 'bold 48px "TeutonFett", Arvo, serif',
      bodyFont: '28px "AvenirNextLTPro-Bold", "Avenir Next", sans-serif',
      smallFont: '24px "AvenirNextLTPro-Bold", "Avenir Next", sans-serif',
      tinyFont: '20px "AvenirNextLTPro-Bold", "Avenir Next", sans-serif'
    }
  },

  renderOptions: {
    renderStandardLayout: renderShatterpointLayout,
    renderModelName: () => {}, // Empty function since we handle model name in the container
    loadFonts,
    customTextPosition: true, // Indicates this theme handles text positioning custom way
    visualOverlays: [] // Explicitly disable all visual overlays to prevent default logo rendering
  },

  // Theme-specific default settings
  defaultSettings: {
    showCollectionName: true, // Show collection name by default for Shatterpoint theme
    showGameDetails: true, // Show game details by default
    textPosition: 'bottom-center', // Default text position
    isDarkText: false, // Use light text by default
    showPaintedDate: true, // Show painted date by default
  },

  // Hide gradient-related controls and border color, add banner color dropdown
  customControls: {
    hideVisualOverlays: true,
    hideGradientColor: true,
    hideGradientOpacity: true,
    hideBorderColor: true,
    bannerColorOptions: [
      { name: 'Republic Blue', value: '#304D82' },
      { name: 'Seperatist Red', value: '#9F2221' },
      { name: 'Imperial Black', value: '#312836' },
      { name: 'Mercenary Gray', value: '#6B686B' },
      { name: 'Rebellion Orange', value: '#944524' }
    ]
  },

  isDefault: true,
  isVisible: true,

  metadata: {
    description: 'Shatterpoint theme with model name container and custom layout',
    tags: ['dramatic', 'bold', 'custom-font', 'container', 'clean']
  }
}