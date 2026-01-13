import React, { useState, useEffect } from 'react'
import { X, Search, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatAustralianDate } from '../utils/timezone'
import { toTitleCase } from '../utils/textUtils'

interface HobbyItemDetail {
  id: number
  name: string
  type: string
  brand: string | null
  sub_brand: string | null
  swatch: string | null
  section: string | null
}

interface RecipeDetail {
  id: string
  name: string
  description: string | null
  items: {
    id: number
    name: string
    type: string
    brand: string | null
    sub_brand: string | null
    swatch: string | null
  }[]
}

interface ModelWithItems {
  id: string
  name: string
  image_url: string
  game_id: string | null
  box_game_id: string | null
  painted_date: string | null
  paintCount: number
  otherCount: number
  recipeCount: number
  itemIds?: number[] // For grouping comparison
  recipeIds?: string[] // For grouping comparison
  items?: HobbyItemDetail[]
  recipes?: RecipeDetail[]
}

interface ModelGroup {
  id: string // Use first model's ID as group ID
  models: ModelWithItems[]
  displayName: string
  displayImage: string
  mostRecentPaintedDate: string | null
  paintCount: number
  otherCount: number
  recipeCount: number
  game_id: string | null
  box_game_id: string | null
  items?: HobbyItemDetail[]
  recipes?: RecipeDetail[]
}

interface CopyPaintingProcessModalProps {
  isOpen: boolean
  onClose: () => void
  currentModelId: string
  currentModelGameId: string | null
  currentModelBoxGameId: string | null
  onCopyComplete: () => void
}

