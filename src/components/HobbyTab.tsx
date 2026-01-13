import React, { useState } from 'react'
import { HobbyItemsList } from './HobbyItemsList'
import { RecipesList } from './RecipesList'
import { useHobbyItems } from '../hooks/useHobbyItems'
import { useRecipes } from '../hooks/useRecipes'
import { AddToCollectionModal } from './AddToCollectionModal'
import { CreateRecipeModal } from './CreateRecipeModal'
import { EditRecipeModal } from './EditRecipeModal'
import { RecipeWithItems } from '../types/recipe.types'

export function HobbyTab() {
  const {
    userHobbyItems,
    allHobbyItems,
    ownedHobbyItems,
    loading: hobbyItemsLoading,
    createHobbyItem,
    deleteHobbyItem,
    addToCollection,
    removeFromCollection
  } = useHobbyItems()
  const {
    recipes,
    loading: recipesLoading,
    createRecipe,
    deleteRecipe,
    updateRecipe,
    addItemToRecipe,
    removeItemFromRecipe,
    reorderRecipeItems,
    refetch: refetchRecipes
  } = useRecipes()

  const [showAddToCollectionModal, setShowAddToCollectionModal] = useState(false)
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false)
  const [showEditRecipeModal, setShowEditRecipeModal] = useState(false)
  const [recipeToEdit, setRecipeToEdit] = useState<RecipeWithItems | null>(null)

  const loading = hobbyItemsLoading || recipesLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
        <span className="ml-3 text-secondary-text">Loading hobby items...</span>
      </div>
    )
  }

  const handleCreateItem = async (item: { name: string; type: string; brand?: string; swatch?: string }) => {
    await createHobbyItem(item)
    setShowCreateItemModal(false)
  }

  const handleDeleteHobbyItem = async (item: any) => {
    if (confirm(`Are you sure you want to delete "${item.name}"? This will remove it from all recipes and models using it.`)) {
      try {
        await deleteHobbyItem(item.id)
      } catch (error) {
        console.error('Error deleting hobby item:', error)
        alert('Failed to delete hobby item. Please try again.')
      }
    }
  }

  const handleDeleteRecipe = async (recipe: any) => {
    if (confirm(`Are you sure you want to delete the recipe "${recipe.name}"? This will remove it from all models using it.`)) {
      await deleteRecipe(recipe.id)
    }
  }

  const handleEditRecipe = (recipe: RecipeWithItems) => {
    setRecipeToEdit(recipe)
    setShowEditRecipeModal(true)
  }

  const handleUpdateRecipe = async (
    recipeId: string,
    name: string,
    description: string | null,
    itemIdsToAdd: number[],
    itemIdsToRemove: number[],
    itemOrders: { recipeItemId: string; displayOrder: number }[]
  ) => {
    try {
      // Update recipe name and description (this doesn't auto-refresh)
      await updateRecipe(recipeId, { name, description })

      // Add new items (skip auto-refresh)
      for (const itemId of itemIdsToAdd) {
        await addItemToRecipe(recipeId, itemId, true)
      }

      // Remove items (skip auto-refresh)
      for (const itemId of itemIdsToRemove) {
        await removeItemFromRecipe(recipeId, itemId, true)
      }

      // Update item order (skip auto-refresh)
      if (itemOrders.length > 0) {
        await reorderRecipeItems(recipeId, itemOrders, true)
      }

      // Now refresh once at the end
      await refetchRecipes()
    } catch (error) {
      console.error('Error updating recipe:', error)
      throw error
    }
  }

  const handleToggleOwnership = async (hobbyItemId: number, currentlyOwned: boolean) => {
    console.log('[HobbyTab] handleToggleOwnership called', { hobbyItemId, currentlyOwned })
    try {
      if (currentlyOwned) {
        console.log('[HobbyTab] Calling removeFromCollection')
        await removeFromCollection(hobbyItemId)
        console.log('[HobbyTab] removeFromCollection completed')
      } else {
        console.log('[HobbyTab] Calling addToCollection')
        await addToCollection(hobbyItemId)
        console.log('[HobbyTab] addToCollection completed')
      }
    } catch (error) {
      console.error('[HobbyTab] Error in handleToggleOwnership:', error)
      throw error
    }
  }

  return (
    <div className="space-y-8">
      {/* Hobby Items Section */}
      <HobbyItemsList
        items={ownedHobbyItems}
        onAddToCollection={() => setShowAddToCollectionModal(true)}
        onDelete={handleDeleteHobbyItem}
      />

      {/* Recipes Section */}
      <RecipesList
        recipes={recipes}
        onCreateNew={() => setShowCreateRecipeModal(true)}
        onEdit={handleEditRecipe}
        onDelete={handleDeleteRecipe}
      />

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={showAddToCollectionModal}
        onClose={() => setShowAddToCollectionModal(false)}
        hobbyItems={allHobbyItems}
        onToggleOwnership={handleToggleOwnership}
        onCreateNew={handleCreateItem}
      />

      {/* Create Recipe Modal */}
      <CreateRecipeModal
        isOpen={showCreateRecipeModal}
        onClose={() => setShowCreateRecipeModal(false)}
        hobbyItems={allHobbyItems}
        onCreate={createRecipe}
      />

      {/* Edit Recipe Modal */}
      <EditRecipeModal
        isOpen={showEditRecipeModal}
        onClose={() => {
          setShowEditRecipeModal(false)
          setRecipeToEdit(null)
        }}
        recipe={recipeToEdit}
        hobbyItems={allHobbyItems}
        onUpdate={handleUpdateRecipe}
      />
    </div>
  )
}
