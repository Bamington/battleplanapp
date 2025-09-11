import { ThemeRenderContext, ThemeVisualOverlay } from './types'

/**
 * Utility functions for creating common visual overlay patterns
 */

/**
 * Helper function to resolve position values
 */
export const resolvePosition = (
  canvas: HTMLCanvasElement,
  position: { x: number | string; y: number | string },
  size: { width: number | string; height: number | string }
): { x: number; y: number } => {
  const resolveValue = (value: number | string, dimension: 'width' | 'height') => {
    if (typeof value === 'number') return value
    
    if (value === 'center') {
      const canvasDim = dimension === 'width' ? canvas.width : canvas.height
      const sizeDim = typeof size[dimension] === 'string' 
        ? parseFloat(size[dimension] as string) / 100 * canvasDim // percentage
        : size[dimension] as number
      return (canvasDim - sizeDim) / 2
    }
    
    if (value === 'left' || value === 'top') return 0
    if (value === 'right') return canvas.width - (typeof size.width === 'string' ? parseFloat(size.width) / 100 * canvas.width : size.width as number)
    if (value === 'bottom') return canvas.height - (typeof size.height === 'string' ? parseFloat(size.height) / 100 * canvas.height : size.height as number)
    
    // Handle percentage strings
    if (typeof value === 'string' && value.endsWith('%')) {
      const percentage = parseFloat(value) / 100
      return dimension === 'width' ? canvas.width * percentage : canvas.height * percentage
    }
    
    return 0
  }

  return {
    x: resolveValue(position.x, 'width'),
    y: resolveValue(position.y, 'height')
  }
}

/**
 * Helper function to resolve size values
 */
export const resolveSize = (
  canvas: HTMLCanvasElement,
  size: { width: number | string; height: number | string }
): { width: number; height: number } => {
  const resolveValue = (value: number | string, dimension: 'width' | 'height') => {
    if (typeof value === 'number') return value
    
    if (typeof value === 'string' && value.endsWith('%')) {
      const percentage = parseFloat(value) / 100
      return dimension === 'width' ? canvas.width * percentage : canvas.height * percentage
    }
    
    return parseInt(value as string) || 0
  }

  return {
    width: resolveValue(size.width, 'width'),
    height: resolveValue(size.height, 'height')
  }
}

/**
 * Creates a geometric shape overlay
 */
export const createShapeOverlay = (
  id: string,
  shapeType: 'circle' | 'rectangle' | 'triangle' | 'hexagon',
  position: { x: number | string; y: number | string },
  size: { width: number | string; height: number | string },
  color: string,
  opacity: number = 0.3,
  enabled: boolean = true
): ThemeVisualOverlay => ({
  id,
  type: 'shape',
  position,
  size,
  opacity,
  enabled,
  render: (context: ThemeRenderContext, overlay: ThemeVisualOverlay) => {
    const { ctx, canvas, overlayOpacity = 1 } = context
    const pos = resolvePosition(canvas, overlay.position, overlay.size)
    const resolvedSize = resolveSize(canvas, overlay.size)
    
    const finalOpacity = overlay.opacity * overlayOpacity
    ctx.globalAlpha = finalOpacity
    ctx.fillStyle = color
    
    ctx.save()
    ctx.translate(pos.x + resolvedSize.width / 2, pos.y + resolvedSize.height / 2)
    
    ctx.beginPath()
    switch (shapeType) {
      case 'circle':
        ctx.arc(0, 0, Math.min(resolvedSize.width, resolvedSize.height) / 2, 0, 2 * Math.PI)
        break
      case 'rectangle':
        ctx.rect(-resolvedSize.width / 2, -resolvedSize.height / 2, resolvedSize.width, resolvedSize.height)
        break
      case 'triangle':
        ctx.moveTo(0, -resolvedSize.height / 2)
        ctx.lineTo(-resolvedSize.width / 2, resolvedSize.height / 2)
        ctx.lineTo(resolvedSize.width / 2, resolvedSize.height / 2)
        ctx.closePath()
        break
      case 'hexagon':
        const hexRadius = Math.min(resolvedSize.width, resolvedSize.height) / 2
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3
          const x = hexRadius * Math.cos(angle)
          const y = hexRadius * Math.sin(angle)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        break
    }
    ctx.fill()
    ctx.restore()
    ctx.globalAlpha = 1
  }
})

/**
 * Creates a pattern overlay (dots, lines, etc.)
 */
