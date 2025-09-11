// Utility functions for managing many-to-many relationships between models and boxes

import { supabase } from '../lib/supabase'

export interface ModelBoxRelationship {
  id: string
  model_id: string
  box_id: string
  added_at: string
}

export interface ModelWithBoxes {
  id: string
  name: string
  status: string
  count: number
  image_url: string | null
  game_id: string | null
  notes: string | null
  painted_date: string | null
  purchase_date: string | null
  created_at: string
  lore_name?: string | null
  lore_description?: string | null
  painting_notes?: string | null
  public?: boolean | null
  boxes: Array<{
    id: string
    name: string
    purchase_date: string | null
    added_at: string
    game: {
      id: string
      name: string
      icon: string | null
      image: string | null
    } | null
  }>
  game: {
    id: string
    name: string
    icon: string | null
    image: string | null
  } | null
}

export interface BoxWithModels {
  id: string
  name: string
  purchase_date: string | null
  image_url: string | null
  public: boolean
  game: {
    name: string
    image: string | null
    icon: string | null
  } | null
  models: Array<{
    id: string
    name: string
    status: string
    count: number
    image_url: string | null
    game_id: string | null
    notes: string | null
    painted_date: string | null
    purchase_date: string | null
    lore_name?: string | null
    lore_description?: string | null
    painting_notes?: string | null
    added_at: string
    game: {
      id: string
      name: string
      icon: string | null
    } | null
  }>
}

/**
 * Add models to a box (many-to-many relationship)
 */
export async function addModelsToBox(modelIds: string[], boxId: string): Promise<void> {
  const relationships = modelIds.map(modelId => ({
    model_id: modelId,
    box_id: boxId
  }))

  const { error } = await supabase
    .from('model_boxes')
    .insert(relationships)

  if (error) throw error

  // Update purchase dates for all affected models to use earliest date
  for (const modelId of modelIds) {
    await updateModelEarliestPurchaseDate(modelId)
  }
}

/**
 * Remove a model from a box
 */
export async function removeModelFromBox(modelId: string, boxId: string): Promise<void> {
  const { error } = await supabase
    .from('model_boxes')
    .delete()
    .eq('model_id', modelId)
    .eq('box_id', boxId)

  if (error) throw error

  // Update the model's purchase date after removal
  await updateModelEarliestPurchaseDate(modelId)
}

/**
 * Remove a model from all boxes
 */
export async function removeModelFromAllBoxes(modelId: string): Promise<void> {
  const { error } = await supabase
    .from('model_boxes')
    .delete()
    .eq('model_id', modelId)

  if (error) throw error
}

/**
 * Get models with their associated boxes
 */
