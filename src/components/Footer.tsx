import React from 'react'
import { useVersion } from '../hooks/useVersion'

export function Footer() {
  const { currentVersion, loading, error } = useVersion()

  const handlePrivacyPolicyClick = () => {
    window.location.href = '/privacy-policy'
  }

  const handleTermsOfServiceClick = () => {
    window.location.href = '/terms-of-service'
  }

  return (
    <footer className="mt-12 pt-8 pb-20 border-t border-border-custom">
      <div className="flex flex-col items-center space-y-2">
        <img src="/Battleplan-Logo-Purple.svg" alt="BattlePlan" className="h-8" />
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
        <div className="flex items-center space-x-4 mt-2">
          <button
            onClick={handlePrivacyPolicyClick}
            className="text-xs text-secondary-text hover:text-text transition-colors"
          >
            Privacy Policy
          </button>
          <span className="text-xs text-secondary-text">•</span>
          <button
            onClick={handleTermsOfServiceClick}
            className="text-xs text-secondary-text hover:text-text transition-colors"
          >
            Terms of Service
          </button>
        </div>
      </div>
    </footer>
  )
}