export const createPatternOverlay = (
  id: string,
  patternType: 'dots' | 'lines' | 'grid' | 'diagonal',
  spacing: number,
  color: string,
  opacity: number = 0.15,
  enabled: boolean = true
): ThemeVisualOverlay => ({
  id,
  type: 'pattern',
  position: { x: 0, y: 0 },
  size: { width: '100%', height: '100%' },
  opacity,
  enabled,
  blendMode: 'multiply',
  render: (context: ThemeRenderContext, overlay: ThemeVisualOverlay) => {
    const { ctx, canvas, overlayOpacity = 1 } = context
    
    const finalOpacity = overlay.opacity * overlayOpacity
    ctx.globalAlpha = finalOpacity
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1
    
    if (overlay.blendMode) {
      ctx.globalCompositeOperation = overlay.blendMode
    }
    
    switch (patternType) {
      case 'dots':
        for (let x = spacing; x < canvas.width; x += spacing) {
          for (let y = spacing; y < canvas.height; y += spacing) {
            ctx.beginPath()
            ctx.arc(x, y, 2, 0, 2 * Math.PI)
            ctx.fill()
          }
        }
        break
        
      case 'lines':
        ctx.beginPath()
        for (let y = spacing; y < canvas.height; y += spacing) {
          ctx.moveTo(0, y)
          ctx.lineTo(canvas.width, y)
        }
        ctx.stroke()
        break
        
      case 'grid':
        ctx.beginPath()
        for (let x = spacing; x < canvas.width; x += spacing) {
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvas.height)
        }
        for (let y = spacing; y < canvas.height; y += spacing) {
          ctx.moveTo(0, y)
          ctx.lineTo(canvas.width, y)
        }
        ctx.stroke()
        break
        
      case 'diagonal':
        ctx.beginPath()
        for (let offset = -canvas.height; offset < canvas.width + canvas.height; offset += spacing) {
          ctx.moveTo(offset, 0)
          ctx.lineTo(offset + canvas.height, canvas.height)
        }
        ctx.stroke()
        break
    }
    
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }
})

/**
 * Creates a corner decoration overlay
 */
export const createCornerDecorationOverlay = (
  id: string,
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
  decorationType: 'flourish' | 'geometric' | 'organic',
  size: number,
  color: string,
  opacity: number = 0.6,
  enabled: boolean = true
): ThemeVisualOverlay => {
  const getPosition = (corner: string, size: number) => {
    switch (corner) {
      case 'top-left': return { x: 20, y: 20 }
      case 'top-right': return { x: `calc(100% - ${size + 20}px)`, y: 20 }
      case 'bottom-left': return { x: 20, y: `calc(100% - ${size + 20}px)` }
      case 'bottom-right': return { x: `calc(100% - ${size + 20}px)`, y: `calc(100% - ${size + 20}px)` }
      default: return { x: 20, y: 20 }
    }
  }

  return {
    id,
    type: 'decoration',
    position: getPosition(corner, size),
    size: { width: size, height: size },
    opacity,
    enabled,
    render: (context: ThemeRenderContext, overlay: ThemeVisualOverlay) => {
      const { ctx, canvas, overlayOpacity = 1 } = context
      const pos = resolvePosition(canvas, overlay.position, overlay.size)
      const resolvedSize = resolveSize(canvas, overlay.size)
      
      const finalOpacity = overlay.opacity * overlayOpacity
      ctx.globalAlpha = finalOpacity
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2
      
      ctx.save()
      ctx.translate(pos.x, pos.y)
      
      // Draw different decoration types
      switch (decorationType) {
        case 'flourish':
          // Draw ornate corner flourish
          ctx.beginPath()
          ctx.moveTo(0, resolvedSize.height / 2)
          ctx.quadraticCurveTo(resolvedSize.width / 4, 0, resolvedSize.width / 2, resolvedSize.height / 4)
          ctx.quadraticCurveTo(resolvedSize.width, resolvedSize.height / 2, resolvedSize.width / 2, resolvedSize.height)
          ctx.stroke()
          break
          
        case 'geometric':
          // Draw geometric corner pattern
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(resolvedSize.width, 0)
          ctx.lineTo(resolvedSize.width, resolvedSize.height)
          ctx.moveTo(0, 0)
          ctx.lineTo(resolvedSize.width / 2, resolvedSize.height / 2)
          ctx.moveTo(resolvedSize.width, 0)
          ctx.lineTo(resolvedSize.width / 2, resolvedSize.height / 2)
          ctx.stroke()
          break
          
        case 'organic':
          // Draw organic flowing pattern
          ctx.beginPath()
          ctx.moveTo(0, resolvedSize.height)
          ctx.bezierCurveTo(
            resolvedSize.width / 3, resolvedSize.height * 0.7,
            resolvedSize.width * 0.7, resolvedSize.height / 3,
            resolvedSize.width, 0
          )
          ctx.stroke()
          break
      }
      
      ctx.restore()
      ctx.globalAlpha = 1
    }
  }
}

/**
 * Creates a symbol overlay (game-specific symbols)
 */
export const createSymbolOverlay = (
  id: string,
  symbolType: string,
  position: { x: number | string; y: number | string },
  size: { width: number | string; height: number | string },
  color: string,
  opacity: number = 0.4,
  enabled: boolean = true,
  customRenderer?: (context: ThemeRenderContext, overlay: ThemeVisualOverlay) => void
): ThemeVisualOverlay => ({
  id,
  type: 'symbol',
  position,
  size,
  opacity,
  enabled,
  render: customRenderer || ((context: ThemeRenderContext, overlay: ThemeVisualOverlay) => {
    const { ctx, canvas, overlayOpacity = 1 } = context
    const pos = resolvePosition(canvas, overlay.position, overlay.size)
    const resolvedSize = resolveSize(canvas, overlay.size)
    
    const finalOpacity = overlay.opacity * overlayOpacity
    ctx.globalAlpha = finalOpacity
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 3
    
    ctx.save()
    ctx.translate(pos.x + resolvedSize.width / 2, pos.y + resolvedSize.height / 2)
    
    // Default symbol rendering (placeholder)
    ctx.beginPath()
    ctx.arc(0, 0, Math.min(resolvedSize.width, resolvedSize.height) / 4, 0, 2 * Math.PI)
    ctx.stroke()
    
    ctx.restore()
    ctx.globalAlpha = 1
  })
})