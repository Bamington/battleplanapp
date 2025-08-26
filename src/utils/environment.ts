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
  if (isLocalhost()) {
    return 'http://localhost:5173'
  }
  
  // For production, use the same base path as Vite config
  const basePath = import.meta.env.BASE_URL || '/'
  return `${window.location.origin}${basePath}`
}

/**
 * Get the base path for the current environment
 */
export const getBasePath = (): string => {
  return import.meta.env.BASE_URL || '/'
}

/**
 * Get the auth callback URL for the current environment
 */
export const getAuthCallbackUrl = (): string => {
  const baseUrl = getBaseUrl()
  // Remove trailing slash from base URL to avoid double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${cleanBaseUrl}/auth/callback`
}

/**
 * Get a share URL for the current environment
 */
export const getShareUrl = (path: string): string => {
  const baseUrl = getBaseUrl()
  // Remove trailing slash from base URL and leading slash from path to avoid double slashes
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanBaseUrl}${cleanPath}`
}
