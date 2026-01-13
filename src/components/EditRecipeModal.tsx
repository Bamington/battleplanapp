import React, { useState, useEffect } from 'react'
import { X, Search, GripVertical, Trash2 } from 'lucide-react'
import { HobbyItem } from '../hooks/useHobbyItems'
import { RecipeWithItems } from '../types/recipe.types'
import { toTitleCase } from '../utils/textUtils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface EditRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  recipe: RecipeWithItems | null
  hobbyItems: HobbyItem[]
  onUpdate: (
    recipeId: string,
    name: string,
    description: string | null,
    itemIdsToAdd: number[],
    itemIdsToRemove: number[],
    itemOrders: { recipeItemId: string; displayOrder: number }[]
  ) => Promise<void>
}

// Sortable item component
function SortableItem({ item, onRemove }: { item: RecipeWithItems['items'][0], onRemove: (itemId: number) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.recipe_item_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-2 bg-bg-primary rounded border border-border-custom"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-secondary-text hover:text-text p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </button>
      {item.swatch && (
        <div
          className="w-5 h-5 rounded border border-border-custom flex-shrink-0"
          style={{ backgroundColor: item.swatch }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-text text-sm truncate">
          {item.name || 'Unnamed Item'}
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
      <button
        onClick={() => onRemove(item.id)}
        className="p-1 text-secondary-text hover:text-red-500 transition-colors flex-shrink-0"
        title="Remove from recipe"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export function EditRecipeModal({ isOpen, onClose, recipe, hobbyItems, onUpdate }: EditRecipeModalProps) {
  const [recipeName, setRecipeName] = useState('')
  const [recipeDescription, setRecipeDescription] = useState('')
  const [orderedItems, setOrderedItems] = useState<RecipeWithItems['items']>([])
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [initialItemIds, setInitialItemIds] = useState<Set<number>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize state when recipe changes
  useEffect(() => {
    if (recipe) {
      setRecipeName(recipe.name)
      setRecipeDescription(recipe.description || '')
      setOrderedItems([...recipe.items])
      const itemIds = new Set(recipe.items.map(item => item.id))
      setSelectedItemIds(itemIds)
      setInitialItemIds(itemIds)
    }
  }, [recipe])

  if (!isOpen || !recipe) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleClose = () => {
    setRecipeName('')
    setRecipeDescription('')
    setOrderedItems([])
    setSelectedItemIds(new Set())
    setInitialItemIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.recipe_item_id === active.id)
        const newIndex = items.findIndex((item) => item.recipe_item_id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleItem = (itemId: number) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
        // Remove from orderedItems if deselected
        setOrderedItems(current => current.filter(item => item.id !== itemId))
      } else {
        newSet.add(itemId)
        // Add to orderedItems if newly selected
        const hobbyItem = hobbyItems.find(item => item.id === itemId)
        if (hobbyItem) {
          // Create a temporary recipe_item_id for new items
          const newItem = {
            id: hobbyItem.id,
            recipe_item_id: `temp_${hobbyItem.id}`,
            name: hobbyItem.name,
            type: hobbyItem.type,
            brand: hobbyItem.brand,
            swatch: hobbyItem.swatch,
            display_order: orderedItems.length
          }
          setOrderedItems(current => [...current, newItem])
        }
      }
      return newSet
    })
  }

  const handleRemoveItem = (itemId: number) => {
    // Remove from selected items
    setSelectedItemIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
    // Remove from ordered items
    setOrderedItems(current => current.filter(item => item.id !== itemId))
  }

  const handleUpdate = async () => {
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
      // Calculate which items were added and removed
      const itemIdsToAdd = Array.from(selectedItemIds).filter(id => !initialItemIds.has(id))
      const itemIdsToRemove = Array.from(initialItemIds).filter(id => !selectedItemIds.has(id))

      // Build item order array (only for existing items, not new ones with temp_ prefix)
      const itemOrders = orderedItems
        .filter(item => !item.recipe_item_id.startsWith('temp_'))
        .map((item, index) => ({
          recipeItemId: item.recipe_item_id,
          displayOrder: index
        }))

      await onUpdate(
        recipe.id,
        recipeName.trim(),
        recipeDescription.trim() || null,
        itemIdsToAdd,
        itemIdsToRemove,
        itemOrders
      )
      handleClose()
    } catch (error) {
      console.error('Error updating recipe:', error)
      alert('Failed to update recipe. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter items based on search query
  const filteredItems = hobbyItems.filter(item => {
    const query = searchQuery.toLowerCase()
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
          <h2 className="text-xl font-bold text-title">Edit Recipe</h2>
          <button
            onClick={handleClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
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

          {/* Current Items - Drag to Reorder */}
          {orderedItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Current Items (Drag to reorder)
              </label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedItems.map(item => item.recipe_item_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {orderedItems.map((item) => (
                      <SortableItem key={item.recipe_item_id} item={item} onRemove={handleRemoveItem} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                            <span className="font-medium">{toTitleCase(item.type) || 'No Type'}</span>
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
            <button
              onClick={handleUpdate}
              disabled={loading || !recipeName.trim() || selectedItemIds.size === 0}
              className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
