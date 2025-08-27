import React from 'react'
import { useVersion } from '../hooks/useVersion'

export function Footer() {
  const { currentVersion, loading, error } = useVersion()

  return (
    <footer className="mt-12 pt-8 pb-20 border-t border-border-custom">
      <div className="flex flex-col items-center space-y-2">
        <img src="Battleplan-Logo-Purple.svg" alt="BattlePlan" className="h-8" />
        {loading && (
          <span className="text-xs text-secondary-text">
            Loading version...
          </span>
        )}
        {!loading && currentVersion && (
          <span className="text-xs text-secondary-text">
            Version {currentVersion.ver_number.toFixed(2)}
          </span>
        )}
        {!loading && !currentVersion && (
          <span className="text-xs text-secondary-text">
            Version not available
          </span>
        )}
        {error && (
          <span className="text-xs text-red-500">
            Error: {error}
          </span>
        )}
      </div>
    </footer>
  )
}
