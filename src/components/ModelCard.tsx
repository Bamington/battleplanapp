import React from 'react'

interface ModelCardProps {
  model: any
  name: string
  boxName: string
  gameName: string
  gameIcon?: string | null
  status: string
  count: number
  imageUrl?: string
  onViewModel: () => void
  onViewBox?: (box: any) => void
}

export function ModelCard({ model, name, boxName, gameName, gameIcon, status, count, imageUrl, onViewModel, onViewBox }: ModelCardProps) {
  // Debug logging to see what gameIcon value we're getting
  console.log('ModelCard Debug:', {
    name,
    gameName,
    gameIcon,
    hasGameIcon: !!gameIcon,
    gameIconType: typeof gameIcon,
    gameIconTrimmed: gameIcon?.trim()
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Painted': return 'bg-green-100 text-green-800'
      case 'Partially Painted': return 'bg-yellow-100 text-yellow-800'
      case 'Primed': return 'bg-blue-100 text-blue-800'
      case 'Assembled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getImageSrc = () => {
    // Check if we have a valid image URL
    if (imageUrl && 
        typeof imageUrl === 'string' &&
        imageUrl.trim() !== '' && 
        imageUrl !== 'undefined' && 
        imageUrl !== 'null' &&
        !imageUrl.includes('undefined') &&
        !imageUrl.includes('null') &&
        (imageUrl.startsWith('http') || imageUrl.startsWith('/'))) {
      return imageUrl
    }
    
    // Try to use the game's image as fallback
    const gameImage = model?.box?.game?.image || model?.game?.image
    if (gameImage && 
        typeof gameImage === 'string' &&
        gameImage.trim() !== '' && 
        gameImage !== 'undefined' && 
        gameImage !== 'null' &&
        gameImage.startsWith('http')) {
      return gameImage
    }
    
    // Fallback to default image
    return 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
  }

  const isValidGameIcon = (iconUrl: string | null | undefined): boolean => {
    return !!(iconUrl && 
      typeof iconUrl === 'string' &&
      iconUrl.trim() !== '' && 
      iconUrl !== 'undefined' && 
      iconUrl !== 'null' &&
      iconUrl.startsWith('http') &&
      iconUrl.includes('game-assets'))
  }

  return (
    <div className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden max-w-[380px] flex flex-col h-full">
      <div className="aspect-w-16 aspect-h-12 relative">
        <img
          src={getImageSrc()}
          alt={name}
          className="w-full h-48 min-h-[400px] object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            const fallbackUrl = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
            if (target.src !== fallbackUrl) {
              console.log('Image failed to load:', target.src, 'Falling back to default')
              target.src = fallbackUrl
            }
          }}
        />
        {status !== 'None' && (
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-title w-[70%]">{name}</h3>
          <div className="flex items-center space-x-2 ml-2 flex-col w-[30%]">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-secondary-text font-bold text-right">{gameName.toUpperCase()}</span>
            {isValidGameIcon(gameIcon) ? (
              <>
                <img
                  src={gameIcon}
                  alt={`${gameName} icon`}
                  className="w-8 h-8 object-contain rounded flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    console.warn('Game icon failed to load (bucket not found):', gameIcon, 'Falling back to letter icon')
                    // Hide the broken image and show fallback
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'flex'
                    }
                  }}
                  onLoad={(e) => {
                    // Hide fallback when image loads successfully
                    const target = e.target as HTMLImageElement
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'none'
                    }
                  }}
                />
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center icon-fallback">
                  <span className="text-white text-xs font-bold">{gameName.charAt(0)}</span>
                </div>
              </>
            ) : (
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 icon-fallback">
                <span className="text-white text-xs font-bold">{gameName.charAt(0)}</span>
              </div>
            )}
            </div>
          </div>
        </div>
        {model?.box && (
          <button
            onClick={() => onViewBox?.(model.box)}
            className="text-sm text-secondary-text font-semibold mb-3 hover:text-amber-600 transition-colors text-left"
          >
            {boxName}
          </button>
        )}
        </div>
        <div className="flex space-x-2">
          <button onClick={onViewModel} className="flex-1 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white py-2 px-4 rounded-lg text-base font-semibold transition-colors">
            View Model
          </button>
        </div>
      </div>
    </div>
  )
}