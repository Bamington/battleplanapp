import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Recipe, RecipeWithItems, ModelRecipeWithDetails } from '../types/recipe.types'

export function useRecipes(modelId?: string) {
  const [recipes, setRecipes] = useState<RecipeWithItems[]>([])
  const [modelRecipes, setModelRecipes] = useState<ModelRecipeWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Fetch all recipes owned by the current user
  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setRecipes([])
      return
    }

    try {
      const { data: recipesData, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('owner', user.id)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      // For each recipe, fetch its items
      const recipesWithItems = await Promise.all(
        (recipesData || []).map(async (recipe) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('recipe_items')
            .select(`
              id,
              display_order,
              hobby_item:hobby_items (
                id,
                name,
                type,
                brand,
                swatch
              )
            `)
            .eq('recipe_id', recipe.id)
            .order('display_order', { ascending: true })

          if (itemsError) {
            console.error('Error fetching recipe items:', itemsError)
            return {
              ...recipe,
              items: [],
              itemCount: { paint: 0, other: 0 }
            }
          }

          // Flatten and count items
          const items = (itemsData || []).map(item => {
            const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
            return {
              ...hobbyItem,
              recipe_item_id: item.id,
              display_order: item.display_order
            }
          }).filter(item => item && item.id)

          const paintCount = items.filter(item => item.type?.toLowerCase() === 'paint').length
          const otherCount = items.filter(item => item.type?.toLowerCase() === 'other').length

          return {
            ...recipe,
            items,
            itemCount: { paint: paintCount, other: otherCount }
          }
        })
      )

      setRecipes(recipesWithItems as RecipeWithItems[])
    } catch (err) {
      console.error('Error fetching recipes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes')
    }
  }, [user])

  // Fetch recipes associated with a specific model
  const fetchModelRecipes = useCallback(async () => {
    if (!modelId) {
      setModelRecipes([])
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('model_recipes')
        .select(`
          id,
          description,
          added_at,
          recipe:recipes (
            id,
            name,
            description,
            owner,
            created_at,
            updated_at
          )
        `)
        .eq('model_id', modelId)
        .order('added_at', { ascending: true })

      if (fetchError) throw fetchError

      // For each recipe, fetch its items
      const recipesWithItems = await Promise.all(
        (data || []).map(async (modelRecipe) => {
          const recipe = Array.isArray(modelRecipe.recipe) ? modelRecipe.recipe[0] : modelRecipe.recipe

          if (!recipe) {
            return null
          }

          const { data: itemsData, error: itemsError } = await supabase
            .from('recipe_items')
            .select(`
              id,
              display_order,
              hobby_item:hobby_items (
                id,
                name,
                type,
                brand,
                swatch
              )
            `)
            .eq('recipe_id', recipe.id)
            .order('display_order', { ascending: true })

          if (itemsError) {
            console.error('Error fetching recipe items:', itemsError)
          }

          const items = (itemsData || []).map(item => {
            const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
            return {
              ...hobbyItem,
              recipe_item_id: item.id,
              display_order: item.display_order
            }
          }).filter(item => item && item.id)

          const paintCount = items.filter(item => item.type?.toLowerCase() === 'paint').length
          const otherCount = items.filter(item => item.type?.toLowerCase() === 'other').length

          return {
            id: modelRecipe.id,
            model_id: modelId,
            recipe_id: recipe.id,
            description: modelRecipe.description,
            added_at: modelRecipe.added_at,
            recipe: {
              ...recipe,
              items,
              itemCount: { paint: paintCount, other: otherCount }
            }
          }
        })
      )

      setModelRecipes(recipesWithItems.filter(r => r !== null) as ModelRecipeWithDetails[])
    } catch (err) {
      console.error('Error fetching model recipes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch model recipes')
    }
  }, [modelId])

  // Create a new recipe
  const createRecipe = async (name: string, description: string | null, hobbyItemIds: number[]) => {
    if (!user) throw new Error('User not authenticated')

    try {
      // Create the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name,
          description,
          owner: user.id
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      // Add items to the recipe with display_order
      if (hobbyItemIds.length > 0) {
        const recipeItems = hobbyItemIds.map((hobbyItemId, index) => ({
          recipe_id: recipeData.id,
          hobby_item_id: hobbyItemId,
          display_order: index
        }))

        const { error: itemsError } = await supabase
          .from('recipe_items')
          .insert(recipeItems)

        if (itemsError) throw itemsError
      }

      // Refresh recipes list
      await fetchRecipes()

      return recipeData
    } catch (err) {
      console.error('Error creating recipe:', err)
      throw err
    }
  }

  // Update recipe name and/or description
  const updateRecipe = async (recipeId: string, updates: { name?: string; description?: string }) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipeId)

      if (error) throw error

      await fetchRecipes()
      if (modelId) await fetchModelRecipes()
    } catch (err) {
      console.error('Error updating recipe:', err)
      throw err
    }
  }

  // Legacy function for backwards compatibility
  const updateRecipeName = async (recipeId: string, name: string) => {
    return updateRecipe(recipeId, { name })
  }

  // Add item to recipe (without auto-refresh)
  const addItemToRecipe = async (recipeId: string, hobbyItemId: number, skipRefetch = false) => {
    try {
      // Get the max display_order for this recipe
      const { data: existingItems } = await supabase
        .from('recipe_items')
        .select('display_order')
        .eq('recipe_id', recipeId)
        .order('display_order', { ascending: false })
        .limit(1)

      const maxOrder = existingItems && existingItems.length > 0 ? existingItems[0].display_order : -1

      const { error } = await supabase
        .from('recipe_items')
        .insert({
          recipe_id: recipeId,
          hobby_item_id: hobbyItemId,
          display_order: maxOrder + 1
        })

      if (error) throw error

      // Update the recipe's updated_at timestamp
      await supabase
        .from('recipes')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', recipeId)

      if (!skipRefetch) {
        await fetchRecipes()
        if (modelId) await fetchModelRecipes()
      }
    } catch (err) {
      console.error('Error adding item to recipe:', err)
      throw err
    }
  }

  // Remove item from recipe (without auto-refresh)
  const removeItemFromRecipe = async (recipeId: string, hobbyItemId: number, skipRefetch = false) => {
    try {
      const { error } = await supabase
        .from('recipe_items')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('hobby_item_id', hobbyItemId)

      if (error) throw error

      // Update the recipe's updated_at timestamp
      await supabase
        .from('recipes')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', recipeId)

      if (!skipRefetch) {
        await fetchRecipes()
        if (modelId) await fetchModelRecipes()
      }
    } catch (err) {
      console.error('Error removing item from recipe:', err)
      throw err
    }
  }

  // Reorder recipe items (without auto-refresh)
  const reorderRecipeItems = async (recipeId: string, itemOrders: { recipeItemId: string; displayOrder: number }[], skipRefetch = false) => {
    try {
      // Update display_order for all items
      const updates = itemOrders.map(({ recipeItemId, displayOrder }) =>
        supabase
          .from('recipe_items')
          .update({ display_order: displayOrder })
          .eq('id', recipeItemId)
      )

      await Promise.all(updates)

      // Update the recipe's updated_at timestamp
      await supabase
        .from('recipes')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', recipeId)

      if (!skipRefetch) {
        await fetchRecipes()
        if (modelId) await fetchModelRecipes()
      }
    } catch (err) {
      console.error('Error reordering recipe items:', err)
      throw err
    }
  }

  // Delete a recipe
  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)

      if (error) throw error

      await fetchRecipes()
      if (modelId) await fetchModelRecipes()
    } catch (err) {
      console.error('Error deleting recipe:', err)
      throw err
    }
  }

  // Add recipe to model
  const addRecipeToModel = async (recipeId: string, description?: string) => {
    if (!modelId) throw new Error('No model ID provided')

    try {
      const { error } = await supabase
        .from('model_recipes')
        .insert({
          model_id: modelId,
          recipe_id: recipeId,
          description: description || null
        })

      if (error) throw error

      await fetchModelRecipes()
    } catch (err) {
      console.error('Error adding recipe to model:', err)
      throw err
    }
  }

  // Update model recipe description
  const updateModelRecipeDescription = async (modelRecipeId: string, description: string) => {
    try {
      const { error } = await supabase
        .from('model_recipes')
        .update({ description })
        .eq('id', modelRecipeId)

      if (error) throw error

      await fetchModelRecipes()
    } catch (err) {
      console.error('Error updating model recipe description:', err)
      throw err
    }
  }

  // Remove recipe from model
  const removeRecipeFromModel = async (modelRecipeId: string) => {
    try {
      const { error } = await supabase
        .from('model_recipes')
        .delete()
        .eq('id', modelRecipeId)

      if (error) throw error

      await fetchModelRecipes()
    } catch (err) {
      console.error('Error removing recipe from model:', err)
      throw err
    }
  }

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      await Promise.all([
        fetchRecipes(),
        modelId ? fetchModelRecipes() : Promise.resolve()
      ])

      setLoading(false)
    }

    if (user) {
      fetchData()
    } else {
      setLoading(false)
      setRecipes([])
      setModelRecipes([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, modelId])

  return {
    recipes,
    modelRecipes,
    loading,
    error,
    createRecipe,
    updateRecipe,
    updateRecipeName,
    addItemToRecipe,
    removeItemFromRecipe,
    reorderRecipeItems,
    deleteRecipe,
    addRecipeToModel,
    updateModelRecipeDescription,
    removeRecipeFromModel,
    refetch: async () => {
      await fetchRecipes()
      if (modelId) await fetchModelRecipes()
    }
  }
}
