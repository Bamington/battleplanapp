import {
  FontStyleConfig,
  FontContext,
  DefaultFontConfigs,
  ThemeFonts,
  FontFamily,
  FontWeight,
  FontSize,
  FontStyle,
  TextDecoration,
  TextTransform,
  LetterSpacing,
  LineHeight
} from './types'

// Default font configurations based on your current themes
export const DEFAULT_FONT_CONFIGS: DefaultFontConfigs = {
  title: {
    family: 'serif',
    weight: 'bold',
    size: '4xl',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'tight'
  },
  subtitle: {
    family: 'serif',
    weight: 'semibold',
    size: '2xl',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'snug'
  },
  header: {
    family: 'sans',
    weight: 'bold',
    size: '3xl',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'uppercase',
    letterSpacing: 'wide',
    lineHeight: 'tight'
  },
  subheader: {
    family: 'sans',
    weight: 'semibold',
    size: 'xl',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'snug'
  },
  body: {
    family: 'sans',
    weight: 'normal',
    size: 'base',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'normal'
  },
  caption: {
    family: 'sans',
    weight: 'medium',
    size: 'sm',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'snug'
  },
  small: {
    family: 'sans',
    weight: 'normal',
    size: 'sm',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'normal'
  },
  tiny: {
    family: 'sans',
    weight: 'normal',
    size: 'xs',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'normal'
  },
  meta: {
    family: 'mono',
    weight: 'normal',
    size: 'xs',
    style: 'not-italic',
    decoration: 'no-underline',
    transform: 'normal-case',
    letterSpacing: 'normal',
    lineHeight: 'normal'
  }
}

// Tailwind to CSS mappings
const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace'
}

const FONT_WEIGHT_MAP: Record<FontWeight, string> = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
}

const FONT_SIZE_MAP: Record<FontSize, string> = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
  '5xl': '48px',
  '6xl': '60px',
  '7xl': '72px',
  '8xl': '96px',
  '9xl': '128px'
}

const LINE_HEIGHT_MAP: Record<LineHeight, string> = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
}

const LETTER_SPACING_MAP: Record<LetterSpacing, string> = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
}

/**
 * Get the complete font style configuration for a context, merging defaults with theme overrides
 */
export function getFontConfig(context: FontContext, themeFonts?: ThemeFonts): FontStyleConfig {
  const defaultConfig = DEFAULT_FONT_CONFIGS[context]

  if (!themeFonts) {
    return defaultConfig
  }

  // Start with theme defaults if provided, otherwise use global defaults
  const baseConfig = themeFonts.defaults?.[context] || defaultConfig

  // Apply theme-specific overrides
  const overrides = themeFonts.overrides?.[context] || {}

  return {
    ...baseConfig,
    ...overrides
  }
}

/**
 * Convert font style configuration to CSS font string
 */
export function fontConfigToCSSFont(config: FontStyleConfig): string {
  const family = config.family ? FONT_FAMILY_MAP[config.family] : FONT_FAMILY_MAP.sans
  const weight = config.weight ? FONT_WEIGHT_MAP[config.weight] : FONT_WEIGHT_MAP.normal
  const size = config.size ? FONT_SIZE_MAP[config.size] : FONT_SIZE_MAP.base
  const style = config.style === 'italic' ? 'italic' : 'normal'

  return `${style} ${weight} ${size} ${family}`
}

/**
 * Convert font style configuration to Tailwind classes
 */
export function fontConfigToTailwindClasses(config: FontStyleConfig): string {
  const classes: string[] = []

  if (config.family) {
    classes.push(`font-${config.family}`)
  }

  if (config.weight) {
    classes.push(`font-${config.weight}`)
  }

  if (config.size) {
    classes.push(`text-${config.size}`)
  }

  if (config.style) {
    classes.push(config.style)
  }

  if (config.decoration) {
    classes.push(config.decoration)
  }

  if (config.transform) {
    classes.push(config.transform)
  }

  if (config.letterSpacing) {
    classes.push(`tracking-${config.letterSpacing}`)
  }

  if (config.lineHeight) {
    classes.push(`leading-${config.lineHeight}`)
  }

  return classes.join(' ')
}

/**
 * Apply font configuration to a canvas context
 */
export function applyFontToCanvas(ctx: CanvasRenderingContext2D, config: FontStyleConfig): void {
  // Set font
  ctx.font = fontConfigToCSSFont(config)

  // Apply text transform manually since canvas doesn't support CSS text-transform
  // This would need to be handled in the calling code when setting the text

  // Set letter spacing (canvas doesn't support this directly, would need manual implementation)
  if (config.letterSpacing && config.letterSpacing !== 'normal') {
    // Note: Canvas doesn't support letter-spacing directly
    // This would need to be implemented by manually spacing characters
    console.warn('Letter spacing not supported in canvas context')
  }
}

/**
 * Transform text based on configuration
 */
export function transformText(text: string, config: FontStyleConfig): string {
  if (!config.transform || config.transform === 'normal-case') {
    return text
  }

  switch (config.transform) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'capitalize':
      return text.replace(/\b\w/g, char => char.toUpperCase())
    default:
      return text
  }
}

/**
 * Get font style for a specific context from theme fonts
 */
export function getThemeFontStyle(context: FontContext, themeFonts?: ThemeFonts): string {
  const config = getFontConfig(context, themeFonts)
  return fontConfigToCSSFont(config)
}

/**
 * Get Tailwind classes for a specific context from theme fonts
 */
export function getThemeTailwindClasses(context: FontContext, themeFonts?: ThemeFonts): string {
  const config = getFontConfig(context, themeFonts)
  return fontConfigToTailwindClasses(config)
}

// Legacy compatibility helpers
export function getLegacyFontString(type: 'title' | 'body' | 'small' | 'tiny', themeFonts?: ThemeFonts): string {
  // First check for legacy fonts
  if (themeFonts?.legacyFonts) {
    const legacyKey = `${type}Font` as keyof typeof themeFonts.legacyFonts
    if (themeFonts.legacyFonts[legacyKey]) {
      return themeFonts.legacyFonts[legacyKey]!
    }
  }

  // Map legacy types to new contexts
  const contextMap: Record<string, FontContext> = {
    title: 'title',
    body: 'body',
    small: 'small',
    tiny: 'tiny'
  }

  const context = contextMap[type]
  return getThemeFontStyle(context, themeFonts)
}