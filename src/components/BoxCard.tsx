import React from 'react'

interface BoxCardProps {
  name: string
  gameName: string
  purchaseDate: string
  imageUrl?: string
  gameImage?: string | null
  gameIcon?: string | null
  onViewBox: () => void
}

export function BoxCard({ name, gameName, purchaseDate, imageUrl, gameImage, gameIcon, onViewBox }: BoxCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getImageSrc = () => {
    // Check if we have a valid box image URL
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
    if (gameImage && 
        typeof gameImage === 'string' &&
        gameImage.trim() !== '' && 
        gameImage !== 'undefined' && 
        gameImage !== 'null' &&
        gameImage.startsWith('http')) {
      return gameImage
    }
    
    // Fallback to default image (we don't have access to game image in BoxCard props)
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
     <div className="bg-bg-card rounded-lg shadow-sm border border-border-custom overflow-hidden max-w-[380px] flex flex-col">
       <div className="aspect-w-16 aspect-h-12 relative bg-bg-card-secondary">
         <img
           src={getImageSrc()}
           alt={name}
           className="w-full h-48 min-h-[400px] bg-bg-card-secondary object-cover"
         />
       </div>
              <div className="p-4 flex flex-col flex-1">
         <div className="flex items-start justify-between mb-4">
           {/* Left side: Box name and purchase date in vertical flex */}
           <div className="flex flex-col flex-1 min-w-0 mr-3">
             <h3 className="text-lg font-bold text-title mb-1 break-words">{name}</h3>
             <p className="text-sm text-secondary-text">Purchased: {formatDate(purchaseDate)}</p>
           </div>
           
                                 {/* Right side: Game name and icon */}
             <div className="flex items-center space-x-2 flex-shrink-0 max-w-[30%]">
              <span className="text-xs text-secondary-text font-bold">{gameName.toUpperCase()}</span>
              {isValidGameIcon(gameIcon) ? (
                <>
                  <img
                    src={gameIcon || ''}
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
         
         <div className="flex justify-center mt-auto">
           <button 
             onClick={onViewBox}
             className="btn-secondary btn-flex"
           >
                           View Collection
           </button>
         </div>
       </div>
    </div>
  )
}