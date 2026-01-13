import React from 'react'

interface LoadingProgressBarProps {
  progress: number // 0-100
  message?: string
  className?: string
}

export function LoadingProgressBar({ progress, message, className = '' }: LoadingProgressBarProps) {
  console.log('LoadingProgressBar rendered:', { progress, message })

  return (
    <div className={`w-full ${className}`}>
      {message && (
        <p className="text-sm text-secondary-text mb-2 text-center">{message}</p>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-sm">
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: 'var(--color-brand)'
          }}
        />
      </div>
      <p className="text-xs text-secondary-text mt-1 text-center">{Math.round(progress)}%</p>
    </div>
  )
}
