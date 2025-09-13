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

  // Extend canvas height for grey bar and draw it
  const originalHeight = canvas.height
  const barHeight = 130 // 30% larger than original 100px
  const newHeight = originalHeight + barHeight
  
  // Create temporary canvas to preserve existing content
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
  
  // Draw grey bar below the original image
  ctx.fillStyle = '#2B2827'
  ctx.fillRect(0, originalHeight, canvas.width, barHeight)

  // Text colors based on switch - use pure black or white for all text
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const secondaryColor = isDarkText ? '#000000' : '#ffffff'
  const tertiaryColor = isDarkText ? '#000000' : '#ffffff'
  const quaternaryColor = isDarkText ? '#000000' : '#ffffff'

  const padding = 40
  const leftX = padding
  const rightX = canvas.width - padding
  
  // Calculate text content heights for vertical centering
  let leftSideHeight = 58 // Model name height (58px font)
  let rightSideHeight = 0
  
  if (showGameDetails && (model.box?.game?.name || model.game?.name)) {
    leftSideHeight += 10 + 32 // 10px gap + game name height (32px font)
  }
  
  // Calculate right side content
  if (userPublicName || context.user?.user_metadata?.display_name) {
    rightSideHeight += 24 // User name height (24px font)
  }
  if (showPaintedDate && model.painted_date) {
    rightSideHeight += (rightSideHeight > 0 ? 35 : 0) + 28 // Gap + painted date height
  }
  if (showCollectionName && model.box?.name) {
    rightSideHeight += (rightSideHeight > 0 ? 40 : 0) + 32 // Gap + collection height
  }
  
  // Calculate vertical centering within grey bar (130px)
  const greyBarCenter = originalHeight + (barHeight / 2) // Center of grey bar
  const leftStartY = greyBarCenter + (leftSideHeight / 2) // Start from bottom of left content
  const rightStartY = greyBarCenter + (rightSideHeight / 2) // Start from bottom of right content
  
  let leftY = leftStartY
  let rightY = rightStartY

  // LEFT SIDE - Model name and game
  
  // Model name in uppercase (bottom left)
  const modelNameText = model.name.toUpperCase()
  ctx.font = 'bold 58px "Conduit ITC", Arvo, serif'
  ctx.textAlign = 'left'
  
  // Draw model name with drop shadow
  ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillStyle = primaryColor
  ctx.fillText(modelNameText, leftX, leftY)
  
  // Reset shadow
  ctx.shadowColor = 'transparent'
  leftY -= 65 // Move up for next element

  // Game name (below model name on left)
  const gameName = model.box?.game?.name || model.game?.name
  if (showGameDetails && gameName) {
    // Handle game icon and text positioning
    const gameIcon = model.box?.game?.icon || model.game?.icon
    let gameTextX = leftX
    
    // If we have a game icon, render it first and adjust text position
    if (gameIcon) {
      const iconSize = 28 // Slightly larger icon for Kill Team theme
      const iconPadding = 10 // More padding for Kill Team
      
      try {
        const iconImg = new Image()
        iconImg.crossOrigin = 'anonymous'
        
        iconImg.onload = () => {
          // For left-aligned text, icon goes to the left
          const iconX = leftX
          const iconY = leftY - iconSize + 6 // Vertically center with text baseline
          gameTextX = leftX + iconSize + iconPadding // Adjust text position
          
          // Draw the icon
          ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
        }
        iconImg.onerror = () => {
          // If icon fails to load, just continue without it
          console.warn('Kill Team game icon failed to load:', gameIcon)
        }
        iconImg.src = gameIcon
        
        // Adjust text position for icon (even if it hasn't loaded yet)
        gameTextX = leftX + iconSize + iconPadding
      } catch (error) {
        console.warn('Error loading Kill Team game icon:', error)
      }
    }

    ctx.font = 'bold 32px "Conduit ITC", Overpass, sans-serif'
    ctx.textAlign = 'left'
    
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = secondaryColor
    ctx.fillText(gameName, gameTextX, leftY)
    
    ctx.shadowColor = 'transparent'
  }

  // RIGHT SIDE - Other information

  // User's public name (bottom right)
  if (userPublicName || context.user?.user_metadata?.display_name) {
    let displayName = 'Unknown User'
    
    if (userPublicName && userPublicName.trim()) {
      displayName = userPublicName.trim()
    } else if (context.user?.user_metadata?.display_name && context.user.user_metadata.display_name.trim()) {
      displayName = context.user.user_metadata.display_name.trim()
    }
    
    const displayText = `by ${displayName}`
    
    ctx.font = '24px "Conduit ITC", Overpass, sans-serif'
    ctx.textAlign = 'right'
    
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = quaternaryColor
    ctx.fillText(displayText, rightX, rightY)
    
    ctx.shadowColor = 'transparent'
    rightY -= 35
  }

  // Painted date (right side)
  if (showPaintedDate && model.painted_date) {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(model.painted_date))
    const dateText = `Painted ${formattedDate}`
    
    ctx.font = '28px "Conduit ITC", Overpass, sans-serif'
    ctx.textAlign = 'right'
    
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = tertiaryColor
    ctx.fillText(dateText, rightX, rightY)
    
    ctx.shadowColor = 'transparent'
    rightY -= 40
  }

  // Collection name (right side)
  if (showCollectionName && model.box?.name) {
    ctx.font = '32px "Conduit ITC", Overpass, sans-serif'
    ctx.textAlign = 'right'
    
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = secondaryColor
    ctx.fillText(model.box.name, rightX, rightY)
    
    ctx.shadowColor = 'transparent'
  }
}

// Font loading for Conduit ITC
const loadFonts = async (): Promise<void> => {
  await document.fonts.load('58px "Conduit ITC"')
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
  
  metadata: {
    description: 'Kill Team theme with bold Conduit ITC typography and uppercase model names',
    tags: ['kill-team', 'tactical', 'custom-font', 'uppercase']
  }
}