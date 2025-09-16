import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout } from './utils'
import { createPatternOverlay, createSymbolOverlay, createShapeOverlay } from './overlayUtils'

// Custom Marathon layout with unit name in top-right green container and info at bottom
const renderMarathonLayout = async (context: ThemeRenderContext): Promise<void> => {
  const { 
    ctx, 
    canvas, 
    model, 
    userPublicName, 
    shadowOpacity, 
    showPaintedDate, 
    showCollectionName, 
    showGameDetails, 
    isDarkText 
  } = context

  const originalHeight = canvas.height
  const padding = 20

  // TOP RIGHT - Unit name in green container
  const unitNameText = model.name.toUpperCase()
  ctx.font = 'bold 42px "AUTOMATA", Arial, sans-serif' // Increased from 32px to 42px (30% larger)
  
  // Measure text for container sizing
  const nameMetrics = ctx.measureText(unitNameText)
  const nameWidth = nameMetrics.width
  const nameHeight = 52 // Increased proportionally from 40 to 52
  
  // Green container dimensions and position - flush with top-right corner
  const containerPadding = 16
  const containerWidth = nameWidth + containerPadding // Only right padding (removed left padding)
  const containerHeight = nameHeight + (containerPadding * 1.5)
  const cornerWidth = 24 // Minimal width just for the corner effect (double the 12px cut)
  const totalWidth = containerWidth + cornerWidth // Total width including corner
  const cornerX = canvas.width - totalWidth // Position corner on the left
  const containerX = cornerX + cornerWidth // Position container flush with corner (no spacing)
  const containerY = 0 // Flush with top edge
  
  // Draw the corner and container as one continuous shape to eliminate any gaps
  const cornerY = containerY // Same top position
  ctx.fillStyle = '#2E4650' // Same color as container
  ctx.beginPath()
  // Start with the corner piece
  ctx.moveTo(cornerX, cornerY) // Top-left of corner (normal corner)
  ctx.lineTo(containerX, cornerY) // Top-right of corner / Top-left of container
  // Continue with the container rectangle
  ctx.lineTo(containerX + containerWidth, cornerY) // Top-right of container
  ctx.lineTo(containerX + containerWidth, cornerY + containerHeight) // Bottom-right of container
  ctx.lineTo(containerX, cornerY + containerHeight) // Bottom-left of container / Bottom-right of corner
  // Finish with the corner's angled cut
  ctx.lineTo(cornerX + 12, cornerY + containerHeight) // Bottom-left with cutoff
  ctx.lineTo(cornerX, cornerY + containerHeight - 12) // Left side with angled cut
  ctx.closePath()
  ctx.fill()
  
  // Draw unit name text (white on green background) - aligned to left edge
  ctx.textAlign = 'left'
  ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1
  ctx.fillStyle = '#ffffff'
  ctx.fillText(
    unitNameText,
    containerX, // Left edge of container (no padding)
    containerY + containerHeight / 2 + nameHeight / 4
  )
  ctx.shadowColor = 'transparent'

  // BOTTOM INFO SECTION - Light green background like in reference
  let bottomElements: Array<{
    text: string
    font: string
    x: number
    y: number
    align: CanvasTextAlign
    color: string
  }> = []
  
  let bottomY = 0
  let bottomMinX = canvas.width
  let bottomMaxX = 0
  let bottomMinY = Infinity
  let bottomMaxY = 0
  
  // Temporary positioning for measurement
  let tempY = originalHeight + 50
  const leftX = padding + 10
  const rightX = canvas.width - padding - 10
  
  // Text colors - white text on green background
  const textColor = '#ffffff'
  
  // Calculate required container height first based on content
  let requiredHeight = 0
  let maxLeftHeight = 0
  let maxRightHeight = 0
  
  // Calculate left side height (game + collection)
  const gameName = model.box?.game?.name || model.game?.name
  if (showGameDetails && gameName) {
    maxLeftHeight += 28 + 8 // font size + padding (increased from 24)
  }
  if (showCollectionName && model.box?.name) {
    if (maxLeftHeight > 0) maxLeftHeight += 6 // gap between elements
    maxLeftHeight += 24 + 8 // font size + padding (increased from 20)
  }
  
  // Calculate right side height (date + user)
  if (showPaintedDate && model.painted_date) {
    maxRightHeight += 22 + 8 // font size + padding (increased from 18)
  }
  if (userPublicName || context.user?.user_metadata?.display_name) {
    if (maxRightHeight > 0) maxRightHeight += 6 // gap between elements
    maxRightHeight += 20 + 8 // font size + padding (increased from 16)
  }
  
  // Use the larger side to determine container height
  const contentHeight = Math.max(maxLeftHeight, maxRightHeight)
  const bottomContainerPadding = 15
  const finalContainerHeight = contentHeight + (bottomContainerPadding * 2)
  
  // Now position elements centered within this height
  const containerCenter = originalHeight + (finalContainerHeight / 2)
  
  // Position left side elements centered
  let leftStartY = containerCenter - (maxLeftHeight / 2)
  
  // Game name and icon (left side)
  if (showGameDetails && gameName) {
    ctx.font = '28px "Audiowide", Arial, sans-serif'
    const gameMetrics = ctx.measureText(gameName.toUpperCase())
    
    // Account for icon space
    const gameIcon = model.box?.game?.icon || model.game?.icon
    const iconOffset = gameIcon ? 32 : 0
    
    bottomElements.push({
      text: gameName.toUpperCase(),
      font: '28px "Audiowide", Arial, sans-serif',
      x: leftX + iconOffset,
      y: leftStartY + 28, // baseline position (increased from 24)
      align: 'left',
      color: textColor
    })

    leftStartY += 28 + 8 + 6 // move down for next element (increased from 24)
  }
  
  // Collection name (left side, below game)
  if (showCollectionName && model.box?.name) {
    ctx.font = '24px "Audiowide", Arial, sans-serif'
    const collectionMetrics = ctx.measureText(model.box.name)

    bottomElements.push({
      text: model.box.name,
      font: '24px "Audiowide", Arial, sans-serif',
      x: leftX,
      y: leftStartY + 24, // baseline position (increased from 20)
      align: 'left',
      color: textColor
    })
  }
  
  // Position right side elements centered
  let rightStartY = containerCenter - (maxRightHeight / 2)
  
  // Painted date (right side)
  if (showPaintedDate && model.painted_date) {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(model.painted_date))
    const dateText = `Painted ${formattedDate}`
    
    ctx.font = '22px "Audiowide", Arial, sans-serif'
    const dateMetrics = ctx.measureText(dateText)

    bottomElements.push({
      text: dateText,
      font: '22px "Audiowide", Arial, sans-serif',
      x: rightX,
      y: rightStartY + 22, // baseline position (increased from 18)
      align: 'right',
      color: textColor
    })

    rightStartY += 22 + 8 + 6 // move down for next element (increased from 18)
  }
  
  // User name (right side, below painted date)
  if (userPublicName || context.user?.user_metadata?.display_name) {
    let displayName = 'Unknown User'
    if (userPublicName && userPublicName.trim()) {
      displayName = userPublicName.trim()
    } else if (context.user?.user_metadata?.display_name && context.user.user_metadata.display_name.trim()) {
      displayName = context.user.user_metadata.display_name.trim()
    }
    const displayText = `by ${displayName}`
    
    ctx.font = '20px "Audiowide", Arial, sans-serif'
    const userMetrics = ctx.measureText(displayText)

    bottomElements.push({
      text: displayText,
      font: '20px "Audiowide", Arial, sans-serif',
      x: rightX,
      y: rightStartY + 20, // baseline position (increased from 16)
      align: 'right',
      color: textColor
    })
  }
  
  // Only create bottom section if we have elements
  if (bottomElements.length > 0) {
    // Use the calculated container height
    const bottomContainerWidth = canvas.width
    const bottomContainerX = 0
    
    // Extend canvas for bottom container
    const newHeight = originalHeight + finalContainerHeight
    
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
    
    // Draw green bottom container background - same as top container
    const bottomContainerTop = originalHeight
    ctx.fillStyle = '#2E4650' // Same green as top container
    ctx.fillRect(bottomContainerX, bottomContainerTop, bottomContainerWidth, finalContainerHeight)
    
    // Render text elements (positions are already calculated correctly)
    bottomElements.forEach(element => {
      ctx.font = element.font
      ctx.textAlign = element.align
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})` // Add shadow for white text on green
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1
      ctx.fillStyle = element.color
      ctx.fillText(element.text, element.x, element.y)
      ctx.shadowColor = 'transparent'
    })
    
    // Handle game icon if present
    if (showGameDetails && gameName) {
      const gameIcon = model.box?.game?.icon || model.game?.icon
      if (gameIcon) {
        const iconSize = 24
        
        try {
          const iconImg = new Image()
          iconImg.crossOrigin = 'anonymous'
          
          iconImg.onload = () => {
            const gameElement = bottomElements.find(el => el.text === gameName.toUpperCase())
            if (gameElement) {
              const iconY = gameElement.y - iconSize + 4
              ctx.drawImage(iconImg, leftX, iconY, iconSize, iconSize)
            }
          }
          iconImg.onerror = () => console.warn('Marathon game icon failed to load:', gameIcon)
          iconImg.src = gameIcon
        } catch (error) {
          console.warn('Error loading Marathon game icon:', error)
        }
      }
    }
  }
}

// Font loading for Marathon theme
const loadFonts = async (): Promise<void> => {
  await Promise.all([
    document.fonts.load('bold 42px "AUTOMATA"'), // For model name
    document.fonts.load('400 28px "Audiowide"'), // For game name (increased from 24px)
    document.fonts.load('400 24px "Audiowide"'), // For collection name (increased from 20px)
    document.fonts.load('400 22px "Audiowide"'), // For painted date (increased from 18px)
    document.fonts.load('400 20px "Audiowide"')  // For user name (increased from 16px)
  ])
}

export const marathon: Theme = {
  id: 'marathon',
  name: 'Marathon',
  
  colors: {
    gradientColor: '46, 70, 80', // Previous Marathon green color #2E4650
    borderColor: 'rgba(46, 70, 80, 1)'
  },
  
  fonts: {
    titleFont: 'bold 42px "AUTOMATA", Arial, sans-serif', // For model name (unchanged)
    bodyFont: '28px "Audiowide", Arial, sans-serif',      // For game name (increased from 24px)
    smallFont: '24px "Audiowide", Arial, sans-serif',     // For collection name (increased from 20px)
    tinyFont: '20px "Audiowide", Arial, sans-serif'       // For user name (increased from 16px)
  },
  
  renderOptions: {
    renderStandardLayout: renderMarathonLayout,
    customTextPosition: true, // Marathon uses custom positioning
    loadFonts,
    visualOverlays: [
      // Hexagonal grid pattern reminiscent of Halo tech
      createPatternOverlay(
        'marathon-hex-grid',
        'grid',
        120,
        'rgba(46, 70, 80, 0.3)',
        0.06,
        true
      ),
      // UNSC-style angular decorations in corners
      createSymbolOverlay(
        'marathon-unsc-symbol',
        'unsc-emblem',
        { x: 'left', y: 'top' },
        { width: 80, height: 80 },
        'rgba(46, 70, 80, 0.5)',
        0.2,
        true,
        // Custom UNSC-style emblem renderer
        (context, overlay) => {
          const { ctx, canvas, overlayOpacity = 1 } = context
          const pos = { x: 40, y: 40 }
          
          const finalOpacity = overlay.opacity * overlayOpacity
          ctx.globalAlpha = finalOpacity
          ctx.strokeStyle = 'rgba(46, 70, 80, 0.8)'
          ctx.fillStyle = 'rgba(46, 70, 80, 0.3)'
          ctx.lineWidth = 2
          
          ctx.save()
          ctx.translate(pos.x + 40, pos.y + 40)
          
          // Draw angular, sci-fi emblem
          ctx.beginPath()
          // Outer ring
          ctx.arc(0, 0, 30, 0, 2 * Math.PI)
          ctx.stroke()
          
          // Inner angular design
          ctx.beginPath()
          ctx.moveTo(-20, -10)
          ctx.lineTo(0, -25)
          ctx.lineTo(20, -10)
          ctx.lineTo(20, 10)
          ctx.lineTo(0, 25)
          ctx.lineTo(-20, 10)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          
          // Central details
          ctx.beginPath()
          ctx.moveTo(-12, 0)
          ctx.lineTo(12, 0)
          ctx.moveTo(0, -12)
          ctx.lineTo(0, 12)
          ctx.stroke()
          
          ctx.restore()
          ctx.globalAlpha = 1
        }
      )
    ]
  },
  
  isDefault: false,
  isVisible: true,

  metadata: {
    description: 'Marathon theme inspired by Noble Team unit cards with top-right unit name and bottom info',
    tags: ['marathon', 'halo', 'noble-team', 'sci-fi']
  }
}