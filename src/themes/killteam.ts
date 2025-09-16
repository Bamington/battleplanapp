import { Theme, ThemeRenderContext } from './types'
import { renderStandardTextLayout, renderStandardModelName } from './utils'
import { createPatternOverlay, createSymbolOverlay, createCornerDecorationOverlay } from './overlayUtils'

// Custom Kill Team layout with model name and game on left, other info on right
const renderKillTeamLayout = async (context: ThemeRenderContext): Promise<void> => {
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

  // First, render text to measure actual content dimensions
  const padding = 40
  let textElements: Array<{
    text: string
    font: string
    x: number
    y: number
    align: CanvasTextAlign
    color: string
  }> = []
  
  // Measure text content and collect elements
  let leftY = 0
  let rightY = 0
  let minX = canvas.width
  let maxX = 0
  let minY = Infinity
  let maxY = 0

  // Text colors based on switch - use pure black or white for all text
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const secondaryColor = isDarkText ? '#000000' : '#ffffff'
  const tertiaryColor = isDarkText ? '#000000' : '#ffffff'
  const quaternaryColor = isDarkText ? '#000000' : '#ffffff'

  // Start with temporary positioning at bottom of current canvas
  const originalHeight = canvas.height
  const leftX = padding
  const rightX = canvas.width - padding
  let tempLeftY = originalHeight + 100 // Temporary position for measurement
  let tempRightY = originalHeight + 100
  
  // Collect text elements for measurement
  
  // LEFT SIDE - Model name and game
  const modelNameText = model.name.toUpperCase()
  ctx.font = 'bold 58px "Conduit ITC", Arvo, serif'
  const modelMetrics = ctx.measureText(modelNameText)
  const modelHeight = Math.abs(modelMetrics.actualBoundingBoxAscent || 58) + Math.abs(modelMetrics.actualBoundingBoxDescent || 0)
  
  textElements.push({
    text: modelNameText,
    font: 'bold 58px "Conduit ITC", Arvo, serif',
    x: leftX,
    y: tempLeftY,
    align: 'left',
    color: primaryColor
  })
  
  // Update bounds
  minX = Math.min(minX, leftX)
  maxX = Math.max(maxX, leftX + modelMetrics.width)
  minY = Math.min(minY, tempLeftY - modelHeight)
  maxY = Math.max(maxY, tempLeftY)
  
  tempLeftY += 10 + 32 // Gap for next element
  
  // Game name (if shown)
  const gameName = model.box?.game?.name || model.game?.name
  if (showGameDetails && gameName) {
    ctx.font = 'bold 32px "Conduit ITC", Overpass, sans-serif'
    const gameMetrics = ctx.measureText(gameName)
    const gameHeight = Math.abs(gameMetrics.actualBoundingBoxAscent || 32) + Math.abs(gameMetrics.actualBoundingBoxDescent || 0)
    
    // Account for icon space
    const gameIcon = model.box?.game?.icon || model.game?.icon
    const iconOffset = gameIcon ? 38 : 0 // 28px icon + 10px padding
    
    textElements.push({
      text: gameName,
      font: 'bold 32px "Conduit ITC", Overpass, sans-serif',
      x: leftX + iconOffset,
      y: tempLeftY,
      align: 'left',
      color: secondaryColor
    })
    
    minX = Math.min(minX, leftX)
    maxX = Math.max(maxX, leftX + iconOffset + gameMetrics.width)
    minY = Math.min(minY, tempLeftY - gameHeight)
    maxY = Math.max(maxY, tempLeftY)
  }
  
  // RIGHT SIDE - Other information (build from top to bottom)
  
  // Collection name (top of right side)
  if (showCollectionName && model.box?.name) {
    ctx.font = '32px "Conduit ITC", Overpass, sans-serif'
    const collectionMetrics = ctx.measureText(model.box.name)
    const collectionHeight = Math.abs(collectionMetrics.actualBoundingBoxAscent || 32) + Math.abs(collectionMetrics.actualBoundingBoxDescent || 0)
    
    textElements.push({
      text: model.box.name,
      font: '32px "Conduit ITC", Overpass, sans-serif',
      x: rightX,
      y: tempRightY,
      align: 'right',
      color: secondaryColor
    })
    
    minX = Math.min(minX, rightX - collectionMetrics.width)
    maxX = Math.max(maxX, rightX)
    minY = Math.min(minY, tempRightY - collectionHeight)
    maxY = Math.max(maxY, tempRightY)
    
    tempRightY += 40 // Gap for next element
  }
  
  // Painted date
  if (showPaintedDate && model.painted_date) {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(model.painted_date))
    const dateText = `Painted ${formattedDate}`
    
    ctx.font = '28px "Conduit ITC", Overpass, sans-serif'
    const dateMetrics = ctx.measureText(dateText)
    const dateHeight = Math.abs(dateMetrics.actualBoundingBoxAscent || 28) + Math.abs(dateMetrics.actualBoundingBoxDescent || 0)
    
    textElements.push({
      text: dateText,
      font: '28px "Conduit ITC", Overpass, sans-serif',
      x: rightX,
      y: tempRightY,
      align: 'right',
      color: tertiaryColor
    })
    
    minX = Math.min(minX, rightX - dateMetrics.width)
    maxX = Math.max(maxX, rightX)
    minY = Math.min(minY, tempRightY - dateHeight)
    maxY = Math.max(maxY, tempRightY)
    
    tempRightY += 35 // Gap for next element
  }
  
  // User name (bottom of right side)
  if (userPublicName || context.user?.user_metadata?.display_name) {
    let displayName = 'Unknown User'
    if (userPublicName && userPublicName.trim()) {
      displayName = userPublicName.trim()
    } else if (context.user?.user_metadata?.display_name && context.user.user_metadata.display_name.trim()) {
      displayName = context.user.user_metadata.display_name.trim()
    }
    const displayText = `by ${displayName}`
    
    ctx.font = '24px "Conduit ITC", Overpass, sans-serif'
    const userMetrics = ctx.measureText(displayText)
    const userHeight = Math.abs(userMetrics.actualBoundingBoxAscent || 24) + Math.abs(userMetrics.actualBoundingBoxDescent || 0)
    
    textElements.push({
      text: displayText,
      font: '24px "Conduit ITC", Overpass, sans-serif',
      x: rightX,
      y: tempRightY,
      align: 'right',
      color: quaternaryColor
    })
    
    minX = Math.min(minX, rightX - userMetrics.width)
    maxX = Math.max(maxX, rightX)
    minY = Math.min(minY, tempRightY - userHeight)
    maxY = Math.max(maxY, tempRightY)
  }
  
  // Debug logging
  console.log('Kill Team container bounds:', { minX, maxX, minY, maxY, textElements: textElements.length })
  
  // Calculate container dimensions with padding - make it flush with edges
  const containerPadding = 30 // Inner padding for the text container
  
  let containerX, containerY, containerWidth, containerHeight
  
  // Make container flush with canvas edges
  containerX = 0
  containerWidth = canvas.width
  
  // Calculate height based on content bounds
  if (minY === Infinity || maxY === 0) {
    console.warn('Invalid bounds detected, using fallback height')
    containerHeight = 120
  } else {
    containerHeight = maxY - minY + (containerPadding * 2)
    console.log('Container dimensions:', { containerX, containerY: 0, containerWidth, containerHeight })
  }
  
  // Extend canvas to accommodate the container (flush with bottom of image)
  const newHeight = originalHeight + containerHeight
  
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
  
  // Draw the text container background (flush with bottom of image)
  const containerTop = originalHeight // Flush with image, no gap
  
  // Create linear gradient from left to right
  const gradient = ctx.createLinearGradient(containerX, containerTop, containerX + containerWidth, containerTop)
  gradient.addColorStop(0, '#08060B') // Left color - dark purple/black
  gradient.addColorStop(1, '#12181F') // Right color - dark blue/grey
  
  ctx.fillStyle = gradient
  ctx.fillRect(containerX, containerTop, containerWidth, containerHeight)
  
  // Draw top border using custom border color
  const borderHeight = 4
  ctx.fillStyle = context.customBorderColor || '#F15C22' // Use custom color or fallback to Kill Team orange
  ctx.fillRect(containerX, containerTop, containerWidth, borderHeight)
  
  // Adjust text positions to final locations
  const yOffset = containerTop + containerPadding - minY
  
  // Render all text elements with shadows
  textElements.forEach(element => {
    ctx.font = element.font
    ctx.textAlign = element.align
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = element.color
    ctx.fillText(element.text, element.x, element.y + yOffset)
    ctx.shadowColor = 'transparent'
  })
  
  // Handle game icon if present
  if (showGameDetails && gameName) {
    const gameIcon = model.box?.game?.icon || model.game?.icon
    if (gameIcon) {
      const iconSize = 28
      const iconPadding = 10
      
      try {
        const iconImg = new Image()
        iconImg.crossOrigin = 'anonymous'
        
        iconImg.onload = () => {
          // Find the game text element to position icon relative to it
          const gameElement = textElements.find(el => el.text === gameName)
          if (gameElement) {
            const iconY = gameElement.y + yOffset - iconSize + 6
            ctx.drawImage(iconImg, leftX, iconY, iconSize, iconSize)
          }
        }
        iconImg.onerror = () => console.warn('Kill Team game icon failed to load:', gameIcon)
        iconImg.src = gameIcon
      } catch (error) {
        console.warn('Error loading Kill Team game icon:', error)
      }
    }
  }

}

