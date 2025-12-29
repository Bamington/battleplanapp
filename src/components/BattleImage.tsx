import React, { useRef, useEffect } from 'react'
import { useBattleImage } from '../hooks/useBattleImage'

interface BattleImageProps {
  battleId: number
  name: string
  gameImage: string | null
  gameIcon: string | null
  className?: string
  size?: 'small' | 'large'
  refreshKey?: number
}

export function BattleImage({
  battleId,
  name,
  gameImage,
  gameIcon,
  className = '',
  size = 'small',
  refreshKey
}: BattleImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { imageSrc, isCarousel, loading, onMouseEnter, onMouseLeave, fetchImages, allImages, currentIndex, totalImages } = useBattleImage({
    battleId,
    gameImage,
    gameIcon,
    refreshKey
  })

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && fetchImages) {
            fetchImages()
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [fetchImages])

  const sizeClasses = size === 'large'
    ? 'w-full h-48'
    : 'w-16 h-16'

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {isCarousel && allImages && allImages.length > 1 ? (
        // Slider for multiple images
        <div className={`${sizeClasses} relative overflow-hidden rounded`}>
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{
              transform: `translateX(-${(currentIndex || 0) * 100}%)`,
            }}
          >
            {allImages.map((imageUrl, index) => (
              <div
                key={index}
                className={`flex-shrink-0 h-full ${sizeClasses}`}
              >
                <img
                  src={imageUrl}
                  alt={`${name} - Image ${index + 1}`}
                  className={`w-full h-full object-cover transition-opacity duration-500 ${
                    loading ? 'opacity-50' : 'opacity-100'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/bp-unkown.svg'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Carousel indicator dots */}
          {totalImages && totalImages > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {Array.from({ length: totalImages }).map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-white shadow-lg'
                      : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // Single image
        <img
          src={imageSrc}
          alt={name}
          className={`${sizeClasses} object-cover rounded transition-opacity duration-500 ${
            loading ? 'opacity-50' : 'opacity-100'
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/bp-unkown.svg'
          }}
        />
      )}
    </div>
  )
}