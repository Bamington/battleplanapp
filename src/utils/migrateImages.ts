import { supabase } from '../lib/supabase'
import { addBattleImage } from './battleImageUtils'
import { addBoxImage } from './boxImageUtils'

/**
 * Migrate all existing battle images from legacy image_url to battle_images junction table
 */
export async function migrateBattleImages() {
  console.log('Starting battle image migration...')

  try {
    // Get all battles with legacy images
    const { data: battles, error: fetchError } = await supabase
      .from('battles')
      .select('id, image_url, user_id')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .neq('image_url', 'null')

    if (fetchError) {
      console.error('Error fetching battles:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!battles || battles.length === 0) {
      console.log('No battles with legacy images found')
      return { success: true, migrated: 0, skipped: 0 }
    }

    console.log(`Found ${battles.length} battles with legacy images`)

    let migrated = 0
    let skipped = 0
    let errors: string[] = []

    for (const battle of battles) {
      try {
        // Check if battle already has images in junction table
        const { data: existingImages, error: checkError } = await supabase
          .from('battle_images')
          .select('id')
          .eq('battle_id', battle.id)

        if (checkError) {
          console.error(`Error checking existing images for battle ${battle.id}:`, checkError)
          errors.push(`Battle ${battle.id}: ${checkError.message}`)
          continue
        }

        if (existingImages && existingImages.length > 0) {
          console.log(`Skipping battle ${battle.id} - already has ${existingImages.length} images in junction table`)
          skipped++
          continue
        }

        // Add legacy image to junction table
        const imageResult = await addBattleImage(battle.id, battle.image_url, true, 0)

        if (!imageResult) {
          console.error(`Failed to add image for battle ${battle.id}`)
          errors.push(`Battle ${battle.id}: Failed to add image to junction table`)
          continue
        }

        // Clear legacy image_url field
        const { error: updateError } = await supabase
          .from('battles')
          .update({ image_url: null })
          .eq('id', battle.id)

        if (updateError) {
          console.error(`Error clearing legacy image_url for battle ${battle.id}:`, updateError)
          errors.push(`Battle ${battle.id}: Failed to clear legacy field`)
          continue
        }

        console.log(`Successfully migrated battle ${battle.id}`)
        migrated++

      } catch (error) {
        console.error(`Error migrating battle ${battle.id}:`, error)
        errors.push(`Battle ${battle.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`Battle migration completed: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`)

    return {
      success: errors.length === 0,
      migrated,
      skipped,
      errors,
      total: battles.length
    }

  } catch (error) {
    console.error('Battle migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Migrate all existing box images from legacy image_url to box_images junction table
 */
export async function migrateBoxImages() {
  console.log('Starting box image migration...')

  try {
    // Get all boxes with legacy images
    const { data: boxes, error: fetchError } = await supabase
      .from('boxes')
      .select('id, image_url, user_id')
      .not('image_url', 'is', null)
      .neq('image_url', '')
      .neq('image_url', 'null')

    if (fetchError) {
      console.error('Error fetching boxes:', fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!boxes || boxes.length === 0) {
      console.log('No boxes with legacy images found')
      return { success: true, migrated: 0, skipped: 0 }
    }

    console.log(`Found ${boxes.length} boxes with legacy images`)

    let migrated = 0
    let skipped = 0
    let errors: string[] = []

    for (const box of boxes) {
      try {
        // Check if box already has images in junction table
        const { data: existingImages, error: checkError } = await supabase
          .from('box_images')
          .select('id')
          .eq('box_id', box.id)

        if (checkError) {
          console.error(`Error checking existing images for box ${box.id}:`, checkError)
          errors.push(`Box ${box.id}: ${checkError.message}`)
          continue
        }

        if (existingImages && existingImages.length > 0) {
          console.log(`Skipping box ${box.id} - already has ${existingImages.length} images in junction table`)
          skipped++
          continue
        }

        // Add legacy image to junction table
        const imageResult = await addBoxImage(box.id, box.image_url, true, 0)

        if (!imageResult) {
          console.error(`Failed to add image for box ${box.id}`)
          errors.push(`Box ${box.id}: Failed to add image to junction table`)
          continue
        }

        // Clear legacy image_url field
        const { error: updateError } = await supabase
          .from('boxes')
          .update({ image_url: null })
          .eq('id', box.id)

        if (updateError) {
          console.error(`Error clearing legacy image_url for box ${box.id}:`, updateError)
          errors.push(`Box ${box.id}: Failed to clear legacy field`)
          continue
        }

        console.log(`Successfully migrated box ${box.id}`)
        migrated++

      } catch (error) {
        console.error(`Error migrating box ${box.id}:`, error)
        errors.push(`Box ${box.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log(`Box migration completed: ${migrated} migrated, ${skipped} skipped, ${errors.length} errors`)

    return {
      success: errors.length === 0,
      migrated,
      skipped,
      errors,
      total: boxes.length
    }

  } catch (error) {
    console.error('Box migration failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Migrate both battle and box images
 */
export async function migrateAllImages() {
  console.log('Starting complete image migration...')

  const battleResult = await migrateBattleImages()
  const boxResult = await migrateBoxImages()

  return {
    battles: battleResult,
    boxes: boxResult,
    success: battleResult.success && boxResult.success
  }
}