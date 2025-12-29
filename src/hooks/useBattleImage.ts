import { useState, useEffect, useRef } from 'react'
import { getBattleWithImages } from '../utils/battleImageUtils'

interface UseBattleImageOptions {
  battleId: number
  gameImage: string | null
  gameIcon: string | null
  refreshKey?: number // Force refresh when this changes
}

export function useBattleImage({ battleId, gameImage, gameIcon, refreshKey }: UseBattleImageOptions) {
  const [battleImages, setBattleImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Reset cache when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined) {
      setHasLoaded(false)
      setBattleImages([])
    }
  }, [refreshKey, battleId])

  // Fetch battle images when component comes into view
  const fetchBattleImages = async () => {
    if (hasLoaded || loading) return

    setLoading(true)
    try {
      // Get the battle with its images using the new utility
      const battleWithImages = await getBattleWithImages(battleId)

      // Extract battle images
      if (battleWithImages && battleWithImages.images) {
        // Sort images with primary image first, then by display order
        const sortedImages = battleWithImages.images.sort((a, b) => {
          // Primary image comes first
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          // If both are primary or both are not primary, sort by display order
          return a.display_order - b.display_order
        })

        const battleImageUrls = sortedImages.map(img => img.image_url)
        setBattleImages(battleImageUrls)
      }

      setHasLoaded(true)
    } catch (err) {
      console.error('Failed to fetch battle images for battle:', battleId, err)
      setHasLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  // Start carousel timer
  useEffect(() => {
    if (battleImages.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % battleImages.length)
      }, 4000) // 4 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [battleImages.length, isPaused])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    setIsPaused(true)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  // Priority 1: Battle's own images (primary image first due to sorting)
  if (battleImages.length > 0) {
    if (battleImages.length === 1) {
      return {
        imageSrc: battleImages[0], // This will be the primary image if one exists
        isCarousel: false,
        loading: false,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        fetchImages: fetchBattleImages,
        allImages: battleImages,
        currentIndex: 0,
        totalImages: 1
      }
    } else {
      // For multiple images, start with primary (index 0) and allow carousel
      return {
        imageSrc: battleImages[currentImageIndex % battleImages.length],
        isCarousel: true,
        loading: false,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        fetchImages: fetchBattleImages,
        allImages: battleImages,
        currentIndex: currentImageIndex % battleImages.length,
        totalImages: battleImages.length
      }
    }
  }

  // Priority 2: Game image
  if (gameImage &&
      typeof gameImage === 'string' &&
      gameImage.trim() !== '' &&
      gameImage !== 'undefined' &&
      gameImage !== 'null' &&
      gameImage.startsWith('http')) {
    return {
      imageSrc: gameImage,
      isCarousel: false,
      loading,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      fetchImages: fetchBattleImages,
      allImages: [gameImage],
      currentIndex: 0,
      totalImages: 1
    }
  }

  // Priority 3: Game icon
  if (gameIcon &&
      typeof gameIcon === 'string' &&
      gameIcon.trim() !== '' &&
      gameIcon !== 'undefined' &&
      gameIcon !== 'null' &&
      gameIcon.startsWith('http')) {
    return {
      imageSrc: gameIcon,
      isCarousel: false,
      loading,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      fetchImages: fetchBattleImages,
      allImages: [gameIcon],
      currentIndex: 0,
      totalImages: 1
    }
  }

  // Priority 4: Default fallback
  return {
    imageSrc: '/bp-unkown.svg',
    isCarousel: false,
    loading,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    fetchImages: fetchBattleImages,
    allImages: ['/bp-unkown.svg'],
    currentIndex: 0,
    totalImages: 1
  }
}