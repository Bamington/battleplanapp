import type { Database } from '../lib/database.types'

type List = Database['public']['Tables']['lists']['Row']
type Unit = Database['public']['Tables']['units']['Row']

/**
 * Check if a list is over its points limit
 */
export function isOverPointsLimit(list: List): boolean {
  if (!list.points_limit) return false
  return (list.points_total || 0) > list.points_limit
}

/**
 * Get the points remaining for a list
 */
export function getPointsRemaining(list: List): number {
  if (!list.points_limit) return 0
  return list.points_limit - (list.points_total || 0)
}

/**
 * Calculate percentage of points used
 */
export function getPointsPercentage(list: List): number {
  if (!list.points_limit) return 0
  return Math.round(((list.points_total || 0) / list.points_limit) * 100)
}

/**
 * Get status color for points usage
 */
export function getPointsStatusColor(list: List): string {
  const percentage = getPointsPercentage(list)

  if (percentage > 100) return 'text-red-600 dark:text-red-400'
  if (percentage >= 90) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-green-600 dark:text-green-400'
}

/**
 * Format points display
 */
export function formatPoints(points: number | null): string {
  if (points === null || points === undefined) return '0'
  return points.toLocaleString()
}

/**
 * Group units by type
 */
export function groupUnitsByType(units: Unit[]): Record<string, Unit[]> {
  return units.reduce((acc, unit) => {
    const type = unit.type || 'Other'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(unit)
    return acc
  }, {} as Record<string, Unit[]>)
}

/**
 * Get common unit types for a game (can be customized per game)
 */
export function getUnitTypesForGame(gameId?: string | null): string[] {
  // Default unit types - can be expanded based on game
  const defaultTypes = [
    'HQ',
    'Troops',
    'Elites',
    'Fast Attack',
    'Heavy Support',
    'Dedicated Transport',
    'Fortification',
    'Lord of War',
    'Other'
  ]

  // Game-specific types can be added here
  // Example:
  // if (gameId === 'specific-game-id') {
  //   return ['Commander', 'Core', 'Special', 'Rare']
  // }

  return defaultTypes
}

/**
 * Calculate total model count across all units
 */
export function getTotalModelCount(units: Unit[]): number {
  return units.reduce((total, unit) => total + unit.model_count, 0)
}

/**
 * Validate list name
 */
export function validateListName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'List name is required'
  }
  if (name.length > 100) {
    return 'List name must be 100 characters or less'
  }
  return null
}

/**
 * Validate unit data
 */
export function validateUnit(unit: Partial<Unit>): string | null {
  if (!unit.name || unit.name.trim().length === 0) {
    return 'Unit name is required'
  }
  if (unit.name.length > 100) {
    return 'Unit name must be 100 characters or less'
  }
  if (unit.model_count !== undefined && unit.model_count < 1) {
    return 'Model count must be at least 1'
  }
  if (unit.cost !== undefined && unit.cost !== null && unit.cost < 0) {
    return 'Cost cannot be negative'
  }
  return null
}

/**
 * Export list to text format
 */
export function exportListToText(
  list: List & { game?: { name: string } | null },
  units: Unit[]
): string {
  const lines: string[] = []

  // Header
  lines.push(`=== ${list.name} ===`)
  if (list.game?.name) {
    lines.push(`Game: ${list.game.name}`)
  }
  if (list.description) {
    lines.push(`Description: ${list.description}`)
  }
  lines.push('')

  // Points summary
  if (list.points_limit) {
    lines.push(`Points: ${list.points_total || 0} / ${list.points_limit}`)
  } else {
    lines.push(`Points: ${list.points_total || 0}`)
  }
  lines.push(`Models: ${getTotalModelCount(units)}`)
  lines.push('')

  // Units grouped by type
  const grouped = groupUnitsByType(units)
  Object.entries(grouped).forEach(([type, typeUnits]) => {
    lines.push(`${type}:`)
    typeUnits.forEach(unit => {
      const cost = unit.cost ? ` [${unit.cost}pts]` : ''
      const count = unit.model_count > 1 ? ` (x${unit.model_count})` : ''
      lines.push(`  - ${unit.name}${count}${cost}`)
      if (unit.notes) {
        lines.push(`    ${unit.notes}`)
      }
    })
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Sort units by display order
 */
export function sortUnitsByOrder(units: Unit[]): Unit[] {
  return [...units].sort((a, b) => {
    const orderA = a.display_order ?? 999
    const orderB = b.display_order ?? 999
    return orderA - orderB
  })
}
