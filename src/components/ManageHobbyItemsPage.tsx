import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit, Trash2, Search, Package, Filter, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MultiSelectDropdown } from './MultiSelectDropdown'
import { ColorPicker } from './ColorPicker'
import { toTitleCase } from '../utils/textUtils'

interface HobbyItem {
  id: number
  name: string | null
  type: string | null
  type_secondary: string | null
  brand: string | null
  sub_brand: string | null
  code: string | null
  swatch: string | null
  owner: string | null
  public: boolean
  created_at: string
}

interface ManageHobbyItemsPageProps {
  onBack: () => void
}

const ITEM_TYPES = ['Paint', 'Wash', 'Contrast', 'Technical', 'Primer', 'Brush', 'Tool', 'Other']

export function ManageHobbyItemsPage({ onBack }: ManageHobbyItemsPageProps) {
  const { user } = useAuth()
  const [hobbyItems, setHobbyItems] = useState<HobbyItem[]>([])
  const [filteredItems, setFilteredItems] = useState<HobbyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedTypeSecondaries, setSelectedTypeSecondaries] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedSubBrands, setSelectedSubBrands] = useState<string[]>([])
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<HobbyItem | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkType, setBulkType] = useState('')
  const [bulkTypeSecondary, setBulkTypeSecondary] = useState('')
  const [bulkBrand, setBulkBrand] = useState('')
  const [bulkSubBrand, setBulkSubBrand] = useState('')
  const [bulkPublic, setBulkPublic] = useState('')
  const [showReplaceModal, setShowReplaceModal] = useState(false)
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('')
  const [publicItems, setPublicItems] = useState<HobbyItem[]>([])
  const [selectedReplacement, setSelectedReplacement] = useState<HobbyItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'Paint',
    type_secondary: '',
    brand: '',
    sub_brand: '',
    code: '',
    swatch: '',
    public: false
  })

  useEffect(() => {
    fetchHobbyItems()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [hobbyItems, searchQuery, selectedTypes, selectedTypeSecondaries, selectedBrands, selectedSubBrands, showDuplicatesOnly])

  useEffect(() => {
    setShowBulkActions(selectedItems.size > 0)
  }, [selectedItems])

  // Clear invalid sub-brand selections when brand filter changes
  useEffect(() => {
    if (selectedBrands.length > 0 && selectedSubBrands.length > 0) {
      // Calculate valid sub-brands for the selected brands
      const validSubBrands = new Set(
        hobbyItems
          .filter(item => item.brand && selectedBrands.includes(item.brand))
          .map(item => item.sub_brand)
          .filter(Boolean)
      )

      // Filter out any selected sub-brands that are no longer valid
      const stillValidSubBrands = selectedSubBrands.filter(subBrand => validSubBrands.has(subBrand))

      // Update if selections changed
      if (stillValidSubBrands.length !== selectedSubBrands.length) {
        setSelectedSubBrands(stillValidSubBrands)
      }
    }
  }, [selectedBrands, hobbyItems, selectedSubBrands])

  const fetchHobbyItems = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('hobby_items')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setHobbyItems(data || [])
    } catch (err) {
      console.error('Error fetching hobby items:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...hobbyItems]

    // Apply duplicates filter first
    if (showDuplicatesOnly) {
      // Create a map of item names to count occurrences
      const nameCounts = new Map<string, number>()
      hobbyItems.forEach(item => {
        if (item.name) {
          const normalizedName = item.name.toLowerCase().trim()
          nameCounts.set(normalizedName, (nameCounts.get(normalizedName) || 0) + 1)
        }
      })

      // Filter to only show items with duplicate names
      filtered = filtered.filter(item => {
        if (!item.name) return false
        const normalizedName = item.name.toLowerCase().trim()
        return (nameCounts.get(normalizedName) || 0) > 1
      })
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      )
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedTypes.includes('__NONE__')) {
          // Include items with no type OR items matching selected types
          return !item.type || selectedTypes.includes(item.type)
        }
        return item.type && selectedTypes.includes(item.type)
      })
    }

    if (selectedTypeSecondaries.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedTypeSecondaries.includes('__NONE__')) {
          // Include items with no type_secondary OR items matching selected type_secondaries
          return !item.type_secondary || selectedTypeSecondaries.includes(item.type_secondary)
        }
        return item.type_secondary && selectedTypeSecondaries.includes(item.type_secondary)
      })
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedBrands.includes('__NONE__')) {
          // Include items with no brand OR items matching selected brands
          return !item.brand || selectedBrands.includes(item.brand)
        }
        return item.brand && selectedBrands.includes(item.brand)
      })
    }

    if (selectedSubBrands.length > 0) {
      filtered = filtered.filter(item => {
        if (selectedSubBrands.includes('__NONE__')) {
          // Include items with no sub_brand OR items matching selected sub_brands
          return !item.sub_brand || selectedSubBrands.includes(item.sub_brand)
        }
        return item.sub_brand && selectedSubBrands.includes(item.sub_brand)
      })
    }

    setFilteredItems(filtered)
  }

  // Get unique type secondaries from all items
  const uniqueTypeSecondaries = Array.from(new Set(hobbyItems.map(item => item.type_secondary).filter(Boolean))).sort() as string[]

  // Get unique brands from all items
  const uniqueBrands = Array.from(new Set(hobbyItems.map(item => item.brand).filter(Boolean))).sort() as string[]

  // Get unique sub-brands - filtered by selected brands if any
  const uniqueSubBrands = Array.from(new Set(
    hobbyItems
      .filter(item => {
        // If brands are selected, only include items with those brands
        if (selectedBrands.length > 0) {
          return item.brand && selectedBrands.includes(item.brand)
        }
        return true
      })
      .map(item => item.sub_brand)
      .filter(Boolean)
  )).sort() as string[]

  // Helper functions
  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedTypeSecondaries([])
    setSelectedBrands([])
    setSelectedSubBrands([])
    setSearchQuery('')
    setShowDuplicatesOnly(false)
  }

  const hasActiveFilters = selectedTypes.length > 0 || selectedTypeSecondaries.length > 0 || selectedBrands.length > 0 || selectedSubBrands.length > 0 || searchQuery.length > 0 || showDuplicatesOnly

  // Get type counts
  const getTypeCounts = () => {
    const typeCounts = new Map<string, number>()
    hobbyItems.forEach(item => {
      if (item.type) {
        const current = typeCounts.get(item.type) || 0
        typeCounts.set(item.type, current + 1)
      }
    })
    return typeCounts
  }

  // Get type secondary counts
  const getTypeSecondaryCounts = () => {
    const typeSecondaryCounts = new Map<string, number>()
    hobbyItems.forEach(item => {
      if (item.type_secondary) {
        const current = typeSecondaryCounts.get(item.type_secondary) || 0
        typeSecondaryCounts.set(item.type_secondary, current + 1)
      }
    })
    return typeSecondaryCounts
  }

  // Get brand counts
  const getBrandCounts = () => {
    const brandCounts = new Map<string, number>()
    hobbyItems.forEach(item => {
      if (item.brand) {
        const current = brandCounts.get(item.brand) || 0
        brandCounts.set(item.brand, current + 1)
      }
    })
    return brandCounts
  }

  // Get sub-brand counts - filtered by selected brands if any
  const getSubBrandCounts = () => {
    const subBrandCounts = new Map<string, number>()
    hobbyItems
      .filter(item => {
        // If brands are selected, only count items with those brands
        if (selectedBrands.length > 0) {
          return item.brand && selectedBrands.includes(item.brand)
        }
        return true
      })
      .forEach(item => {
        if (item.sub_brand) {
          const current = subBrandCounts.get(item.sub_brand) || 0
          subBrandCounts.set(item.sub_brand, current + 1)
        }
      })
    return subBrandCounts
  }

  const typeCounts = getTypeCounts()
  const typeSecondaryCounts = getTypeSecondaryCounts()
  const brandCounts = getBrandCounts()
  const subBrandCounts = getSubBrandCounts()

  // Calculate counts for items with no value
  const noTypeCount = hobbyItems.filter(item => !item.type).length
  const noTypeSecondaryCount = hobbyItems.filter(item => !item.type_secondary).length
  const noBrandCount = hobbyItems.filter(item => !item.brand).length
  // For sub-brand, filter by selected brands if any (contextual)
  const noSubBrandCount = hobbyItems.filter(item => {
    if (selectedBrands.length > 0) {
      return !item.sub_brand && item.brand && selectedBrands.includes(item.brand)
    }
    return !item.sub_brand
  }).length

  // Convert to MultiSelectDropdown format
  const typeOptions = [
    ...(noTypeCount > 0 ? [{ id: '__NONE__', name: `None (${noTypeCount})` }] : []),
    ...ITEM_TYPES
      .filter(type => (typeCounts.get(type) || 0) > 0)
      .map(type => ({
        id: type,
        name: `${type} (${typeCounts.get(type) || 0})`
      }))
  ]

  const typeSecondaryOptions = [
    ...(noTypeSecondaryCount > 0 ? [{ id: '__NONE__', name: `None (${noTypeSecondaryCount})` }] : []),
    ...uniqueTypeSecondaries
      .filter(typeSecondary => (typeSecondaryCounts.get(typeSecondary) || 0) > 0)
      .map(typeSecondary => ({
        id: typeSecondary,
        name: `${typeSecondary} (${typeSecondaryCounts.get(typeSecondary) || 0})`
      }))
  ]

  const brandOptions = [
    ...(noBrandCount > 0 ? [{ id: '__NONE__', name: `None (${noBrandCount})` }] : []),
    ...uniqueBrands
      .filter(brand => (brandCounts.get(brand) || 0) > 0)
      .map(brand => ({
        id: brand,
        name: `${brand} (${brandCounts.get(brand) || 0})`
      }))
  ]

  const subBrandOptions = [
    ...(noSubBrandCount > 0 ? [{ id: '__NONE__', name: `None (${noSubBrandCount})` }] : []),
    ...uniqueSubBrands
      .filter(subBrand => (subBrandCounts.get(subBrand) || 0) > 0)
      .map(subBrand => ({
        id: subBrand,
        name: `${subBrand} (${subBrandCounts.get(subBrand) || 0})`
      }))
  ]

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return

    if (!confirm(`Are you sure you want to delete ${selectedItems.size} item(s)? This will also remove them from any models using them.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('hobby_items')
        .delete()
        .in('id', Array.from(selectedItems))

      if (error) throw error

      setSelectedItems(new Set())
      fetchHobbyItems()
    } catch (err) {
      console.error('Error deleting items:', err)
      alert('Failed to delete items. Please try again.')
    }
  }

  const handleBulkUpdateType = async () => {
    if (selectedItems.size === 0 || !bulkType) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .update({ type: bulkType })
        .in('id', Array.from(selectedItems))

      if (error) throw error

      setBulkType('')
      setSelectedItems(new Set())
      fetchHobbyItems()
    } catch (err) {
      console.error('Error updating type:', err)
      alert('Failed to update type. Please try again.')
    }
  }

  const handleBulkUpdateTypeSecondary = async () => {
    if (selectedItems.size === 0 || !bulkTypeSecondary.trim()) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .update({ type_secondary: bulkTypeSecondary })
        .in('id', Array.from(selectedItems))

      if (error) throw error

      setBulkTypeSecondary('')
      setSelectedItems(new Set())
      fetchHobbyItems()
    } catch (err) {
      console.error('Error updating type secondary:', err)
      alert('Failed to update type secondary. Please try again.')
    }
  }

  const handleBulkUpdateBrand = async () => {
    if (selectedItems.size === 0 || !bulkBrand.trim()) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .update({ brand: bulkBrand })
        .in('id', Array.from(selectedItems))

      if (error) throw error

      setBulkBrand('')
      setSelectedItems(new Set())
      fetchHobbyItems()
    } catch (err) {
      console.error('Error updating brand:', err)
      alert('Failed to update brand. Please try again.')
    }
  }

  const handleBulkUpdateSubBrand = async () => {
    if (selectedItems.size === 0 || !bulkSubBrand.trim()) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .update({ sub_brand: bulkSubBrand })
        .in('id', Array.from(selectedItems))

      if (error) throw error

      setBulkSubBrand('')
      setSelectedItems(new Set())
      fetchHobbyItems()
    } catch (err) {
      console.error('Error updating sub-brand:', err)
      alert('Failed to update sub-brand. Please try again.')
    }
  }

  // Consolidated batch update
  const handleBatchUpdate = async () => {
    if (selectedItems.size === 0) return

    // Build update object with only non-empty fields
    const updates: any = {}
    if (bulkType) updates.type = bulkType
    if (bulkTypeSecondary.trim()) updates.type_secondary = bulkTypeSecondary
    if (bulkBrand.trim()) updates.brand = bulkBrand
    if (bulkSubBrand.trim()) updates.sub_brand = bulkSubBrand
    if (bulkPublic) updates.public = bulkPublic === 'true'

    // If no fields to update, return early
    if (Object.keys(updates).length === 0) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .update(updates)
        .in('id', Array.from(selectedItems))

      if (error) throw error

      // Clear all fields
      setBulkType('')
      setBulkTypeSecondary('')
      setBulkBrand('')
      setBulkSubBrand('')
      setBulkPublic('')
      setSelectedItems(new Set())
      fetchHobbyItems()
    } catch (err) {
      console.error('Error updating items:', err)
      alert('Failed to update items. Please try again.')
    }
  }

  // Calculate how many fields have values
  const getUpdateCount = () => {
    let count = 0
    if (bulkType) count++
    if (bulkTypeSecondary.trim()) count++
    if (bulkBrand.trim()) count++
    if (bulkSubBrand.trim()) count++
    if (bulkPublic) count++
    return count
  }

  const openReplaceModal = async () => {
    try {
      // Fetch all public items
      const { data, error } = await supabase
        .from('hobby_items')
        .select('*')
        .eq('public', true)
        .order('name', { ascending: true })

      if (error) throw error

      setPublicItems(data || [])
      setShowReplaceModal(true)
      setReplaceSearchQuery('')
      setSelectedReplacement(null)
    } catch (err) {
      console.error('Error fetching public items:', err)
      alert('Failed to load public items. Please try again.')
    }
  }

  const handleBulkReplace = async () => {
    if (selectedItems.size === 0 || !selectedReplacement) return

    const confirmMessage = `This will replace ${selectedItems.size} item(s) with "${selectedReplacement.name}". All model relationships will be updated. This cannot be undone. Continue?`
    if (!confirm(confirmMessage)) return

    try {
      const duplicateIds = Array.from(selectedItems)
      const officialId = selectedReplacement.id

      // Step 1: Fetch all model_hobby_items entries for the duplicate items
      const { data: junctionEntries, error: fetchError } = await supabase
        .from('model_hobby_items')
        .select('*')
        .in('hobby_item_id', duplicateIds)

      if (fetchError) throw fetchError

      if (!junctionEntries || junctionEntries.length === 0) {
        // No relationships to update, just delete the duplicates
        const { error: deleteError } = await supabase
          .from('hobby_items')
          .delete()
          .in('id', duplicateIds)

        if (deleteError) throw deleteError

        setShowReplaceModal(false)
        setSelectedItems(new Set())
        setSelectedReplacement(null)
        fetchHobbyItems()
        alert('Items replaced successfully!')
        return
      }

      // Step 2: Group by model_id to handle deduplication
      const modelGroups = new Map<number, typeof junctionEntries>()
      junctionEntries.forEach(entry => {
        const existing = modelGroups.get(entry.model_id) || []
        modelGroups.set(entry.model_id, [...existing, entry])
      })

      // Step 3: For each model, determine what to do
      for (const [modelId, entries] of modelGroups) {
        // Check if this model already has the official item
        const { data: existingOfficial, error: checkError } = await supabase
          .from('model_hobby_items')
          .select('*')
          .eq('model_id', modelId)
          .eq('hobby_item_id', officialId)

        if (checkError) throw checkError

        if (existingOfficial && existingOfficial.length > 0) {
          // Model already has the official item - keep both instances of official
          // Just delete the duplicate entries from junction table
          const duplicateEntryIds = entries.map(e => e.id)
          const { error: deleteJunctionError } = await supabase
            .from('model_hobby_items')
            .delete()
            .in('id', duplicateEntryIds)

          if (deleteJunctionError) throw deleteJunctionError
        } else {
          // Model doesn't have the official item yet
          // Replace the first duplicate entry with official, delete the rest
          const firstEntry = entries[0]
          const restEntries = entries.slice(1)

          // Update the first entry to point to official item, preserving section
          const { error: updateError } = await supabase
            .from('model_hobby_items')
            .update({ hobby_item_id: officialId })
            .eq('id', firstEntry.id)

          if (updateError) throw updateError

          // Delete the remaining duplicate entries if there are multiple
          if (restEntries.length > 0) {
            const restIds = restEntries.map(e => e.id)
            const { error: deleteRestError } = await supabase
              .from('model_hobby_items')
              .delete()
              .in('id', restIds)

            if (deleteRestError) throw deleteRestError
          }
        }
      }

      // Step 3.5: Update recipe_items relationships
      const { data: recipeItems, error: recipeItemsError } = await supabase
        .from('recipe_items')
        .select('*')
        .in('hobby_item_id', duplicateIds)

      if (recipeItemsError) throw recipeItemsError

      if (recipeItems && recipeItems.length > 0) {
        // Group recipe items by recipe_id to handle duplicates
        const recipeGroups = new Map<string, typeof recipeItems>()
        recipeItems.forEach(item => {
          const existing = recipeGroups.get(item.recipe_id) || []
          recipeGroups.set(item.recipe_id, [...existing, item])
        })

        // For each recipe, handle the replacement
        for (const [recipeId, items] of recipeGroups) {
          // Check if this recipe already has the official item
          const { data: existingRecipeOfficial, error: recipeCheckError } = await supabase
            .from('recipe_items')
            .select('*')
            .eq('recipe_id', recipeId)
            .eq('hobby_item_id', officialId)

          if (recipeCheckError) throw recipeCheckError

          if (existingRecipeOfficial && existingRecipeOfficial.length > 0) {
            // Recipe already has the official item - just delete the duplicate entries
            const duplicateRecipeItemIds = items.map(i => i.id)
            const { error: deleteRecipeItemError } = await supabase
              .from('recipe_items')
              .delete()
              .in('id', duplicateRecipeItemIds)

            if (deleteRecipeItemError) throw deleteRecipeItemError
          } else {
            // Recipe doesn't have the official item yet - update the first entry, delete the rest
            const firstRecipeItem = items[0]
            const restRecipeItems = items.slice(1)

            const { error: updateRecipeItemError } = await supabase
              .from('recipe_items')
              .update({ hobby_item_id: officialId })
              .eq('id', firstRecipeItem.id)

            if (updateRecipeItemError) throw updateRecipeItemError

            if (restRecipeItems.length > 0) {
              const restRecipeItemIds = restRecipeItems.map(i => i.id)
              const { error: deleteRestRecipeItemError } = await supabase
                .from('recipe_items')
                .delete()
                .in('id', restRecipeItemIds)

              if (deleteRestRecipeItemError) throw deleteRestRecipeItemError
            }
          }
        }
      }

      // Step 4: Delete the duplicate hobby items (but never delete the official item)
      const itemsToDelete = duplicateIds.filter(id => id !== officialId)

      if (itemsToDelete.length > 0) {
        const { error: deleteItemsError } = await supabase
          .from('hobby_items')
          .delete()
          .in('id', itemsToDelete)

        if (deleteItemsError) throw deleteItemsError
      }

      setShowReplaceModal(false)
      setSelectedItems(new Set())
      setSelectedReplacement(null)
      fetchHobbyItems()
      alert('Items replaced successfully!')
    } catch (err) {
      console.error('Error replacing items:', err)
      alert('Failed to replace items. Please try again.')
    }
  }

  const handleAdd = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .insert({
          name: formData.name,
          type: formData.type,
          type_secondary: formData.type_secondary || null,
          brand: formData.brand || null,
          sub_brand: formData.sub_brand || null,
          code: formData.code || null,
          swatch: formData.swatch || null,
          public: formData.public,
          owner: user.id
        })

      if (error) throw error

      setShowAddModal(false)
      setFormData({ name: '', type: 'Paint', type_secondary: '', brand: '', sub_brand: '', code: '', swatch: '', public: false })
      fetchHobbyItems()
    } catch (err) {
      console.error('Error adding hobby item:', err)
      alert('Failed to add hobby item. Please try again.')
    }
  }

  const handleEdit = async () => {
    if (!selectedItem) return

    try {
      const { error } = await supabase
        .from('hobby_items')
        .update({
          name: formData.name,
          type: formData.type,
          type_secondary: formData.type_secondary || null,
          brand: formData.brand || null,
          sub_brand: formData.sub_brand || null,
          code: formData.code || null,
          swatch: formData.swatch || null,
          public: formData.public
        })
        .eq('id', selectedItem.id)

      if (error) throw error

      setShowEditModal(false)
      setSelectedItem(null)
      setFormData({ name: '', type: 'Paint', type_secondary: '', brand: '', sub_brand: '', code: '', swatch: '', public: false })
      fetchHobbyItems()
    } catch (err) {
      console.error('Error updating hobby item:', err)
      alert('Failed to update hobby item. Please try again.')
    }
  }

  const handleDelete = async (item: HobbyItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This will also remove it from any models using it.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('hobby_items')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      fetchHobbyItems()
    } catch (err) {
      console.error('Error deleting hobby item:', err)
      alert('Failed to delete hobby item. Please try again.')
    }
  }

  const openAddModal = () => {
    // Prefill form with current filter values (if single selection and not "None")
    const prefillType = selectedTypes.length === 1 && selectedTypes[0] !== '__NONE__' ? selectedTypes[0] : 'Paint'
    const prefillTypeSecondary = selectedTypeSecondaries.length === 1 && selectedTypeSecondaries[0] !== '__NONE__' ? selectedTypeSecondaries[0] : ''
    const prefillBrand = selectedBrands.length === 1 && selectedBrands[0] !== '__NONE__' ? selectedBrands[0] : ''
    const prefillSubBrand = selectedSubBrands.length === 1 && selectedSubBrands[0] !== '__NONE__' ? selectedSubBrands[0] : ''

    setFormData({
      name: '',
      type: prefillType,
      type_secondary: prefillTypeSecondary,
      brand: prefillBrand,
      sub_brand: prefillSubBrand,
      code: '',
      swatch: '',
      public: false
    })
    setShowAddModal(true)
  }

  const openEditModal = (item: HobbyItem) => {
    setSelectedItem(item)
    setFormData({
      name: item.name || '',
      type: item.type || 'Paint',
      type_secondary: item.type_secondary || '',
      brand: item.brand || '',
      sub_brand: item.sub_brand || '',
      code: item.code || '',
      swatch: item.swatch || '',
      public: item.public || false
    })
    setShowEditModal(true)
  }

  return (
    <div className="min-h-screen bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin</span>
          </button>
          <h1 className="text-4xl font-bold text-title mb-2">Manage Hobby Items</h1>
          <p className="text-secondary-text">Manage the database of hobby supplies and paints</p>
        </div>

        {/* Add Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={openAddModal}
            className="btn-secondary btn-with-icon"
          >
            <Plus className="w-5 h-5" />
            <span>Add Hobby Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-bg-card rounded-lg border border-border-custom p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-icon" />
              <span className="text-lg font-semibold text-text">Filters</span>
              {hasActiveFilters && (
                <span className="bg-[var(--color-brand)] text-white text-xs px-2 py-1 rounded-full">
                  {selectedTypes.length + selectedTypeSecondaries.length + selectedBrands.length + selectedSubBrands.length + (searchQuery ? 1 : 0) + (showDuplicatesOnly ? 1 : 0)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-secondary-text hover:text-text transition-colors flex items-center space-x-1"
                >
                  <X className="w-4 h-4" />
                  <span>Clear</span>
                </button>
              )}
              <button
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="text-sm text-secondary-text hover:text-text transition-colors"
              >
                {isFiltersExpanded ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>

          {isFiltersExpanded && (
            <>
              {/* Show Duplicates Checkbox */}
              <div className="mt-4 mb-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-duplicates"
                    checked={showDuplicatesOnly}
                    onChange={(e) => setShowDuplicatesOnly(e.target.checked)}
                    className="rounded border-border-custom"
                  />
                  <label htmlFor="show-duplicates" className="text-sm font-medium text-text cursor-pointer">
                    Only show duplicates (by name)
                  </label>
                </div>
              </div>

              {/* Search Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                  Search Items
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, type, or brand..."
                    className="w-full pl-10 pr-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Types
                  </label>
                  <MultiSelectDropdown
                    options={typeOptions}
                    selectedOptions={selectedTypes}
                    onSelectionChange={setSelectedTypes}
                    placeholder="All Types"
                  />
                </div>

                {/* Type Secondary Filter */}
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Type Secondary
                  </label>
                  <MultiSelectDropdown
                    options={typeSecondaryOptions}
                    selectedOptions={selectedTypeSecondaries}
                    onSelectionChange={setSelectedTypeSecondaries}
                    placeholder="All Type Secondaries"
                  />
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Brands
                  </label>
                  <MultiSelectDropdown
                    options={brandOptions}
                    selectedOptions={selectedBrands}
                    onSelectionChange={setSelectedBrands}
                    placeholder="All Brands"
                  />
                </div>

                {/* Sub-Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Sub-Brands
                  </label>
                  <MultiSelectDropdown
                    options={subBrandOptions}
                    selectedOptions={selectedSubBrands}
                    onSelectionChange={setSelectedSubBrands}
                    placeholder="All Sub-Brands"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bulk Actions Toolbar */}
        {showBulkActions && (
          <div className="mb-4 bg-bg-card rounded-lg border border-border-custom p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-sm font-medium text-text">
                {selectedItems.size} item(s) selected
              </div>

              <select
                value={bulkType}
                onChange={(e) => setBulkType(e.target.value)}
                className="px-3 py-1 text-sm border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-bg-secondary text-text"
              >
                <option value="">Change Type...</option>
                {ITEM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <input
                type="text"
                value={bulkTypeSecondary}
                onChange={(e) => setBulkTypeSecondary(e.target.value)}
                placeholder="New type secondary..."
                className="px-3 py-1 text-sm border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-bg-secondary text-text"
              />

              <input
                type="text"
                value={bulkBrand}
                onChange={(e) => setBulkBrand(e.target.value)}
                placeholder="New brand..."
                className="px-3 py-1 text-sm border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-bg-secondary text-text"
              />

              <input
                type="text"
                value={bulkSubBrand}
                onChange={(e) => setBulkSubBrand(e.target.value)}
                placeholder="New sub-brand..."
                className="px-3 py-1 text-sm border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-bg-secondary text-text"
              />

              <select
                value={bulkPublic}
                onChange={(e) => setBulkPublic(e.target.value)}
                className="px-3 py-1 text-sm border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-bg-secondary text-text"
              >
                <option value="">Set Visibility...</option>
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>

              <button
                onClick={handleBatchUpdate}
                disabled={getUpdateCount() === 0}
                className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getUpdateCount() > 0 ? `Update ${getUpdateCount()} Value${getUpdateCount() !== 1 ? 's' : ''}` : 'Update Values'}
              </button>

              <button
                onClick={openReplaceModal}
                className="btn-secondary text-sm"
              >
                Replace with...
              </button>

              <button
                onClick={handleBulkDelete}
                className="btn-danger text-sm ml-auto"
              >
                Delete Selected
              </button>

              <button
                onClick={() => setSelectedItems(new Set())}
                className="text-secondary-text hover:text-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand)]"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-secondary-text mx-auto mb-4 opacity-50" />
            <p className="text-lg text-secondary-text">
              {searchQuery ? 'No items match your search' : 'No hobby items found'}
            </p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-lg border border-border-custom overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border-custom"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Swatch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Public
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-text uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-secondary transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="rounded border-border-custom"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.swatch ? (
                          <div
                            className="w-8 h-8 rounded border border-border-custom"
                            style={{ backgroundColor: item.swatch }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded border border-border-custom bg-bg-secondary" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text">{item.name || 'Unnamed'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text">{toTitleCase(item.type) || 'N/A'}</div>
                        {item.type_secondary && (
                          <div className="text-xs text-secondary-text">({toTitleCase(item.type_secondary)})</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text">{toTitleCase(item.brand) || 'N/A'}</div>
                        {item.sub_brand && (
                          <div className="text-xs text-secondary-text">({toTitleCase(item.sub_brand)})</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.public ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Private
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(item)}
                          className="text-secondary-text hover:text-text transition-colors mr-4"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-secondary-text hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Show total count */}
        {!loading && filteredItems.length > 0 && (
          <div className="mt-4 text-sm text-secondary-text text-center">
            Showing {filteredItems.length} of {hobbyItems.length} items
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-title mb-6">Add Hobby Item</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Mephiston Red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                >
                  <option value="Paint">Paint</option>
                  <option value="Wash">Wash</option>
                  <option value="Contrast">Contrast</option>
                  <option value="Technical">Technical</option>
                  <option value="Primer">Primer</option>
                  <option value="Brush">Brush</option>
                  <option value="Tool">Tool</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type Secondary
                </label>
                <input
                  type="text"
                  value={formData.type_secondary}
                  onChange={(e) => setFormData({ ...formData, type_secondary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Base, Layer, Shade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Citadel, Vallejo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Sub-Brand
                </label>
                <input
                  type="text"
                  value={formData.sub_brand}
                  onChange={(e) => setFormData({ ...formData, sub_brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Layer, Base, Air"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Code / SKU
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 21-04"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Color Swatch (Hex Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.swatch}
                    onChange={(e) => setFormData({ ...formData, swatch: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                    placeholder="#FF0000"
                  />
                  <ColorPicker
                    value={formData.swatch}
                    onChange={(color) => setFormData({ ...formData, swatch: color })}
                  />
                  {formData.swatch && (
                    <div
                      className="w-10 h-10 rounded border border-border-custom"
                      style={{ backgroundColor: formData.swatch }}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-public"
                  checked={formData.public}
                  onChange={(e) => setFormData({ ...formData, public: e.target.checked })}
                  className="rounded border-border-custom"
                />
                <label htmlFor="add-public" className="text-sm font-medium text-text cursor-pointer">
                  Public (visible in user searches)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={!formData.name.trim()}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-title mb-6">Edit Hobby Item</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                >
                  <option value="Paint">Paint</option>
                  <option value="Wash">Wash</option>
                  <option value="Contrast">Contrast</option>
                  <option value="Technical">Technical</option>
                  <option value="Primer">Primer</option>
                  <option value="Brush">Brush</option>
                  <option value="Tool">Tool</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type Secondary
                </label>
                <input
                  type="text"
                  value={formData.type_secondary}
                  onChange={(e) => setFormData({ ...formData, type_secondary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Base, Layer, Shade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Sub-Brand
                </label>
                <input
                  type="text"
                  value={formData.sub_brand}
                  onChange={(e) => setFormData({ ...formData, sub_brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Layer, Base, Air"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Code / SKU
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., 21-04"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Color Swatch (Hex Code)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.swatch}
                    onChange={(e) => setFormData({ ...formData, swatch: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] dark:bg-gray-700 dark:text-white"
                    placeholder="#FF0000"
                  />
                  {formData.swatch && (
                    <div
                      className="w-10 h-10 rounded border border-border-custom"
                      style={{ backgroundColor: formData.swatch }}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-public"
                  checked={formData.public}
                  onChange={(e) => setFormData({ ...formData, public: e.target.checked })}
                  className="rounded border-border-custom"
                />
                <label htmlFor="edit-public" className="text-sm font-medium text-text cursor-pointer">
                  Public (visible in user searches)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedItem(null)
                }}
                className="btn-secondary-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={!formData.name.trim()}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-modal-bg rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-title mb-4">Replace Selected Items</h2>
            <p className="text-sm text-secondary-text mb-6">
              Select a public item to replace {selectedItems.size} selected item(s). All model relationships will be updated.
            </p>

            {/* Search Field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text mb-2">
                Search Public Items
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-4 h-4" />
                <input
                  type="text"
                  value={replaceSearchQuery}
                  onChange={(e) => setReplaceSearchQuery(e.target.value)}
                  placeholder="Search by name, type, or brand..."
                  className="w-full pl-10 pr-3 py-2 border border-border-custom rounded-lg bg-bg-primary text-text placeholder-secondary-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="max-h-96 overflow-y-auto border border-border-custom rounded-lg mb-6">
              {publicItems
                .filter(item => {
                  if (!replaceSearchQuery.trim()) return true
                  const query = replaceSearchQuery.toLowerCase()
                  return (
                    item.name?.toLowerCase().includes(query) ||
                    item.type?.toLowerCase().includes(query) ||
                    item.brand?.toLowerCase().includes(query)
                  )
                })
                .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedReplacement(item)}
                    className={`p-3 border-b border-border-custom cursor-pointer hover:bg-bg-secondary transition-colors ${
                      selectedReplacement?.id === item.id ? 'bg-brand bg-opacity-10 border-l-4 border-l-brand' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {item.swatch ? (
                        <div
                          className="w-10 h-10 rounded border border-border-custom flex-shrink-0"
                          style={{ backgroundColor: item.swatch }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded border border-border-custom bg-bg-secondary flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text">{item.name || 'Unnamed'}</div>
                        <div className="text-xs text-secondary-text">
                          {toTitleCase(item.brand) || 'Unknown Brand'} {item.sub_brand && `(${toTitleCase(item.sub_brand)})`} • {toTitleCase(item.type) || 'Unknown Type'}
                          {item.code && ` • ${item.code}`}
                        </div>
                      </div>
                      {selectedReplacement?.id === item.id && (
                        <div className="text-brand font-medium text-sm">Selected</div>
                      )}
                    </div>
                  </div>
                ))}
              {publicItems.filter(item => {
                if (!replaceSearchQuery.trim()) return true
                const query = replaceSearchQuery.toLowerCase()
                return (
                  item.name?.toLowerCase().includes(query) ||
                  item.type?.toLowerCase().includes(query) ||
                  item.brand?.toLowerCase().includes(query)
                )
              }).length === 0 && (
                <div className="p-8 text-center text-secondary-text">
                  No public items found
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReplaceModal(false)
                  setSelectedReplacement(null)
                  setReplaceSearchQuery('')
                }}
                className="btn-secondary-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReplace}
                disabled={!selectedReplacement}
                className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Replace Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
