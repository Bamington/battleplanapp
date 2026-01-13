import React, { useState, useEffect } from 'react'
import { X, Search, CheckCircle2 } from 'lucide-react'
import { HobbyItem } from '../hooks/useHobbyItems'
import { toTitleCase } from '../utils/textUtils'

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  hobbyItems: HobbyItem[] // All items (public + user's private) with owned flag
  onToggleOwnership: (hobbyItemId: number, currentlyOwned: boolean) => Promise<void>
  onCreateNew: (item: { name: string; type: string; brand?: string; swatch?: string }) => Promise<void>
}

export function AddToCollectionModal({
  isOpen,
  onClose,
  hobbyItems,
  onToggleOwnership,
  onCreateNew
}: AddToCollectionModalProps) {
  const [mode, setMode] = useState<'browse' | 'create'>('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterTypeSecondary, setFilterTypeSecondary] = useState<string>('all')
  const [filterBrand, setFilterBrand] = useState<string>('all')
  const [filterSubBrand, setFilterSubBrand] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [addingProgress, setAddingProgress] = useState({ current: 0, total: 0 })

  // Create item state
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'Paint',
    brand: '',
    swatch: ''
  })

  // Clear sub-type filter when type filter changes and current selection is no longer valid
  useEffect(() => {
    if (filterType !== 'all' && filterTypeSecondary !== 'all') {
      // Check if current sub-type selection is still valid for the selected type
      const validSubTypes = new Set(
        hobbyItems
          .filter(item => item.type?.toLowerCase() === filterType.toLowerCase())
          .map(item => item.type_secondary)
          .filter(Boolean)
      )

      if (filterTypeSecondary && !validSubTypes.has(filterTypeSecondary)) {
        setFilterTypeSecondary('all')
      }
    }
  }, [filterType, hobbyItems, filterTypeSecondary])

  // Clear sub-brand filter when brand filter changes and current selection is no longer valid
  useEffect(() => {
    if (filterBrand !== 'all' && filterSubBrand !== 'all') {
      // Check if current sub-brand selection is still valid for the selected brand
      const validSubBrands = new Set(
        hobbyItems
          .filter(item => item.brand === filterBrand)
          .map(item => item.sub_brand)
          .filter(Boolean)
      )

      if (filterSubBrand && !validSubBrands.has(filterSubBrand)) {
        setFilterSubBrand('all')
      }
    }
  }, [filterBrand, hobbyItems, filterSubBrand])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleClose = () => {
    setMode('browse')
    setSearchQuery('')
    setFilterType('all')
    setFilterTypeSecondary('all')
    setFilterBrand('all')
    setFilterSubBrand('all')
    setLoading(false)
    setSelectedItems(new Set())
    setNewItem({ name: '', type: 'Paint', brand: '', swatch: '' })
    onClose()
  }

  const toggleSelection = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    // Only select items that are not owned
    const unownedFilteredItems = filteredItems.filter(item => !item.owned)

    if (selectedItems.size === unownedFilteredItems.length && unownedFilteredItems.length > 0) {
      // All unowned items are selected, deselect all
      setSelectedItems(new Set())
    } else {
      // Select all unowned items
      setSelectedItems(new Set(unownedFilteredItems.map(item => item.id)))
    }
  }

  const handleBatchAdd = async () => {
    console.log('[AddToCollectionModal] handleBatchAdd started')
    console.log('[AddToCollectionModal] selectedItems.size:', selectedItems.size)

    if (selectedItems.size === 0) {
      console.log('[AddToCollectionModal] No items selected, returning early')
      return
    }

    setLoading(true)
    const totalItems = selectedItems.size
    setAddingProgress({ current: 0, total: totalItems })
    console.log('[AddToCollectionModal] Loading state set to true')

    try {
      console.log('[AddToCollectionModal] Starting loop through selected items')
      let processedCount = 0

      // Add all selected items to collection
      for (const itemId of selectedItems) {
        console.log(`[AddToCollectionModal] Processing item ${++processedCount}/${selectedItems.size}, itemId:`, itemId)

        const item = hobbyItems.find(i => i.id === itemId)
        console.log('[AddToCollectionModal] Found item:', item ? `${item.name} (owned: ${item.owned})` : 'null')

        if (item && !item.owned) {
          console.log('[AddToCollectionModal] Calling onToggleOwnership for itemId:', itemId)
          await onToggleOwnership(itemId, false)
          console.log('[AddToCollectionModal] onToggleOwnership completed for itemId:', itemId)

          // Update progress
          setAddingProgress({ current: processedCount, total: totalItems })
        } else {
          console.log('[AddToCollectionModal] Skipping item (already owned or not found)')
        }
      }

      console.log('[AddToCollectionModal] All items processed, clearing selection')
      setSelectedItems(new Set())
      console.log('[AddToCollectionModal] Selection cleared')

      // Close modal after successful batch add
      handleClose()
    } catch (error) {
      console.error('[AddToCollectionModal] Error adding items to collection:', error)
      alert('Failed to add items to collection. Please try again.')
    } finally {
      console.log('[AddToCollectionModal] Setting loading to false')
      setLoading(false)
      setAddingProgress({ current: 0, total: 0 })
      console.log('[AddToCollectionModal] handleBatchAdd completed')
    }
  }

  const handleCreateNew = async () => {
    if (!newItem.name.trim()) {
      alert('Please enter a name')
      return
    }

    setLoading(true)
    try {
      await onCreateNew({
        name: newItem.name.trim(),
        type: newItem.type,
        brand: newItem.brand.trim() || undefined,
        swatch: newItem.swatch.trim() || undefined
      })
      handleClose()
    } catch (error) {
      console.error('Error creating hobby item:', error)
      alert('Failed to create item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter hobby items based on search query, type, type_secondary, brand, and sub_brand
  const filteredItems = hobbyItems.filter(item => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      item.name?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.type_secondary?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query) ||
      item.sub_brand?.toLowerCase().includes(query) ||
      item.code?.toLowerCase().includes(query)

    const matchesType = filterType === 'all' || item.type?.toLowerCase() === filterType.toLowerCase()
    const matchesTypeSecondary = filterTypeSecondary === 'all' || item.type_secondary?.toLowerCase() === filterTypeSecondary.toLowerCase()
    const matchesBrand = filterBrand === 'all' || item.brand === filterBrand
    const matchesSubBrand = filterSubBrand === 'all' || item.sub_brand === filterSubBrand

    return matchesSearch && matchesType && matchesTypeSecondary && matchesBrand && matchesSubBrand
  })

  // Get unique values for filter dropdowns
  const uniqueTypes = Array.from(new Set(hobbyItems.map(item => item.type).filter(Boolean)))
    .sort()

  // Filter type_secondary based on selected type
  const uniqueTypeSecondaries = Array.from(new Set(
    hobbyItems
      .filter(item => {
        if (filterType !== 'all') {
          return item.type?.toLowerCase() === filterType.toLowerCase()
        }
        return true
      })
      .map(item => item.type_secondary)
      .filter(Boolean)
  )).sort()

  const uniqueBrands = Array.from(new Set(hobbyItems.map(item => item.brand).filter(Boolean)))
    .sort()

  // Filter sub_brand based on selected brand
  const uniqueSubBrands = Array.from(new Set(
    hobbyItems
      .filter(item => {
        if (filterBrand !== 'all') {
          return item.brand === filterBrand
        }
        return true
      })
      .map(item => item.sub_brand)
      .filter(Boolean)
  )).sort()

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col relative">
        {/* Loading Overlay */}
        {loading && addingProgress.total > 6 && (
          <div className="absolute inset-0 bg-modal-bg bg-opacity-95 rounded-lg flex items-center justify-center z-50">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent" />
              <div className="text-center">
                <p className="text-lg font-semibold text-title mb-1">Adding to collection...</p>
                <p className="text-sm text-secondary-text">
                  {addingProgress.current}/{addingProgress.total} Added
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-bold text-title">Add to Collection</h2>
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
            onClick={() => setMode('browse')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === 'browse'
                ? 'text-brand border-b-2 border-brand'
                : 'text-secondary-text hover:text-text'
            }`}
          >
            Browse Items
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 px-4 font-medium transition-colors ${
              mode === 'create'
                ? 'text-brand border-b-2 border-brand'
                : 'text-secondary-text hover:text-text'
            }`}
          >
            Create New Item
          </button>
        </div>

        {mode === 'browse' ? (
          <>
            {/* Search and Filters */}
        <div className="p-6 border-b border-border-custom">
          <div className="grid grid-cols-1 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-text" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {toTitleCase(type)}
                  </option>
                ))}
              </select>

              {/* Sub-Type Filter */}
              <select
                value={filterTypeSecondary}
                onChange={(e) => setFilterTypeSecondary(e.target.value)}
                className="px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
              >
                <option value="all">All Sub-Types</option>
                {uniqueTypeSecondaries.map(typeSecondary => (
                  <option key={typeSecondary} value={typeSecondary}>
                    {toTitleCase(typeSecondary)}
                  </option>
                ))}
              </select>

              {/* Brand Filter */}
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
              >
                <option value="all">All Brands</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>
                    {toTitleCase(brand)}
                  </option>
                ))}
              </select>

              {/* Sub-Brand Filter */}
              <select
                value={filterSubBrand}
                onChange={(e) => setFilterSubBrand(e.target.value)}
                className="px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
              >
                <option value="all">All Sub-Brands</option>
                {uniqueSubBrands.map(subBrand => (
                  <option key={subBrand} value={subBrand}>
                    {toTitleCase(subBrand)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-secondary-text">
                {hobbyItems.length === 0
                  ? 'No items available. Create some items first!'
                  : 'No items match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Select All Checkbox */}
              {filteredItems.some(item => !item.owned) && (
                <div className="flex items-center space-x-2 pb-2 border-b border-border-custom">
                  <input
                    type="checkbox"
                    checked={selectedItems.size > 0 && selectedItems.size === filteredItems.filter(item => !item.owned).length}
                    onChange={toggleSelectAll}
                    className="rounded border-border-custom"
                  />
                  <label className="text-sm text-secondary-text cursor-pointer" onClick={toggleSelectAll}>
                    Select {filteredItems.filter(item => !item.owned).length} item{filteredItems.filter(item => !item.owned).length !== 1 ? 's' : ''}
                  </label>
                </div>
              )}

              {filteredItems.map((item) => {
                const isOwned = item.owned || false
                const isSelected = selectedItems.has(item.id)

                return (
                  <div
                    key={item.id}
                    onClick={() => !isOwned && toggleSelection(item.id)}
                    className={`p-4 rounded-lg border transition-colors ${
                      isOwned
                        ? 'border-border-custom bg-bg-secondary opacity-50'
                        : isSelected
                        ? 'border-brand bg-brand bg-opacity-10 cursor-pointer'
                        : 'border-border-custom bg-bg-secondary cursor-pointer hover:bg-bg-card'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Checkbox (only for non-owned items) */}
                      {!isOwned && (
                        <div
                          className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                            isSelected
                              ? 'border-brand bg-brand'
                              : 'border-border-custom'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                              <path d="M5 13l4 4L19 7"></path>
                            </svg>
                          )}
                        </div>
                      )}

                      {/* Swatch */}
                      {item.swatch && (
                        <div
                          className="w-8 h-8 rounded border border-border-custom flex-shrink-0"
                          style={{ backgroundColor: item.swatch }}
                        />
                      )}

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-title truncate">
                            {item.name || 'Unnamed Item'}
                          </h4>
                          {/* Owned indicator in heading */}
                          {isOwned && (
                            <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-secondary-text">
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
                          {item.code && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-xs">{item.code}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

            {/* Footer */}
            <div className="p-6 border-t border-border-custom">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-secondary-text">
                  {selectedItems.size > 0 ? (
                    <>{selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected</>
                  ) : (
                    <>Click items to select</>
                  )}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="flex-1 btn-secondary-outline"
                >
                  Close
                </button>
                <button
                  onClick={handleBatchAdd}
                  disabled={loading || selectedItems.size === 0}
                  className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                      <span>Adding...</span>
                    </div>
                  ) : selectedItems.size > 0 ? (
                    `Add ${selectedItems.size} to Collection`
                  ) : (
                    'Add to Collection'
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Create New Item Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Abaddon Black"
                  className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                >
                  <option value="Paint">Paint</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={newItem.brand}
                  onChange={(e) => setNewItem({ ...newItem, brand: e.target.value })}
                  placeholder="e.g., Citadel, Vallejo, Army Painter"
                  className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Color Swatch
                </label>
                <div className="flex space-x-3">
                  <input
                    type="color"
                    value={newItem.swatch || '#000000'}
                    onChange={(e) => setNewItem({ ...newItem, swatch: e.target.value })}
                    className="w-16 h-10 border border-border-custom rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newItem.swatch}
                    onChange={(e) => setNewItem({ ...newItem, swatch: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                  />
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
                  onClick={handleCreateNew}
                  disabled={loading || !newItem.name.trim()}
                  className="flex-1 btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