// Font loading for Conduit ITC
const loadFonts = async (): Promise<void> => {
  await Promise.all([
    document.fonts.load('bold 58px "Conduit ITC"'),
    document.fonts.load('bold 32px "Conduit ITC"'),
    document.fonts.load('28px "Conduit ITC"'),
    document.fonts.load('24px "Conduit ITC"')
  ])
}

export const killteam: Theme = {
  id: 'killteam',
  name: 'Kill Team',
  
  colors: {
    gradientColor: '241, 92, 34',
    borderColor: 'rgba(241, 92, 34, 1)'
  },
  
  fonts: {
    titleFont: 'bold 58px "Conduit ITC", Arvo, serif',
    bodyFont: 'bold 32px "Conduit ITC", Overpass, sans-serif',
    smallFont: '28px "Conduit ITC", Overpass, sans-serif',
    tinyFont: '24px "Conduit ITC", Overpass, sans-serif'
  },
  
  renderOptions: {
    renderStandardLayout: renderKillTeamLayout,
    customTextPosition: true,
    loadFonts,
    visualOverlays: [
      // Gothic pattern overlay reminiscent of Imperial architecture
      createPatternOverlay(
        'killteam-gothic-lines',
        'lines',
        40,
        'rgba(180, 160, 100, 0.4)',
        0.06,
        true
      ),
      // Imperial Aquila-inspired symbol
      createSymbolOverlay(
        'killteam-aquila',
        'imperial-eagle',
        { x: 'center', y: 'top' },
        { width: 120, height: 80 },
        'rgba(180, 160, 100, 0.8)',
        0.2,
        true,
        // Custom Imperial Eagle renderer
        (context, overlay) => {
          const { ctx, canvas, overlayOpacity = 1 } = context
          const pos = { x: canvas.width / 2, y: 60 }
          
          const finalOpacity = overlay.opacity * overlayOpacity
          ctx.globalAlpha = finalOpacity
          ctx.strokeStyle = 'rgba(180, 160, 100, 0.9)'
          ctx.fillStyle = 'rgba(180, 160, 100, 0.3)'
          ctx.lineWidth = 2
          
          ctx.save()
          ctx.translate(pos.x, pos.y)
          
          // Draw simplified Imperial Eagle/Aquila
          ctx.beginPath()
          // Eagle body
          ctx.ellipse(0, 0, 15, 25, 0, 0, 2 * Math.PI)
          ctx.fill()
          
          // Wings
          ctx.beginPath()
          ctx.moveTo(-15, -10)
          ctx.bezierCurveTo(-40, -20, -50, 0, -35, 15)
          ctx.bezierCurveTo(-25, 10, -15, 5, -15, -10)
          ctx.fill()
          
          ctx.beginPath()
          ctx.moveTo(15, -10)
          ctx.bezierCurveTo(40, -20, 50, 0, 35, 15)
          ctx.bezierCurveTo(25, 10, 15, 5, 15, -10)
          ctx.fill()
          
          // Head
          ctx.beginPath()
          ctx.arc(0, -25, 8, 0, 2 * Math.PI)
          ctx.fill()
          
          ctx.restore()
          ctx.globalAlpha = 1
        }
      ),
      // Corner purity seals
      createCornerDecorationOverlay(
        'killteam-purity-seal',
        'top-right',
        'organic',
        40,
        'rgba(180, 160, 100, 0.7)',
        0.4,
        true
      )
    ]
  },
  
  isDefault: false,
  isVisible: true,

  metadata: {
    description: 'Kill Team theme with bold Conduit ITC typography and uppercase model names',
    tags: ['kill-team', 'tactical', 'custom-font', 'uppercase']
  }
}