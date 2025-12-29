import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getBoxWithImages, getBoxImageSrc } from '../utils/boxImageUtils'

interface ModelImage {
  id: string
  image_url: string
  is_primary: boolean
}

interface UseBoxImageOptions {
  boxId: string
  gameImage: string | null
  gameIcon: string | null
  forceCarousel?: boolean // For modal usage where we want to override
  refreshKey?: number // Force refresh when this changes
}

export function useBoxImage({ boxId, gameImage, gameIcon, forceCarousel, refreshKey }: UseBoxImageOptions) {
  const [modelImages, setModelImages] = useState<string[]>([])
  const [boxImages, setBoxImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [showCarousel, setShowCarousel] = useState<boolean | null>(null)

  // Reset cache when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined) {
      setHasLoaded(false)
      setShowCarousel(null)
      setModelImages([])
      setBoxImages([])
    }
  }, [refreshKey, boxId])

  // Fetch model images when component comes into view
  const fetchModelImages = async () => {
    if (hasLoaded || loading) return

    setLoading(true)
    try {
      // Get the box with its images using the new utility
      const boxWithImages = await getBoxWithImages(boxId)

      // Extract box images
      if (boxWithImages && boxWithImages.images) {
        const boxImageUrls = boxWithImages.images
          .sort((a, b) => a.display_order - b.display_order)
          .map(img => img.image_url)
        setBoxImages(boxImageUrls)
      }

      // Get the collection's carousel preference if not forcing
      if (forceCarousel === undefined && showCarousel === null) {
        const { data: boxData, error: boxError } = await supabase
          .from('boxes')
          .select('show_carousel')
          .eq('id', boxId)
          .single()

        if (!boxError && boxData) {
          setShowCarousel(boxData.show_carousel || false)
        } else if (boxWithImages) {
          setShowCarousel(boxWithImages.show_carousel || false)
        }
      }

      // Get models in this box with their images
      const { data: modelBoxes, error: modelBoxError } = await supabase
        .from('model_boxes')
        .select(`
          model:models(
            id,
            image_url,
            model_images(
              id,
              image_url,
              is_primary
            )
          )
        `)
        .eq('box_id', boxId)

      if (modelBoxError) throw modelBoxError

      // Extract unique model images (one per model)
      const imageUrls: string[] = []
      const processedModels = new Set<string>()

      modelBoxes?.forEach(({ model }) => {
        if (!model || processedModels.has(model.id)) return
        processedModels.add(model.id)

        // Priority: is_primary image, then model.image_url
        let imageUrl: string | null = null

        // Check for primary image in model_images array
        const primaryImage = model.model_images?.find((img: ModelImage) => img.is_primary)
        if (primaryImage?.image_url) {
          imageUrl = primaryImage.image_url
        }
        // Fallback to model.image_url
        else if (model.image_url &&
                 typeof model.image_url === 'string' &&
                 model.image_url.trim() !== '' &&
                 model.image_url !== 'undefined' &&
                 model.image_url !== 'null' &&
                 (model.image_url.startsWith('http') || model.image_url.startsWith('/'))) {
          imageUrl = model.image_url
        }

        if (imageUrl) {
          imageUrls.push(imageUrl)
        }
      })

      setModelImages(imageUrls)
      setHasLoaded(true)
    } catch (err) {
      console.error('Failed to fetch model images for box:', boxId, err)
      setHasLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  // Start carousel timer based on the actual images that would be shown
  useEffect(() => {
    let totalImages = 0

    // Calculate total images based on the simplified logic
    const shouldUseCarousel = forceCarousel !== undefined ? forceCarousel : (showCarousel === true)

    if (!shouldUseCarousel && boxImages.length > 0) {
      // Non-carousel mode: only box images matter
      totalImages = boxImages.length
    } else if (shouldUseCarousel && boxImages.length > 0) {
      // Carousel mode with collection images + model images
      const carouselImages = [...boxImages]
      modelImages.forEach(modelImg => {
        if (!carouselImages.includes(modelImg)) {
          carouselImages.push(modelImg)
        }
      })
      totalImages = carouselImages.length
    } else if (modelImages.length > 1) {
      // Fallback carousel for multiple model images only
      totalImages = modelImages.length
    }

    if (totalImages > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % totalImages)
      }, 4000) // 4 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }
  }, [modelImages.length, boxImages.length, isPaused, forceCarousel, showCarousel])

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

  // Determine whether to use carousel based on preference and override
  const shouldUseCarousel = forceCarousel !== undefined ? forceCarousel : (showCarousel === true)


  // Priority 1: Collection's own images (when carousel is disabled)
  if (!shouldUseCarousel && boxImages.length > 0) {
    // If there's only one box image, show it directly
    if (boxImages.length === 1) {
      return {
        imageSrc: boxImages[0],
        isCarousel: false,
        loading: false,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        fetchImages: fetchModelImages,
        allImages: boxImages,
        currentIndex: 0,
        totalImages: 1
      }
    }
    // If there are multiple box images, show them as a carousel
    else {
      return {
        imageSrc: boxImages[currentImageIndex % boxImages.length],
        isCarousel: true,
        loading: false,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        fetchImages: fetchModelImages,
        allImages: boxImages,
        currentIndex: currentImageIndex % boxImages.length,
        totalImages: boxImages.length
      }
    }
  }

  // Priority 1.5: Carousel mode with collection images (regardless of model images)
  if (shouldUseCarousel && boxImages.length > 0) {
    // Build carousel array with collection images first, then model images
    const carouselImages = [...boxImages]

    // Add model images to carousel if they exist and aren't duplicated
    modelImages.forEach(modelImg => {
      if (!carouselImages.includes(modelImg)) {
        carouselImages.push(modelImg)
      }
    })

    if (carouselImages.length === 1) {
      return {
        imageSrc: carouselImages[0],
        isCarousel: false,
        loading: false,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        fetchImages: fetchModelImages,
        allImages: carouselImages,
        currentIndex: 0,
        totalImages: 1
      }
    } else {
      return {
        imageSrc: carouselImages[currentImageIndex % carouselImages.length],
        isCarousel: true,
        loading: false,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        fetchImages: fetchModelImages,
        allImages: carouselImages,
        currentIndex: currentImageIndex % carouselImages.length,
        totalImages: carouselImages.length
      }
    }
  }




  // Priority 4: Multiple model images (fallback carousel when not in carousel mode but have multiple images)
  if (modelImages.length > 1) {
    return {
      imageSrc: modelImages[currentImageIndex],
      isCarousel: true,
      loading,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      fetchImages: fetchModelImages,
      allImages: modelImages,
      currentIndex: currentImageIndex,
      totalImages: modelImages.length
    }
  }

  // Priority 5: Single model image
  if (modelImages.length === 1) {
    return {
      imageSrc: modelImages[0],
      isCarousel: false,
      loading,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      fetchImages: fetchModelImages,
      allImages: modelImages,
      currentIndex: 0,
      totalImages: 1
    }
  }

  // Priority 6: Game image
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
      fetchImages: fetchModelImages,
      allImages: [gameImage],
      currentIndex: 0,
      totalImages: 1
    }
  }

  // Priority 7: Default fallback
  return {
    imageSrc: '/bp-unkown.svg',
    isCarousel: false,
    loading,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    fetchImages: fetchModelImages,
    allImages: ['/bp-unkown.svg'],
    currentIndex: 0,
    totalImages: 1
  }
}