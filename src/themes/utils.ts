import { ThemeRenderContext, ThemeFonts } from './types'
import { formatLocalDate } from '../utils/timezone'
import { getLegacyFontString, getThemeFontStyle, transformText, getFontConfig } from './fontUtils'

export const renderStandardTextLayout = (context: ThemeRenderContext, themeFonts?: ThemeFonts): number => {
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
  // For battles, show result instead of username
  // Only show username if we have a userPublicName or display_name (no email fallback)
  const isBattle = !model.box && model.battle_result !== undefined
  let displayText = ''

  console.log('Battle detection debug:', {
    isBattle,
    'model.box': model.box,
    'model.battle_result': model.battle_result,
    'model.opponent_name': model.opponent_name,
    'typeof model.box': typeof model.box,
    'model.box === null': model.box === null,
    'model.box === undefined': model.box === undefined
  })

  if (isBattle && model.battle_result) {
    // For battles, show the winner or draw
    const result = model.battle_result.toLowerCase()
    if (result.includes('draw') || result.includes('tie')) {
      displayText = 'Draw'
    } else if (result.includes('i won') || result.includes('win')) {
      // User won - use their name if available, otherwise "I won"
      if (userPublicName && userPublicName.trim()) {
        displayText = `${userPublicName.trim()} won`
      } else if (user?.user_metadata?.display_name && user.user_metadata.display_name.trim()) {
        displayText = `${user.user_metadata.display_name.trim()} won`
      } else {
        displayText = 'I won'
      }
    } else if (model.opponent_name) {
      // Opponent won
      displayText = `${model.opponent_name} won`
    } else {
      displayText = 'Loss'
    }
  } else if (userPublicName || user?.user_metadata?.display_name) {
    // For models/collections, show artist name
    // Prioritize userPublicName (which should be the user's chosen public name)
    let displayName = 'Unknown User'

    if (userPublicName && userPublicName.trim()) {
      // Use the user's public name if available and not empty
      displayName = userPublicName.trim()
    } else if (user?.user_metadata?.display_name && user.user_metadata.display_name.trim()) {
      // Fallback to display name from user metadata
      displayName = user.user_metadata.display_name.trim()
    }

    displayText = `by ${displayName}`
  }

  if (displayText) {
    
    console.log('Share screenshot username debug:', {
      userPublicName,
      displayName: user?.user_metadata?.display_name,
      email: user?.email,
      finalDisplayName: displayName,
      finalDisplayText: displayText
    })
    
    // Set font for user name (use tiny font)
    ctx.font = getThemeFontStyle('tiny', themeFonts)
    ctx.textAlign = textAlign as CanvasTextAlign

    // Apply text transforms based on font configuration
    const tinyFontConfig = getFontConfig('tiny', themeFonts)
    const transformedText = transformText(displayText, tinyFontConfig)

    // Draw text with drop shadow
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = quaternaryColor
    ctx.fillText(transformedText, textX, currentY)
    
    // Reset shadow for next elements
    ctx.shadowColor = 'transparent'
    currentY -= 35
  }

  // Painted/Played date - with drop shadow (only if enabled)
  if (showPaintedDate && model.painted_date) {
    const formattedDate = formatLocalDate(model.painted_date, {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    // For battles, show "Played on [date]", for models show "Painted [date]"
    const isBattleForDate = !model.box && model.battle_result !== undefined
    const dateText = isBattleForDate ? `Played on ${formattedDate}` : `Painted ${formattedDate}`

    console.log('Date text debug:', {
      isBattle,
      isBattleForDate,
      showPaintedDate,
      'model.painted_date': model.painted_date,
      'model.box': model.box,
      'model.battle_result': model.battle_result,
      dateText
    })

    // Set font for painted date (use small font)
    ctx.font = getThemeFontStyle('small', themeFonts)
    ctx.textAlign = textAlign as CanvasTextAlign

    // Apply text transforms based on font configuration
    const smallFontConfig = getFontConfig('small', themeFonts)
    const transformedDateText = transformText(dateText, smallFontConfig)

    // Draw text with drop shadow
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = tertiaryColor
    ctx.fillText(transformedDateText, textX, currentY)
    
    // Reset shadow for next elements
    ctx.shadowColor = 'transparent'
    currentY -= 40
  }

  // Collection name - with drop shadow (only if enabled)
  if (showCollectionName && model.box?.name) {
    const collectionText = model.box.name

    // Set font for collection name (use body font)
    ctx.font = getThemeFontStyle('body', themeFonts)
    ctx.textAlign = textAlign as CanvasTextAlign

    // Apply text transforms based on font configuration
    const bodyFontConfig = getFontConfig('body', themeFonts)
    const transformedCollectionText = transformText(collectionText, bodyFontConfig)

    // Draw text with drop shadow
    ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.fillStyle = secondaryColor
    ctx.fillText(transformedCollectionText, textX, currentY)
    
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
      ctx.font = getThemeFontStyle('small', themeFonts)
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
        
        // Load and draw the actual game icon
        const iconImg = new Image()
        iconImg.crossOrigin = 'anonymous'

        iconImg.onload = () => {
          ctx.save()
          ctx.shadowColor = 'transparent'

          let iconX, iconY
          if (textAlign === 'right') {
            // For right-aligned text, icon goes to the right of the game name
            // First measure the text width
            ctx.font = getThemeFontStyle('small', themeFonts)
            const smallFontConfig = getFontConfig('small', themeFonts)
            const transformedGameName = transformText(gameName, smallFontConfig)
            const textWidth = ctx.measureText(transformedGameName).width
            iconX = gameTextX + textWidth + iconPadding // Icon positioned after the game name text
          } else {
            // For left-aligned text, icon goes to the left of the game name
            iconX = textX
          }

          iconY = currentY - iconSize + 4 // Vertically center with text baseline

          // Draw the actual game icon
          ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize)
          ctx.restore()
        }

        iconImg.onerror = () => {
          console.warn('Failed to load game icon:', gameIcon)
        }

        iconImg.src = gameIcon
      }

      // Draw game name with drop shadow
      ctx.font = getThemeFontStyle('small', themeFonts)
      ctx.textAlign = textAlign as CanvasTextAlign

      // Apply text transforms based on font configuration
      const smallFontConfig = getFontConfig('small', themeFonts)
      const transformedGameName = transformText(gameName, smallFontConfig)

      ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
      ctx.shadowBlur = 8
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillStyle = tertiaryColor
      ctx.fillText(transformedGameName, gameTextX, currentY)
      
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
  themeFonts?: ThemeFonts
): void => {
  const { ctx, model, shadowOpacity, textPosition, isDarkText } = context
  
  const primaryColor = isDarkText ? '#000000' : '#ffffff'
  const padding = 40
  const textX = textPosition === 'bottom-right' ? context.canvas.width - padding : padding
  const textAlign = textPosition === 'bottom-right' ? 'right' : 'left'

  // Model name (top) - use theme title font for the main title with drop shadow
  const modelNameText = model.name
  ctx.font = getThemeFontStyle('title', themeFonts)
  ctx.textAlign = textAlign as CanvasTextAlign

  // Apply text transforms based on font configuration
  const titleFontConfig = getFontConfig('title', themeFonts)
  const transformedModelName = transformText(modelNameText, titleFontConfig)

  // Draw model name with drop shadow
  ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity})`
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillStyle = primaryColor
  ctx.fillText(transformedModelName, textX, currentY)
  
  // Reset shadow for next elements
  ctx.shadowColor = 'transparent'
}