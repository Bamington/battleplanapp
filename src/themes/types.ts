export interface ThemeColors {
  gradientColor: string // RGB values as string "r, g, b"
  borderColor: string   // RGBA values as string "rgba(r, g, b, a)"
}

export interface ThemeFonts {
  titleFont: string
  bodyFont: string
  smallFont: string
  tinyFont: string
}

export interface ThemeRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  model: any // TODO: Type this properly
  user?: any
  userPublicName?: string | null
  shadowOpacity: number
  textPosition: 'bottom-right' | 'bottom-left'
  showPaintedDate: boolean
  showCollectionName: boolean
  showGameDetails: boolean
  isDarkText: boolean
  showVisualOverlays?: boolean
  overlayOpacity?: number
}

export interface ThemeVisualOverlay {
  id: string
  type: 'shape' | 'pattern' | 'texture' | 'frame' | 'decoration' | 'symbol'
  position: {
    x: number | 'center' | 'left' | 'right'
    y: number | 'center' | 'top' | 'bottom'
  }
  size: {
    width: number | string  // pixels or percentage
    height: number | string
  }
  opacity: number
  blendMode?: GlobalCompositeOperation
  enabled: boolean
  render: (context: ThemeRenderContext, overlay: ThemeVisualOverlay) => void
}

export interface ThemeRenderOptions {
  // Standard text rendering for most themes
  renderStandardLayout?: (context: ThemeRenderContext) => Promise<void>
  
  // Custom model name rendering (for special themes like Marathon)
  renderModelName?: (context: ThemeRenderContext) => void
  
  // Custom positioning logic
  customTextPosition?: boolean
  
  // Font loading logic
  loadFonts?: () => Promise<void>
  
  // Visual overlays system
  visualOverlays?: ThemeVisualOverlay[]
  
  // Future extensibility
  customComponents?: Array<{
    name: string
    render: (context: ThemeRenderContext) => void
  }>
}

export interface Theme {
  // Basic metadata
  id: string
  name: string
  
  // Visual properties
  colors: ThemeColors
  fonts: ThemeFonts
  
  // Rendering behavior
  renderOptions: ThemeRenderOptions
  
  // Theme editor properties
  isDefault: boolean
  
  // Future extensibility
  metadata?: {
    description?: string
    author?: string
    version?: string
    tags?: string[]
  }
}

export type ThemeId = 
  | 'battleplan' 
  | 'imperium' 
  | 'heroic' 
  | 'mini-myths' 
  | 'eternal' 
  | 'marathon' 
  | 'red-fog' 
  | 'dragonslayer' 
  | 'ringbearer' 
  | 'eightpoints' 
  | 'shatterpoint'
  | 'killteam'