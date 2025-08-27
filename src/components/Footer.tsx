import React from 'react'
import { useVersion } from '../hooks/useVersion'

export function Footer() {
  const { currentVersion, loading } = useVersion()

  return (
    <footer className="mt-12 pt-8 pb-20 border-t border-border-custom">
      <div className="flex flex-col items-center space-y-2">
        <img src="Battleplan-Logo-Purple.svg" alt="BattlePlan" className="h-8" />
        {!loading && currentVersion && (
          <span className="text-xs text-secondary-text">
            Version {currentVersion.ver_number}
          </span>
        )}
      </div>
    </footer>
  )
}
