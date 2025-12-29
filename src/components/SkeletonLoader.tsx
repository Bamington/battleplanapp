import React from 'react'

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden animate-pulse ${className}`}>
      <div className="h-48 bg-secondary-text opacity-20"></div>
      <div className="p-4 space-y-3">
        <div className="h-6 bg-secondary-text opacity-20 rounded w-3/4"></div>
        <div className="h-4 bg-secondary-text opacity-20 rounded w-1/2"></div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-secondary-text opacity-20 rounded w-1/4"></div>
          <div className="h-6 w-6 bg-secondary-text opacity-20 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

interface SkeletonGridProps {
  count?: number
  className?: string
}

export function SkeletonGrid({ count = 6, className = '' }: SkeletonGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

interface SkeletonListItemProps {
  className?: string
}

export function SkeletonListItem({ className = '' }: SkeletonListItemProps) {
  return (
    <div className={`bg-bg-card rounded-lg border border-border-custom p-4 animate-pulse ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-secondary-text opacity-20 rounded"></div>
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-secondary-text opacity-20 rounded w-2/3"></div>
          <div className="h-4 bg-secondary-text opacity-20 rounded w-1/2"></div>
          <div className="h-3 bg-secondary-text opacity-20 rounded w-1/3"></div>
        </div>
        <div className="h-6 w-6 bg-secondary-text opacity-20 rounded-full"></div>
      </div>
    </div>
  )
}

interface SkeletonListProps {
  count?: number
  className?: string
}

export function SkeletonList({ count = 6, className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}