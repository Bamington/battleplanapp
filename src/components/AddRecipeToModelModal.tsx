import React, { useState } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { RecipeWithItems } from '../types/recipe.types'
import { HobbyItem } from '../hooks/useHobbyItems'
import { toTitleCase } from '../utils/textUtils'

interface AddRecipeToModelModalProps {
  isOpen: boolean
  onClose: () => void
  recipes: RecipeWithItems[]
  hobbyItems: HobbyItem[]
  onAddRecipe: (recipeId: string, description?: string) => Promise<void>
  onCreateRecipe: (name: string, description: string | null, hobbyItemIds: number[]) => Promise<string>
}

export function AddRecipeToModelModal({ isOpen, onClose, recipes, hobbyItems, onAddRecipe, onCreateRecipe }: AddRecipeToModelModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Create recipe state
  const [recipeName, setRecipeName] = useState('')
  const [recipeDescription, setRecipeDescription] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [itemSearchQuery, setItemSearchQuery] = useState('')

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleClose = () => {
    setMode('select')
    setSearchQuery('')
    setSelectedRecipeId(null)
    setDescription('')
    setRecipeName('')
    setRecipeDescription('')
    setSelectedItemIds(new Set())
    setItemSearchQuery('')
    onClose()
  }

  const handleAdd = async () => {
    if (!selectedRecipeId) {
      alert('Please select a recipe')
      return
    }

    setLoading(true)
    try {
      await onAddRecipe(selectedRecipeId, description.trim() || undefined)
      handleClose()
    } catch (error) {
      console.error('Error adding recipe to model:', error)
      alert('Failed to add recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!recipeName.trim()) {
      alert('Please enter a recipe name')
      return
    }

    if (selectedItemIds.size === 0) {
      alert('Please select at least one hobby item')
      return
    }

    setLoading(true)
    try {
      // Create the recipe and get its ID
      const newRecipeId = await onCreateRecipe(
        recipeName.trim(),
        recipeDescription.trim() || null,
        Array.from(selectedItemIds)
      )

      // Add the newly created recipe to the model
      await onAddRecipe(newRecipeId, description.trim() || undefined)
      handleClose()
    } catch (error) {
      console.error('Error creating and adding recipe:', error)
      alert('Failed to create recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (itemId: number) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe => {
    const query = searchQuery.toLowerCase()
    return recipe.name.toLowerCase().includes(query)
  })

  const selectedRecipe = selectedRecipeId
    ? recipes.find(r => r.id === selectedRecipeId)
    : null

  // Filter hobby items based on search query
  const filteredItems = hobbyItems.filter(item => {
    const query = itemSearchQuery.toLowerCase()
    return (
      item.name?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    )
  })

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-bold text-title">Add Recipe to Model</h2>
          <button
            onClick={handleClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-border-custom">
          <button
            onClick={() => setMode('select')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === 'select'
                ? 'text-brand border-b-2 border-brand'
                : 'text-secondary-text hover:text-text'
            }`}
          >
            Select Existing
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === 'create'
                ? 'text-brand border-b-2 border-brand'
                : 'text-secondary-text hover:text-text'
            }`}
          >
            Create Recipe
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mode === 'select' ? (
            <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
            />
          </div>

          {/* Recipes List */}
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-text">
                {recipes.length === 0
                  ? 'No recipes yet. Create a recipe in the Hobby tab first!'
                  : 'No recipes match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecipes.map((recipe) => {
                const isSelected = selectedRecipeId === recipe.id
                const { paint, other } = recipe.itemCount

                return (
                  <button
                    key={recipe.id}
                    onClick={() => setSelectedRecipeId(recipe.id)}
                    className={`w-full p-4 rounded-lg border transition-colors text-left ${
                      isSelected
                        ? 'border-brand bg-brand bg-opacity-10'
                        : 'border-border-custom bg-bg-secondary hover:bg-bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-title truncate mb-1">
                          {recipe.name}
                        </h4>
                        <div className="flex items-center space-x-3 text-sm text-secondary-text">
                          {paint > 0 && (
                            <span>{paint} Paint{paint !== 1 ? 's' : ''}</span>
                          )}
                          {other > 0 && (
                            <>
                              {paint > 0 && <span>•</span>}
                              <span>{other} Other</span>
                            </>
                          )}
                          {paint === 0 && other === 0 && (
                            <span className="text-xs">No items</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center flex-shrink-0 ml-3">
                          <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Description Field - only show if a recipe is selected */}
          {selectedRecipe && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Used on armor plates"
                className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
              />
              <p className="mt-1 text-xs text-secondary-text">
                Optional note about where this recipe was used on the model
              </p>
            </div>
          )}
          </>
          ) : (
            <>
              {/* Create New Recipe Form */}
              <div className="space-y-4">
                {/* Recipe Name */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Recipe Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g., Gold Trim Recipe"
                    className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                  />
                </div>

                {/* Recipe Description */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Description
                  </label>
                  <textarea
                    value={recipeDescription}
                    onChange={(e) => setRecipeDescription(e.target.value)}
                    placeholder="Optional notes about this recipe..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text resize-none"
                  />
                </div>

                {/* Select Items */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Select Items <span className="text-red-500">*</span>
                  </label>

                  {/* Search */}
                  <div className="mb-3 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-text" />
                    <input
                      type="text"
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      placeholder="Search hobby items..."
                      className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                    />
                  </div>

                  {/* Items List */}
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-secondary-text text-sm">
                        {hobbyItems.length === 0
                          ? 'No hobby items yet. Create some items first!'
                          : 'No items match your search.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-border-custom rounded-md p-2">
                      {filteredItems.map((item) => {
                        const isSelected = selectedItemIds.has(item.id)

                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`w-full p-3 rounded-md border transition-colors text-left ${
                              isSelected
                                ? 'border-brand bg-brand bg-opacity-10'
                                : 'border-border-custom bg-bg-secondary hover:bg-bg-card'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                                isSelected ? 'border-brand bg-brand' : 'border-border-custom'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                )}
                              </div>
                              {item.swatch && (
                                <div
                                  className="w-6 h-6 rounded border border-border-custom flex-shrink-0"
                                  style={{ backgroundColor: item.swatch }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-0.5">
                                  <div className="font-medium text-text text-sm truncate">
                                    {item.name || 'Unnamed Item'}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-secondary-text">
                                  <span className="font-medium">
                                    {toTitleCase(item.type) || 'No Type'}
                                  </span>
                                  {item.brand && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {toTitleCase(item.brand)}
                                        {item.sub_brand && ` (${toTitleCase(item.sub_brand)})`}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Selected Count */}
                  <div className="mt-2 text-sm text-secondary-text">
                    {selectedItemIds.size} item{selectedItemIds.size !== 1 ? 's' : ''} selected
                  </div>
                </div>

                {/* Model Description Field */}
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Usage Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Used on armor plates"
                    className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                  />
                  <p className="mt-1 text-xs text-secondary-text">
                    Optional note about where this recipe was used on the model
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-custom">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 btn-secondary-outline"
            >
              Cancel
            </button>
            {mode === 'select' ? (
              <button
                onClick={handleAdd}
                disabled={loading || !selectedRecipeId}
                className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Recipe'}
              </button>
            ) : (
              <button
                onClick={handleCreateAndAdd}
                disabled={loading || !recipeName.trim() || selectedItemIds.size === 0}
                className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create & Add to Model'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
