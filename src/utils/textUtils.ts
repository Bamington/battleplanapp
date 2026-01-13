/**
 * Converts a string to Title Case (capitalizes the first letter of each word)
 * @param str - The string to convert
 * @returns The string in Title Case
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str) return ''

  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
