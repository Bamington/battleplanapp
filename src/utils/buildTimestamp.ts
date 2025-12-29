// This file is automatically updated during the build process
// Do not edit manually

export const BUILD_TIMESTAMP = '2025-12-29 04:29:19 UTC'

export const getBuildInfo = () => {
  return {
    timestamp: BUILD_TIMESTAMP,
    date: new Date(BUILD_TIMESTAMP).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: new Date(BUILD_TIMESTAMP).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }
}
