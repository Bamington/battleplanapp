import { ThemeRenderContext } from './types'
import { formatLocalDate } from '../utils/timezone'

export const renderStandardTextLayout = (context: ThemeRenderContext, fonts?: { 
  titleFont: string
  bodyFont: string 
  smallFont: string
  tinyFont: string 
}): number => {
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

  // Text colors based on switch - use pure black or white for all text
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const secondaryColor = isDarkText ? '#000000' : '#ffffff'
  const tertiaryColor = isDarkText ? '#000000' : '#ffffff'
  const quaternaryColor = isDarkText ? '#000000' : '#ffffff'

  // Text positioning based on user selection
  const padding = 40
  const textX = textPosition === 'bottom-right' ? canvas.width - padding : padding
  const textAlign = textPosition === 'bottom-right' ? 'right' : 'left'
  let currentY = canvas.height - padding

  // User's public name (bottom) - with drop shadow
  // Only show username if we have a userPublicName or display_name (no email fallback)
  if (userPublicName || user?.user_metadata?.display_name) {
    // Prioritize userPublicName (which should be the user's chosen public name)
    let displayName = 'Unknown User'
    
    if (userPublicName && userPublicName.trim()) {
      // Use the user's public name if available and not empty
      displayName = userPublicName.trim()
    } else if (user?.user_metadata?.display_name && user.user_metadata.display_name.trim()) {
      // Fallback to display name from user metadata
      displayName = user.user_metadata.display_name.trim()
    }
    
    const displayText = `by ${displayName}`
    
    console.log('Share screenshot username debug:', {
      userPublicName,
      displayName: user?.user_metadata?.display_name,
      email: user?.email,
      finalDisplayName: displayName,
      finalDisplayText: displayText
    })
    
    // Set font for user name (use tiny font)
    ctx.font = fonts?.tinyFont || '24px Overpass, sans-serif'
    ctx.textAlign = textAlign as CanvasTextAlign
    
    // Draw text with drop shadow
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = quaternaryColor
    ctx.fillText(displayText, textX, currentY)
    
    // Reset shadow for next elements
    ctx.shadowColor = 'transparent'
    currentY -= 35
  }

  // Painted date - with drop shadow (only if enabled)
  if (showPaintedDate && model.painted_date) {
    const formattedDate = formatLocalDate(model.painted_date, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    const dateText = `Painted ${formattedDate}`
    
    // Set font for painted date (use small font)
    ctx.font = fonts?.smallFont || '28px Overpass, sans-serif'
    ctx.textAlign = textAlign as CanvasTextAlign
    
    // Draw text with drop shadow
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = tertiaryColor
    ctx.fillText(dateText, textX, currentY)
    
    // Reset shadow for next elements
    ctx.shadowColor = 'transparent'
    currentY -= 40
  }

  // Collection name - with drop shadow (only if enabled)
  if (showCollectionName && model.box?.name) {
    const collectionText = model.box.name
    
    // Set font for collection name (use body font)
    ctx.font = fonts?.bodyFont || '32px Overpass, sans-serif'
    ctx.textAlign = textAlign as CanvasTextAlign
    
    // Draw text with drop shadow
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = secondaryColor
    ctx.fillText(collectionText, textX, currentY)
    
    // Reset shadow for next elements
    ctx.shadowColor = 'transparent'
    currentY -= 45
  }

  // Game name and icon - below collection name (only if enabled)
  const gameName = model.box?.game?.name || model.game?.name
  const gameIcon = model.box?.game?.icon || model.game?.icon
  
  // Debug logging to understand what data is available
  console.log('Game details debug:', {
    showGameDetails,
    gameName,
    gameIcon,
    'model.box?.game': model.box?.game,
    'model.game': model.game,
    'model.box': model.box
  })
  
  if (showGameDetails && gameName) {
    console.log('Inside showGameDetails condition, about to render game details')
    try {
      // Set font for game name (use small font)
      ctx.font = fonts?.smallFont || '28px Overpass, sans-serif'
      ctx.textAlign = textAlign as CanvasTextAlign
      
      // Handle game icon and text positioning
      const gameIcon = model.box?.game?.icon || model.game?.icon
      let gameTextX = textX
      
      console.log('Game icon check:', { gameIcon, hasIcon: !!gameIcon })
      
      // If we have a game icon, adjust text positioning but draw a placeholder for now
      if (gameIcon) {
        console.log('About to draw red placeholder circle')
        const iconSize = 24 // 24px icon size
        const iconPadding = 8 // 8px space between icon and text
        
        // Pre-calculate text positioning for icon spacing
        if (textAlign === 'right') {
          gameTextX = textX - iconSize - iconPadding // Move text left to make room for icon
        } else {
          gameTextX = textX + iconSize + iconPadding // Text position for left alignment
        }
        
        // Draw a simple placeholder circle where the icon should be for debugging
        ctx.save()
        ctx.shadowColor = 'transparent'
        
        let iconX, iconY
        if (textAlign === 'right') {
          // For right-aligned text, icon goes to the right of the game name
          // First measure the text width
          ctx.font = fonts?.smallFont || '28px Overpass, sans-serif'
          const textWidth = ctx.measureText(gameName).width
          iconX = gameTextX + textWidth + iconPadding // Icon positioned after the game name text
        } else {
          // For left-aligned text, icon goes to the left of the game name
          iconX = textX
        }
        
        iconY = currentY - iconSize + 4 // Vertically center with text baseline
        
        console.log('Circle position:', { iconX, iconY, iconSize, currentY, canvas: { width: context.canvas.width, height: context.canvas.height } })
        
        // Draw a much larger, more visible placeholder circle
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)' // More opaque red circle
        ctx.beginPath()
        const circleRadius = 20 // Make it bigger and more visible
        ctx.arc(iconX + iconSize/2, iconY + iconSize/2, circleRadius, 0, 2 * Math.PI)
        ctx.fill()
        
        // Also draw a bright green border around it
        ctx.strokeStyle = 'rgba(0, 255, 0, 1)' // Bright green border
        ctx.lineWidth = 3
        ctx.stroke()
        
        ctx.restore()
      }

      // Draw game name with drop shadow
      ctx.font = fonts?.smallFont || '28px Overpass, sans-serif'
      ctx.textAlign = textAlign as CanvasTextAlign
      ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillStyle = tertiaryColor
      ctx.fillText(gameName, gameTextX, currentY)
      
      // Reset shadow for next elements
      ctx.shadowColor = 'transparent'
      
      currentY -= 35
    } catch (error) {
      console.warn('Error rendering game details:', error)
      currentY -= 35
    }
  }

  // Return the current Y position for model name rendering
  return currentY
}

export const renderStandardModelName = (
  context: ThemeRenderContext, 
  currentY: number, 
  fonts: { titleFont: string }
): void => {
  const { ctx, model, shadowOpacity, textPosition, isDarkText } = context
  
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const padding = 40
  const textX = textPosition === 'bottom-right' ? context.canvas.width - padding : padding
  const textAlign = textPosition === 'bottom-right' ? 'right' : 'left'

  // Model name (top) - use theme title font for the main title with drop shadow
  const modelNameText = model.name
  ctx.font = fonts.titleFont
  ctx.textAlign = textAlign as CanvasTextAlign
  
  // Draw model name with drop shadow
  ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillStyle = primaryColor
  ctx.fillText(modelNameText, textX, currentY)
  
  // Reset shadow for next elements
  ctx.shadowColor = 'transparent'
}