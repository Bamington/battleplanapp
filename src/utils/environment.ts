/**
 * Environment detection utilities
 */

/**
 * Check if the current environment is localhost
 */
export const isLocalhost = (): boolean => {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

/**
 * Get the base URL for the current environment
 */
export const getBaseUrl = (): string => {
  return isLocalhost() ? 'http://localhost:5173' : window.location.origin
}

/**
 * Get the auth callback URL for the current environment
 */
export const getAuthCallbackUrl = (): string => {
  return `${getBaseUrl()}/auth/callback`
}

/**
 * Get a share URL for the current environment
 */
export const getShareUrl = (path: string): string => {
  return `${getBaseUrl()}${path}`
}
