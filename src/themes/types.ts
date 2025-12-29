export interface ThemeColors {
  gradientColor: string // RGB values as string "r, g, b"
  borderColor: string   // RGBA values as string "rgba(r, g, b, a)"
}

// Tailwind font family options
export type FontFamily = 'sans' | 'serif' | 'mono'

// Tailwind font weight options
export type FontWeight = 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black'

// Tailwind font size options
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl'

// Tailwind font style options
export type FontStyle = 'italic' | 'not-italic'

// Tailwind text decoration options
export type TextDecoration = 'underline' | 'overline' | 'line-through' | 'no-underline'

// Tailwind text transform options
export type TextTransform = 'uppercase' | 'lowercase' | 'capitalize' | 'normal-case'

// Tailwind letter spacing options
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest'

// Tailwind line height options
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'

// Complete font style configuration
export interface FontStyleConfig {
  family?: FontFamily
  weight?: FontWeight
  size?: FontSize
  style?: FontStyle
  decoration?: TextDecoration
  transform?: TextTransform
  letterSpacing?: LetterSpacing
  lineHeight?: LineHeight
}

// Font context types for different use cases
export type FontContext = 'title' | 'subtitle' | 'body' | 'caption' | 'small' | 'tiny' | 'header' | 'subheader' | 'meta'

// Default font configurations for each context
export interface DefaultFontConfigs {
  title: FontStyleConfig
  subtitle: FontStyleConfig
  body: FontStyleConfig
  caption: FontStyleConfig
  small: FontStyleConfig
  tiny: FontStyleConfig
  header: FontStyleConfig
  subheader: FontStyleConfig
  meta: FontStyleConfig
}

// Theme-specific font overrides
export interface ThemeFonts {
  // Default configurations for all contexts
  defaults?: DefaultFontConfigs

  // Theme-specific overrides for any context
  overrides?: Partial<Record<FontContext, Partial<FontStyleConfig>>>

  // Legacy font strings for backwards compatibility during transition
  legacyFonts?: {
    titleFont?: string
    bodyFont?: string
    smallFont?: string
    tinyFont?: string
  }
}

export interface ThemeRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  model: any // TODO: Type this properly
  user?: any
  userPublicName?: string | null
  shadowOpacity: number
  textPosition: 'bottom-right' | 'bottom-left' | 'bottom-center'
  showPaintedDate: boolean
  showCollectionName: boolean
  showGameDetails: boolean
  isDarkText: boolean
  showVisualOverlays?: boolean
  overlayOpacity?: number
  customGradientColor?: string
  customBorderColor?: string
  gradientOpacity?: number
  customBannerColor?: string
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
  isVisible: boolean

  // Theme-specific default settings
  defaultSettings?: {
    showCollectionName?: boolean
    textPosition?: 'bottom-right' | 'bottom-left' | 'bottom-center'
    isDarkText?: boolean
    showPaintedDate?: boolean
    showGameDetails?: boolean
  }

  // Custom controls for this theme
  customControls?: {
    hideDarkTextToggle?: boolean
    hideTextShadow?: boolean
    hideGradientColor?: boolean
    hideBorderColor?: boolean
    hideGradientOpacity?: boolean
    hideVisualOverlays?: boolean
    textPositionOptions?: Array<{ value: string, label: string }>
    bannerColorOptions?: Array<{ name: string, value: string }>
  }

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