export async function getModelsWithBoxes(userId: string): Promise<ModelWithBoxes[]> {
  const { data, error } = await supabase
    .from('models')
    .select(`
      id,
      name,
      status,
      count,
      image_url,
      game_id,
      notes,
      painted_date,
      purchase_date,
      created_at,
      lore_name,
      lore_description,
      painting_notes,
      public,
      game:games(
        id,
        name,
        icon,
        image
      ),
      model_boxes!inner(
        added_at,
        box:boxes(
          id,
          name,
          purchase_date,
          game:games(
            id,
            name,
            icon,
            image
          )
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Transform the data to group boxes per model
  const modelsMap = new Map<string, ModelWithBoxes>()
  
  data?.forEach(row => {
    const modelId = row.id
    if (!modelsMap.has(modelId)) {
      modelsMap.set(modelId, {
        ...row,
        boxes: []
      })
    }
    
    const model = modelsMap.get(modelId)!
    if (row.model_boxes) {
      model.boxes.push({
        id: row.model_boxes.box.id,
        name: row.model_boxes.box.name,
        purchase_date: row.model_boxes.box.purchase_date,
        added_at: row.model_boxes.added_at,
        game: row.model_boxes.box.game
      })
    }
  })

  return Array.from(modelsMap.values())
}

/**
 * Get models that are available to add to boxes (for many-to-many, this could be all models)
 * For now, we'll get all models since models can belong to multiple boxes
 */
export async function getModelsNotInBoxes(userId: string): Promise<ModelWithBoxes[]> {
  const { data, error } = await supabase
    .from('models')
    .select(`
      id,
      name,
      status,
      count,
      image_url,
      game_id,
      notes,
      painted_date,
      purchase_date,
      created_at,
      lore_name,
      lore_description,
      painting_notes,
      public,
      game:games(
        id,
        name,
        icon,
        image
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(model => ({
    ...model,
    boxes: []
  })) || []
}

/**
 * Get models that are truly not in any box (for legacy compatibility)
 */
export async function getModelsWithoutBoxes(userId: string): Promise<ModelWithBoxes[]> {
  const { data, error } = await supabase
    .from('models')
    .select(`
      id,
      name,
      status,
      count,
      image_url,
      game_id,
      notes,
      painted_date,
      purchase_date,
      created_at,
      lore_name,
      lore_description,
      painting_notes,
      public,
      game:games(
        id,
        name,
        icon,
        image
      )
    `)
    .eq('user_id', userId)
    .not('id', 'in', `(SELECT model_id FROM model_boxes)`)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(model => ({
    ...model,
    boxes: []
  })) || []
}

/**
 * Get box with its models
 */
export async function getBoxWithModels(boxId: string): Promise<BoxWithModels | null> {
  const { data: boxData, error: boxError } = await supabase
    .from('boxes')
    .select(`
      id,
      name,
      purchase_date,
      image_url,
      public,
      game:games(
        name,
        image,
        icon
      )
    `)
    .eq('id', boxId)
    .single()

  if (boxError) throw boxError
  if (!boxData) return null

  const { data: modelsData, error: modelsError } = await supabase
    .from('model_boxes')
    .select(`
      added_at,
      model:models(
        id,
        name,
        status,
        count,
        image_url,
        game_id,
        notes,
        painted_date,
        purchase_date,
        lore_name,
        lore_description,
        painting_notes,
        game:games(
          id,
          name,
          icon
        )
      )
    `)
    .eq('box_id', boxId)
    .order('added_at', { ascending: false })

  if (modelsError) throw modelsError

  const models = modelsData?.map(item => ({
    ...item.model,
    added_at: item.added_at
  })) || []

  return {
    ...boxData,
    models
  }
}

/**
 * Check if a model is in a specific box
 */
export async function isModelInBox(modelId: string, boxId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('model_boxes')
    .select('id')
    .eq('model_id', modelId)
    .eq('box_id', boxId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
  return !!data
}

/**
 * Update a model's purchase date to the earliest date from all its collections
 */
export async function updateModelEarliestPurchaseDate(modelId: string): Promise<void> {
  // Get all collections this model belongs to
  const { data: modelBoxes, error: modelBoxesError } = await supabase
    .from('model_boxes')
    .select(`
      box:boxes(
        purchase_date
      )
    `)
    .eq('model_id', modelId)

  if (modelBoxesError) throw modelBoxesError

  // Get the current model's purchase date
  const { data: model, error: modelError } = await supabase
    .from('models')
    .select('purchase_date')
    .eq('id', modelId)
    .single()

  if (modelError) throw modelError

  // Collect all purchase dates (from model and collections)
  const purchaseDates: string[] = []
  
  // Add model's own purchase date if it exists
  if (model.purchase_date) {
    purchaseDates.push(model.purchase_date)
  }
  
  // Add collection purchase dates
  modelBoxes?.forEach(mb => {
    if (mb.box?.purchase_date) {
      purchaseDates.push(mb.box.purchase_date)
    }
  })

  // Find the earliest date
  if (purchaseDates.length > 0) {
    const earliestDate = purchaseDates.sort()[0] // Sort chronologically, earliest first
    
    // Update the model's purchase date if it's different
    if (model.purchase_date !== earliestDate) {
      const { error: updateError } = await supabase
        .from('models')
        .update({ purchase_date: earliestDate })
        .eq('id', modelId)

      if (updateError) throw updateError
    }
  }
}

/**
 * Get boxes that a model belongs to
 */
export async function getModelBoxes(modelId: string): Promise<Array<{ id: string; name: string; added_at: string; purchase_date: string | null }>> {
  const { data, error } = await supabase
    .from('model_boxes')
    .select(`
      added_at,
      box:boxes(
        id,
        name,
        purchase_date
      )
    `)
    .eq('model_id', modelId)
    .order('added_at', { ascending: false })

  if (error) throw error

  return data?.map(item => ({
    id: item.box.id,
    name: item.box.name,
    added_at: item.added_at,
    purchase_date: item.box.purchase_date
  })) || []
}

/**
 * Batch update purchase dates for all models to use earliest collection date
 * Useful for migrating existing data to the new system
 */
export async function batchUpdateAllModelPurchaseDates(userId: string): Promise<void> {
  // Get all models for the user
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('id')
    .eq('user_id', userId)

  if (modelsError) throw modelsError

  // Update purchase date for each model
  for (const model of models || []) {
    await updateModelEarliestPurchaseDate(model.id)
  }
}