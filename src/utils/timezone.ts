/**
 * Timezone utilities for handling local device time
 */

/**
 * Get the user's local timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert a date string to the user's local timezone
 * @param dateString - Date string in any format
 * @returns Date object in user's local timezone
 */
export function toLocalDate(dateString: string): Date {
  return new Date(dateString)
}

/**
 * Format a date for display in the user's local timezone
 * @param dateString - Date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatLocalDate(
  dateString: string, 
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string {
  const date = toLocalDate(dateString)
  return date.toLocaleDateString('en-US', options)
}

/**
 * Format a time for display in the user's local timezone
 * @param timeString - Time string (HH:MM:SS format)
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export function formatLocalTime(
  timeString: string,
  options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
): string {
  // Create a date object with the time string in the user's local timezone
  const today = new Date()
  const [hours, minutes, seconds = '00'] = timeString.split(':')
  const dateWithTime = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    parseInt(hours),
    parseInt(minutes),
    parseInt(seconds)
  )
  
  return dateWithTime.toLocaleTimeString('en-US', options)
}

/**
 * Get today's date in the user's local timezone as YYYY-MM-DD
 * @returns Date string in YYYY-MM-DD format
 */
export function getTodayLocalDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Check if a date is today in the user's local timezone
 * @param dateString - Date string to check
 * @returns boolean indicating if the date is today
 */
export function isToday(dateString: string): boolean {
  const date = toLocalDate(dateString)
  const today = new Date()
  
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a date is in the past in the user's local timezone
 * @param dateString - Date string to check
 * @returns boolean indicating if the date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const date = toLocalDate(dateString)
  const today = new Date()
  
  // Set both dates to start of day for comparison
  date.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  return date < today
}

/**
 * Get relative date description (Today, Yesterday, Tomorrow, or formatted date)
 * @param dateString - Date string
 * @returns Relative date description
 */
export function getRelativeDate(dateString: string): string {
  const date = toLocalDate(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  const tomorrow = new Date(today)
  
  yesterday.setDate(yesterday.getDate() - 1)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Set all dates to start of day for comparison
  today.setHours(0, 0, 0, 0)
  yesterday.setHours(0, 0, 0, 0)
  tomorrow.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  
  if (date.getTime() === today.getTime()) {
    return 'Today'
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday'
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow'
  } else {
    return formatLocalDate(dateString, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

/**
 * Create a full datetime string in the user's local timezone
 * @param dateString - Date string (YYYY-MM-DD)
 * @param timeString - Time string (HH:MM:SS)
 * @returns ISO string in local timezone
 */
export function createLocalDateTime(dateString: string, timeString: string): string {
  const [hours, minutes, seconds = '00'] = timeString.split(':')
  const date = new Date(dateString)
  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds))
  
  return date.toISOString()
}

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateToLocalString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
