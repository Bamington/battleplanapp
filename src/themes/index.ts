import { Theme, ThemeId } from './types'

// Import fully implemented themes
import { battleplan } from './battleplan'
import { marathon } from './marathon'
import { ringbearer } from './ringbearer'
import { imperium } from './imperium'
import { heroic } from './heroic'
import { miniMyths } from './mini-myths'
import { eternal } from './eternal'
import { redFog } from './red-fog'
import { dragonslayer } from './dragonslayer'
import { eightpoints } from './eightpoints'
import { shatterpoint } from './shatterpoint'
import { killteam } from './killteam'


// Export all themes
export const themes: Record<ThemeId, Theme> = {
  battleplan,
  imperium,
  heroic,
  'mini-myths': miniMyths,
  eternal,
  marathon,
  'red-fog': redFog,
  dragonslayer,
  ringbearer,
  eightpoints,
  shatterpoint,
  killteam
}

// Export individual themes for direct import
export {
  battleplan,
  imperium,
  heroic,
  miniMyths,
  eternal,
  marathon,
  redFog,
  dragonslayer,
  ringbearer,
  eightpoints,
  shatterpoint,
  killteam
}

// Helper functions
export const getTheme = (id: ThemeId): Theme => {
  return themes[id]
}

export const getAllThemes = (): Theme[] => {
  return Object.values(themes)
}

export const getThemeIds = (): ThemeId[] => {
  return Object.keys(themes) as ThemeId[]
}

// Export types
export type { Theme, ThemeId, ThemeRenderContext } from './types'