import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type BattleImage = Database['public']['Tables']['battle_images']['Row']
type BattleImageInsert = Database['public']['Tables']['battle_images']['Insert']
type BattleImageUpdate = Database['public']['Tables']['battle_images']['Update']

export interface BattleWithImages {
  id: number
  battle_name: string | null
  battle_notes: string | null
  date_played: string | null
  game_name: string | null
  game_uid: string | null
  game_icon: string | null
  image_url: string | null
  location: string | null
  opp_name: string | null
  opp_id: string[] | null
  opponent_id: number | null
  opponent?: {
    id: number
    opp_name: string | null
    opp_rel_uuid: string | null
    created_by: string | null
    created_at: string
  } | null
  result: string | null
  user_id: string | null
  created_at: string
  campaign_id: string | null
  campaign?: {
    id: string
    name: string
    description: string | null
    start_date: string | null
    end_date: string | null
  } | null
  images?: BattleImage[]
  game?: {
    name: string
    image: string | null
    icon: string | null
    default_theme: string | null
  } | null
}

/**
 * Get a battle with all its images, sorted by display_order
 */
export async function getBattleWithImages(battleId: number): Promise<BattleWithImages | null> {
  try {
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select(`
        *,
        opponent:opponents(id, opp_name, opp_rel_uuid, created_by, created_at),
        campaign:campaigns(id, name, description, start_date, end_date)
      `)
      .eq('id', battleId)
      .single()

    if (battleError) throw battleError
    if (!battle) return null

    // Get all images for this battle
    const { data: images, error: imagesError } = await supabase
      .from('battle_images')
      .select('*')
      .eq('battle_id', battleId)
      .order('display_order', { ascending: true })

    if (imagesError) throw imagesError

    // Get game data if game_uid exists
    let gameData = null
    if (battle.game_uid) {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('name, image, icon, default_theme')
        .eq('id', battle.game_uid)
        .single()

      if (!gameError && game) {
        gameData = game
      }
    }

    return {
      ...battle,
      images: images || [],
      game: gameData
    }
  } catch (error) {
    console.error('Error fetching battle with images:', error)
    return null
  }
}

/**
 * Get all images for a specific battle
 */
export async function getBattleImages(battleId: number): Promise<BattleImage[]> {
  try {
    const { data, error } = await supabase
      .from('battle_images')
      .select('*')
      .eq('battle_id', battleId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching battle images:', error)
    return []
  }
}

/**
 * Add a new image to a battle
 */
export async function addBattleImage(
  battleId: number,
  imageUrl: string,
  isPrimary: boolean = false,
  displayOrder?: number
): Promise<BattleImage | null> {
  try {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    // If no display order provided, get the next available order
    if (displayOrder === undefined) {
      const { data: existingImages } = await supabase
        .from('battle_images')
        .select('display_order')
        .eq('battle_id', battleId)
        .order('display_order', { ascending: false })
        .limit(1)

      displayOrder = existingImages && existingImages.length > 0
        ? (existingImages[0].display_order + 1)
        : 0
    }

    const newImage: BattleImageInsert = {
      battle_id: battleId,
      image_url: imageUrl,
      display_order: displayOrder,
      is_primary: isPrimary,
      user_id: user.user.id
    }

    const { data, error } = await supabase
      .from('battle_images')
      .insert(newImage)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding battle image:', error)
    return null
  }
}

/**
 * Update a battle image
 */
export async function updateBattleImage(
  imageId: string,
  updates: Partial<BattleImageUpdate>
): Promise<BattleImage | null> {
  try {
    const { data, error } = await supabase
      .from('battle_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating battle image:', error)
    return null
  }
}

/**
 * Delete a battle image
 */
export async function deleteBattleImage(imageId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('battle_images')
      .delete()
      .eq('id', imageId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting battle image:', error)
    return false
  }
}

/**
 * Set an image as the primary image for a battle
 */
export async function setPrimaryBattleImage(imageId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('battle_images')
      .update({ is_primary: true })
      .eq('id', imageId)
      .select()
      .single()

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error setting primary battle image:', error)
    return false
  }
}

/**
 * Reorder battle images by updating their display_order
 */
export async function reorderBattleImages(
  battleId: number,
  orderedImageIds: string[]
): Promise<boolean> {
  try {
    // Update each image with its new display order
    const updates = orderedImageIds.map((imageId, index) =>
      supabase
        .from('battle_images')
        .update({ display_order: index })
        .eq('id', imageId)
        .eq('battle_id', battleId) // Extra security check
    )

    await Promise.all(updates)
    return true
  } catch (error) {
    console.error('Error reordering battle images:', error)
    return false
  }
}

/**
 * Get the primary image for a battle
 */
export async function getPrimaryBattleImage(battleId: number): Promise<BattleImage | null> {
  try {
    const { data, error } = await supabase
      .from('battle_images')
      .select('*')
      .eq('battle_id', battleId)
      .eq('is_primary', true)
      .single()

    if (error) {
      // If no primary image found, get the first image by display order
      if (error.code === 'PGRST116') {
        const { data: firstImage, error: firstError } = await supabase
          .from('battle_images')
          .select('*')
          .eq('battle_id', battleId)
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
    console.error('Error getting primary battle image:', error)
    return null
  }
}

/**
 * Get the best available image URL for a battle (primary image or fallback)
 */
export function getBattleImageSrc(battle: BattleWithImages): { src: string; isPrimary: boolean; isGameFallback: boolean } {
  // If battle has images, use the primary one or first one
  if (battle.images && battle.images.length > 0) {
    const primaryImage = battle.images.find(img => img.is_primary)
    const imageToUse = primaryImage || battle.images[0]
    return {
      src: imageToUse.image_url,
      isPrimary: !!primaryImage,
      isGameFallback: false
    }
  }

  // Fallback to legacy image_url if no images in junction table
  if (battle.image_url) {
    return {
      src: battle.image_url,
      isPrimary: true,
      isGameFallback: false
    }
  }

  // Fallback to game image
  if (battle.game?.image) {
    return {
      src: battle.game.image,
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