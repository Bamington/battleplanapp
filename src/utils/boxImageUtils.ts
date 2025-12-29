import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type BoxImage = Database['public']['Tables']['box_images']['Row']
type BoxImageInsert = Database['public']['Tables']['box_images']['Insert']
type BoxImageUpdate = Database['public']['Tables']['box_images']['Update']

export interface BoxWithImages {
  id: string
  name: string
  purchase_date: string | null
  image_url: string | null
  public: boolean
  show_carousel?: boolean
  created_at: string | null
  user_id: string | null
  game_id: string | null
  images?: BoxImage[]
  game?: {
    name: string
    image: string | null
    icon: string | null
  } | null
}

/**
 * Get a box with all its images, sorted by display_order
 */
export async function getBoxWithImages(boxId: string): Promise<BoxWithImages | null> {
  try {
    const { data: box, error: boxError } = await supabase
      .from('boxes')
      .select(`
        *,
        game:games(name, image, icon)
      `)
      .eq('id', boxId)
      .single()

    if (boxError) throw boxError
    if (!box) return null

    // Get all images for this box
    const { data: images, error: imagesError } = await supabase
      .from('box_images')
      .select('*')
      .eq('box_id', boxId)
      .order('display_order', { ascending: true })

    if (imagesError) throw imagesError

    return {
      ...box,
      images: images || []
    }
  } catch (error) {
    console.error('Error fetching box with images:', error)
    return null
  }
}

/**
 * Get all images for a specific box
 */
export async function getBoxImages(boxId: string): Promise<BoxImage[]> {
  try {
    const { data, error } = await supabase
      .from('box_images')
      .select('*')
      .eq('box_id', boxId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching box images:', error)
    return []
  }
}

/**
 * Add a new image to a box
 */
export async function addBoxImage(
  boxId: string,
  imageUrl: string,
  isPrimary: boolean = false,
  displayOrder?: number
): Promise<BoxImage | null> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    // If no display order provided, get the next available order
    if (displayOrder === undefined) {
      const { data: existingImages } = await supabase
        .from('box_images')
        .select('display_order')
        .eq('box_id', boxId)
        .order('display_order', { ascending: false })
        .limit(1)

      displayOrder = existingImages && existingImages.length > 0
        ? (existingImages[0].display_order + 1)
        : 0
    }

    const newImage: BoxImageInsert = {
      box_id: boxId,
      image_url: imageUrl,
      display_order: displayOrder,
      is_primary: isPrimary,
      user_id: user.user.id
    }

    const { data, error } = await supabase
      .from('box_images')
      .insert(newImage)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding box image:', error)
    return null
  }
}

/**
 * Update a box image
 */
export async function updateBoxImage(
  imageId: string,
  updates: Partial<BoxImageUpdate>
): Promise<BoxImage | null> {
  try {
    const { data, error } = await supabase
      .from('box_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating box image:', error)
    return null
  }
}

/**
 * Delete a box image
 */
export async function deleteBoxImage(imageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('box_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting box image:', error)
    return false
  }
}

/**
 * Set an image as the primary image for a box
 */
export async function setPrimaryBoxImage(imageId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('box_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error setting primary box image:', error)
    return false
  }
}

/**
 * Reorder box images by updating their display_order
 */
export async function reorderBoxImages(
  boxId: string,
  orderedImageIds: string[]
): Promise<boolean> {
  try {
    // Update each image with its new display order
    const updates = orderedImageIds.map((imageId, index) =>
      supabase
        .from('box_images')
        .update({ display_order: index })
        .eq('id', imageId)
        .eq('box_id', boxId) // Extra security check
    )

    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('Error reordering box images:', error)
    return false
  }
}

/**
 * Get the primary image for a box
 */
export async function getPrimaryBoxImage(boxId: string): Promise<BoxImage | null> {
  try {
    const { data, error } = await supabase
      .from('box_images')
      .select('*')
      .eq('box_id', boxId)
      .eq('is_primary', true)
      .single()

    if (error) {
      // If no primary image found, get the first image by display order
      if (error.code === 'PGRST116') {
        const { data: firstImage, error: firstError } = await supabase
          .from('box_images')
          .select('*')
          .eq('box_id', boxId)
          .order('display_order', { ascending: true })
          .limit(1)
          .single()

        if (firstError) throw firstError
        return firstImage
      }
      throw error
    }

    return data
  } catch (error) {
    console.error('Error getting primary box image:', error)
    return null
  }
}

/**
 * Get the best available image URL for a box (primary image or fallback)
 */
export function getBoxImageSrc(box: BoxWithImages): { src: string; isPrimary: boolean; isGameFallback: boolean } {
  // If box has images, use the primary one or first one
  if (box.images && box.images.length > 0) {
    const primaryImage = box.images.find(img => img.is_primary)
    const imageToUse = primaryImage || box.images[0]
    return {
      src: imageToUse.image_url,
      isPrimary: !!primaryImage,
      isGameFallback: false
    }
  }

  // Fallback to legacy image_url if no images in junction table
  if (box.image_url) {
    return {
      src: box.image_url,
      isPrimary: true,
      isGameFallback: false
    }
  }

  // Fallback to game image
  if (box.game?.image) {
    return {
      src: box.game.image,
      isPrimary: false,
      isGameFallback: true
    }
  }

  // Ultimate fallback
  return {
    src: '/bp-unkown.svg',
    isPrimary: false,
    isGameFallback: true
  }
}