export function CopyPaintingProcessModal({
  isOpen,
  onClose,
  currentModelId,
  currentModelGameId,
  currentModelBoxGameId,
  onCopyComplete
}: CopyPaintingProcessModalProps) {
  const [models, setModels] = useState<ModelWithItems[]>([])
  const [modelGroups, setModelGroups] = useState<ModelGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set())
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())
  const [currentImageIndices, setCurrentImageIndices] = useState<Map<string, number>>(new Map())
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen && user) {
      fetchModelsWithPaintingData()
    }
  }, [isOpen, user, currentModelId, currentModelGameId, currentModelBoxGameId])

  // Auto-advance image carousel for groups with multiple models
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCurrentImageIndices(prev => {
        const newMap = new Map(prev)

        modelGroups.forEach(group => {
          if (group.models.length > 1) {
            const currentIndex = newMap.get(group.id) || 0
            const nextIndex = (currentIndex + 1) % group.models.length
            newMap.set(group.id, nextIndex)
          }
        })

        return newMap
      })
    }, 3000) // Change image every 3 seconds

    return () => clearInterval(interval)
  }, [isOpen, modelGroups])

  const fetchModelsWithPaintingData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch all models (not just painted ones)
      const { data: modelsData, error: modelsError } = await supabase
        .from('models')
        .select(`
          id,
          name,
          image_url,
          game_id,
          painted_date,
          box:boxes (
            game_id
          )
        `)
        .eq('user_id', user.id)
        .neq('id', currentModelId)

      if (modelsError) throw modelsError

      // For each model, fetch hobby items and recipes count
      const modelsWithCounts = await Promise.all(
        (modelsData || []).map(async (model) => {
          // Get box game_id
          const boxGameId = Array.isArray(model.box) && model.box.length > 0
            ? model.box[0].game_id
            : model.box && typeof model.box === 'object'
              ? (model.box as any).game_id
              : null

          // Fetch hobby items
          const { data: hobbyItemsData, error: itemsError } = await supabase
            .from('model_hobby_items')
            .select(`
              hobby_item:hobby_items (
                type
              )
            `)
            .eq('model_id', model.id)

          if (itemsError) {
            console.error('Error fetching hobby items for model:', model.id, itemsError)
          }

          // Count items by type
          const items = hobbyItemsData || []
          const paintCount = items.filter(item => {
            const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
            return hobbyItem?.type?.toLowerCase() === 'paint'
          }).length

          const otherCount = items.filter(item => {
            const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
            return hobbyItem?.type?.toLowerCase() === 'other'
          }).length

          // Fetch recipes
          const { data: recipesData, error: recipesError } = await supabase
            .from('model_recipes')
            .select('recipe_id')
            .eq('model_id', model.id)

          if (recipesError) {
            console.error('Error fetching recipes for model:', model.id, recipesError)
          }

          const recipeCount = recipesData?.length || 0

          // Only include models that have at least one hobby item or recipe
          if (paintCount + otherCount + recipeCount === 0) {
            return null
          }

          // Extract item IDs (ignoring section) and recipe IDs for grouping
          const itemIds = (hobbyItemsData || [])
            .map(item => {
              const hobbyItem = Array.isArray(item.hobby_item) ? item.hobby_item[0] : item.hobby_item
              return hobbyItem?.id
            })
            .filter(Boolean)
            .sort((a, b) => a - b) // Sort for comparison

          const recipeIds = (recipesData || [])
            .map(r => r.recipe_id)
            .filter(Boolean)
            .sort() // Sort for comparison

          return {
            id: model.id,
            name: model.name,
            image_url: model.image_url,
            game_id: model.game_id,
            box_game_id: boxGameId,
            painted_date: model.painted_date,
            paintCount,
            otherCount,
            recipeCount,
            itemIds,
            recipeIds
          }
        })
      )

      // Filter out null values (models without hobby items or recipes)
      const validModels = modelsWithCounts.filter(model => model !== null) as ModelWithItems[]

      // Sort models: same game first, then others
      const sortedModels = validModels.sort((a, b) => {
        const aIsSameGame = (currentModelGameId && a.game_id === currentModelGameId) ||
                           (currentModelBoxGameId && a.box_game_id === currentModelBoxGameId)
        const bIsSameGame = (currentModelGameId && b.game_id === currentModelGameId) ||
                           (currentModelBoxGameId && b.box_game_id === currentModelBoxGameId)

        if (aIsSameGame && !bIsSameGame) return -1
        if (!aIsSameGame && bIsSameGame) return 1
        return a.name.localeCompare(b.name)
      })

      setModels(sortedModels)

      // Group models by identical items and recipes
      groupModels(sortedModels)
    } catch (error) {
      console.error('Error fetching models with painting data:', error)
      setModels([])
      setModelGroups([])
    } finally {
      setLoading(false)
    }
  }

  const groupModels = (models: ModelWithItems[]) => {
    const groups: ModelGroup[] = []
    const processed = new Set<string>()

    for (const model of models) {
      if (processed.has(model.id)) continue

      // Find all models with identical items and recipes
      const identicalModels = models.filter(m => {
        if (processed.has(m.id)) return false
        return areModelsIdentical(model, m)
      })

      // Mark all as processed
      identicalModels.forEach(m => processed.add(m.id))

      // Sort by painted date (most recent first)
      const sortedByDate = [...identicalModels].sort((a, b) => {
        if (!a.painted_date && !b.painted_date) return 0
        if (!a.painted_date) return 1
        if (!b.painted_date) return -1
        return new Date(b.painted_date).getTime() - new Date(a.painted_date).getTime()
      })

      const mostRecentModel = sortedByDate[0]
      const displayName = identicalModels.length > 1
        ? identicalModels.map(m => m.name).join(', ')
        : mostRecentModel.name

      groups.push({
        id: mostRecentModel.id,
        models: sortedByDate,
        displayName,
        displayImage: mostRecentModel.image_url,
        mostRecentPaintedDate: mostRecentModel.painted_date,
        paintCount: mostRecentModel.paintCount,
        otherCount: mostRecentModel.otherCount,
        recipeCount: mostRecentModel.recipeCount,
        game_id: mostRecentModel.game_id,
        box_game_id: mostRecentModel.box_game_id
      })
    }

    setModelGroups(groups)
  }

  const areModelsIdentical = (model1: ModelWithItems, model2: ModelWithItems): boolean => {
    // Same model
    if (model1.id === model2.id) return true

    // Different item counts
    if (model1.paintCount !== model2.paintCount ||
        model1.otherCount !== model2.otherCount ||
        model1.recipeCount !== model2.recipeCount) {
      return false
    }

    // Both have no items and no recipes
    if (model1.paintCount + model1.otherCount + model1.recipeCount === 0) {
      return false // Don't group empty models
    }

    // Compare actual item IDs (sorted, ignoring sections)
    const items1 = model1.itemIds || []
    const items2 = model2.itemIds || []
    if (items1.length !== items2.length) return false
    if (!items1.every((id, i) => id === items2[i])) return false

    // Compare actual recipe IDs (sorted)
    const recipes1 = model1.recipeIds || []
    const recipes2 = model2.recipeIds || []
    if (recipes1.length !== recipes2.length) return false
    if (!recipes1.every((id, i) => id === recipes2[i])) return false

    return true
  }

  const handleCopyFromModel = async (sourceModelId: string) => {
    setCopying(true)
    try {
      // Fetch all hobby items from the source model
      const { data: sourceItems, error: itemsFetchError } = await supabase
        .from('model_hobby_items')
        .select('hobby_item_id, section')
        .eq('model_id', sourceModelId)

      if (itemsFetchError) throw itemsFetchError

      // Fetch all recipes from the source model
      const { data: sourceRecipes, error: recipesFetchError } = await supabase
        .from('model_recipes')
        .select('recipe_id, description')
        .eq('model_id', sourceModelId)

      if (recipesFetchError) throw recipesFetchError

      // Copy hobby items if any exist
      if (sourceItems && sourceItems.length > 0) {
        const itemsToInsert = sourceItems.map(item => ({
          model_id: currentModelId,
          hobby_item_id: item.hobby_item_id,
          section: item.section
        }))

        const { error: insertItemsError } = await supabase
          .from('model_hobby_items')
          .insert(itemsToInsert)

        if (insertItemsError) throw insertItemsError
      }

      // Copy recipes if any exist
      if (sourceRecipes && sourceRecipes.length > 0) {
        const recipesToInsert = sourceRecipes.map(recipe => ({
          model_id: currentModelId,
          recipe_id: recipe.recipe_id,
          description: recipe.description
        }))

        const { error: insertRecipesError } = await supabase
          .from('model_recipes')
          .insert(recipesToInsert)

        if (insertRecipesError) throw insertRecipesError
      }

      // Close modal and trigger refresh
      handleClose()
      onCopyComplete()
    } catch (error) {
      console.error('Error copying painting process:', error)
      alert('Failed to copy painting process. Please try again.')
    } finally {
      setCopying(false)
    }
  }

  const toggleModelExpansion = async (groupId: string) => {
    const isExpanded = expandedModels.has(groupId)

    if (isExpanded) {
      // Collapse
      setExpandedModels(prev => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    } else {
      // Expand - fetch details if not already loaded
      const group = modelGroups.find(g => g.id === groupId)
      if (group && !group.items && !group.recipes) {
        // Fetch from the first model in the group
        await fetchModelDetails(groupId, group.models[0].id)
      }

      setExpandedModels(prev => {
        const newSet = new Set(prev)
        newSet.add(groupId)
        return newSet
      })
    }
  }

  const fetchModelDetails = async (groupId: string, modelId: string) => {
    setLoadingDetails(prev => new Set(prev).add(groupId))

    try {
      // Fetch hobby items with details
      const { data: itemsData, error: itemsError } = await supabase
        .from('model_hobby_items')
        .select(`
          section,
          hobby_item:hobby_items (
            id,
            name,
            type,
            brand,
            sub_brand,
            swatch
          )
        `)
        .eq('model_id', modelId)

      if (itemsError) throw itemsError

      // Fetch recipes with their items
      const { data: recipesData, error: recipesError } = await supabase
        .from('model_recipes')
        .select(`
          recipe:recipes (
            id,
            name,
            description
          )
        `)
        .eq('model_id', modelId)

      if (recipesError) throw recipesError

      // For each recipe, fetch its items
      const recipesWithItems = await Promise.all(
        (recipesData || []).map(async (modelRecipe) => {
          const recipe = Array.isArray(modelRecipe.recipe)
            ? modelRecipe.recipe[0]
            : modelRecipe.recipe

          if (!recipe) return null

          const { data: recipeItemsData, error: recipeItemsError } = await supabase
            .from('recipe_items')
            .select(`
              hobby_item:hobby_items (
                id,
                name,
                type,
                brand,
                sub_brand,
                swatch
              )
            `)
            .eq('recipe_id', recipe.id)
            .order('display_order', { ascending: true })

          if (recipeItemsError) {
            console.error('Error fetching recipe items:', recipeItemsError)
            return null
          }

          return {
            id: recipe.id,
            name: recipe.name,
            description: recipe.description,
            items: (recipeItemsData || []).map(item => {
              const hobbyItem = Array.isArray(item.hobby_item)
                ? item.hobby_item[0]
                : item.hobby_item
              return hobbyItem
            }).filter(Boolean)
          }
        })
      )

      // Format hobby items
      const items: HobbyItemDetail[] = (itemsData || []).map(item => {
        const hobbyItem = Array.isArray(item.hobby_item)
          ? item.hobby_item[0]
          : item.hobby_item
        return {
          ...hobbyItem,
          section: item.section
        }
      }).filter(Boolean)

      // Update the group with details
      setModelGroups(prev => prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              items,
              recipes: recipesWithItems.filter(Boolean) as RecipeDetail[]
            }
          : group
      ))
    } catch (error) {
      console.error('Error fetching model details:', error)
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setExpandedModels(new Set())
    setCurrentImageIndices(new Map())
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // Filter model groups based on search query
  const filteredGroups = modelGroups.filter(group => {
    const query = searchQuery.toLowerCase()
    return group.displayName.toLowerCase().includes(query)
  })

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-bold text-title">Copy from Another Model</h2>
          <button
            onClick={handleClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-text" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
            />
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
              <span className="ml-3 text-secondary-text">Loading models...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-text">
                {modelGroups.length === 0
                  ? 'No models with painting items or recipes found.'
                  : 'No models match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const isExpanded = expandedModels.has(group.id)
                const isLoadingDetails = loadingDetails.has(group.id)
                const totalItems = group.paintCount + group.otherCount
                const currentImageIndex = currentImageIndices.get(group.id) || 0

                return (
                  <div
                    key={group.id}
                    className="bg-bg-secondary border border-border-custom rounded-lg overflow-hidden"
                  >
                    {/* Header - Always Visible */}
                    <div className="flex items-center p-4">
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleModelExpansion(group.id)}
                        className="flex items-center space-x-4 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                      >
                        {/* Model Image with Auto-Carousel */}
                        <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded border border-border-custom">
                          <div
                            className="flex transition-transform duration-700 ease-in-out h-full"
                            style={{
                              transform: `translateX(-${currentImageIndex * 100}%)`,
                            }}
                          >
                            {group.models.map((model, index) => (
                              <div
                                key={model.id}
                                className="flex-shrink-0 w-16 h-16"
                              >
                                <img
                                  src={model.image_url || '/bp-unkown.svg'}
                                  alt={model.name}
                                  className="w-16 h-16 object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (target.src !== '/bp-unkown.svg') {
                                      target.src = '/bp-unkown.svg'
                                    }
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Model Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-title truncate mb-1">
                            {group.displayName}
                          </h3>
                          <div className="text-sm text-secondary-text">
                            {group.models.length > 1 && (
                              <>
                                <span>{group.models.length} Models</span>
                                <span> • </span>
                              </>
                            )}
                            {totalItems > 0 && (
                              <span>{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
                            )}
                            {group.recipeCount > 0 && (
                              <>
                                {totalItems > 0 && <span>, </span>}
                                <span>{group.recipeCount} Recipe{group.recipeCount !== 1 ? 's' : ''}</span>
                              </>
                            )}
                            {group.mostRecentPaintedDate && (
                              <>
                                <span> • Painted {formatAustralianDate(group.mostRecentPaintedDate)}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Expand Icon */}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-secondary-text flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-secondary-text flex-shrink-0" />
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => handleCopyFromModel(group.models[0].id)}
                        disabled={copying}
                        className="ml-3 p-2 text-brand hover:bg-brand hover:bg-opacity-10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy to current model"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-border-custom p-4 bg-bg-primary">
                        {isLoadingDetails ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-brand)]"></div>
                            <span className="ml-2 text-sm text-secondary-text">Loading details...</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {/* Hobby Items by Section */}
                            {group.items && group.items.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-title text-sm mb-2">Hobby Items</h4>
                                <div className="space-y-3">
                                  {/* Group items by section */}
                                  {Object.entries(
                                    group.items.reduce((acc, item) => {
                                      const section = item.section || 'General'
                                      if (!acc[section]) acc[section] = []
                                      acc[section].push(item)
                                      return acc
                                    }, {} as Record<string, HobbyItemDetail[]>)
                                  ).map(([section, items]) => (
                                    <div key={section}>
                                      <div className="text-xs font-medium text-secondary-text uppercase mb-1">
                                        {section}
                                      </div>
                                      <div className="space-y-1">
                                        {items.map((item) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center space-x-2 text-sm"
                                          >
                                            {item.swatch && (
                                              <div
                                                className="w-4 h-4 rounded border border-border-custom flex-shrink-0"
                                                style={{ backgroundColor: item.swatch }}
                                              />
                                            )}
                                            <span className="text-text">{item.name}</span>
                                            <span className="text-secondary-text text-xs">
                                              ({toTitleCase(item.type)})
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recipes */}
                            {group.recipes && group.recipes.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-title text-sm mb-2">Recipes</h4>
                                <div className="space-y-3">
                                  {group.recipes.map((recipe) => (
                                    <div
                                      key={recipe.id}
                                      className="border border-border-custom rounded p-2 bg-bg-secondary"
                                    >
                                      <div className="font-medium text-text text-sm mb-1">
                                        {recipe.name}
                                      </div>
                                      {recipe.description && (
                                        <div className="text-xs text-secondary-text mb-2">
                                          {recipe.description}
                                        </div>
                                      )}
                                      {recipe.items.length > 0 && (
                                        <div className="space-y-1">
                                          {recipe.items.map((item) => (
                                            <div
                                              key={item.id}
                                              className="flex items-center space-x-2 text-xs ml-2"
                                            >
                                              {item.swatch && (
                                                <div
                                                  className="w-3 h-3 rounded border border-border-custom flex-shrink-0"
                                                  style={{ backgroundColor: item.swatch }}
                                                />
                                              )}
                                              <span className="text-text">{item.name}</span>
                                              <span className="text-secondary-text">
                                                ({toTitleCase(item.type)})
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
