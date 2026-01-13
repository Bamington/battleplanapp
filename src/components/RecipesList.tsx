import React, { useState } from 'react'
import { Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { RecipeWithItems } from '../types/recipe.types'
import { toTitleCase } from '../utils/textUtils'

interface RecipesListProps {
  recipes: RecipeWithItems[]
  onCreateNew: () => void
  onEdit?: (recipe: RecipeWithItems) => void
  onDelete?: (recipe: RecipeWithItems) => void
}

export function RecipesList({ recipes, onCreateNew, onEdit, onDelete }: RecipesListProps) {
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(new Set())

  const toggleRecipe = (recipeId: string) => {
    setExpandedRecipes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(recipeId)) {
        newSet.delete(recipeId)
      } else {
        newSet.add(recipeId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-title">Recipes</h3>
        <button
          onClick={onCreateNew}
          className="btn-secondary btn-with-icon"
        >
          <Plus className="w-4 h-4" />
          <span>Create Recipe</span>
        </button>
      </div>

      {/* Recipes List */}
      {recipes.length === 0 ? (
        <div className="text-center py-8 bg-bg-secondary rounded-lg">
          <p className="text-secondary-text">
            No recipes yet. Create your first one!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const isExpanded = expandedRecipes.has(recipe.id)
            const { paint, other } = recipe.itemCount

            return (
              <div
                key={recipe.id}
                className="border border-border-custom rounded-lg bg-bg-secondary"
              >
                {/* Recipe Header */}
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => toggleRecipe(recipe.id)}
                    className="flex-1 flex items-center justify-between text-left hover:bg-bg-card transition-colors rounded px-2 py-1 -mx-2 -my-1"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-title truncate">
                          {recipe.name}
                        </h4>
                      </div>
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
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-secondary-text flex-shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-secondary-text flex-shrink-0 ml-2" />
                    )}
                  </button>

                  {/* Action Buttons */}
                  {(onEdit || onDelete) && (
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(recipe)}
                          className="p-2 text-secondary-text hover:text-text transition-colors"
                          title="Edit recipe"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(recipe)}
                          className="p-2 text-secondary-text hover:text-red-500 transition-colors"
                          title="Delete recipe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Recipe Items (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-border-custom px-4 pb-4 pt-3">
                    {/* Description */}
                    {recipe.description && (
                      <div className="mb-3 p-3 bg-bg-primary rounded border border-border-custom">
                        <p className="text-sm text-text whitespace-pre-wrap">{recipe.description}</p>
                      </div>
                    )}

                    {/* Items */}
                    {recipe.items.length > 0 && (
                      <div className="space-y-2">
                        {recipe.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-3 p-2 bg-bg-primary rounded"
                          >
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && !recipe.description && recipe.items.length === 0 && (
                  <div className="border-t border-border-custom px-4 pb-4 pt-3">
                    <p className="text-sm text-secondary-text text-center">
                      No items in this recipe yet
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
