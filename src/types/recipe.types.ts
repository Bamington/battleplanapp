// Recipe-related type definitions

export interface Recipe {
  id: string
  name: string
  description: string | null
  owner: string
  created_at: string
  updated_at: string
}

export interface RecipeItem {
  id: string
  recipe_id: string
  hobby_item_id: number
  display_order: number
  added_at: string
}

export interface ModelRecipe {
  id: string
  model_id: string
  recipe_id: string
  description: string | null
  added_at: string
}

// Extended recipe with items included
export interface RecipeWithItems extends Recipe {
  items: {
    id: number
    recipe_item_id: string
    name: string | null
    type: string | null
    brand: string | null
    swatch: string | null
    display_order: number
  }[]
  itemCount: {
    paint: number
    other: number
  }
}

// Model recipe with full recipe details
export interface ModelRecipeWithDetails extends ModelRecipe {
  recipe: RecipeWithItems
}
