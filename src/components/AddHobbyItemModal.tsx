import React, { useState } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { HobbyItem } from '../hooks/useHobbyItems'
import { toTitleCase } from '../utils/textUtils'

interface AddHobbyItemModalProps {
  isOpen: boolean
  onClose: () => void
  hobbyItems: HobbyItem[]
  onAddExisting: (hobbyItemId: number, section?: string) => Promise<void>
  onCreateNew: (hobbyItem: { name: string; type: string; brand?: string; swatch?: string }) => Promise<HobbyItem>
}

export function AddHobbyItemModal({
  isOpen,
  onClose,
  hobbyItems,
  onAddExisting,
  onCreateNew
}: AddHobbyItemModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [section, setSection] = useState('')
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'Paint',
    brand: '',
    swatch: ''
  })

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleClose = () => {
    setMode('select')
    setSearchQuery('')
    setSection('')
    setNewItem({ name: '', type: 'Paint', brand: '', swatch: '' })
    onClose()
  }

  const handleAddExisting = async (hobbyItemId: number) => {
    console.log('[AddHobbyItemModal] handleAddExisting called, hobbyItemId:', hobbyItemId, 'section:', section)
    setLoading(true)
    try {
      console.log('[AddHobbyItemModal] Calling onAddExisting')
      await onAddExisting(hobbyItemId, section || undefined)
      console.log('[AddHobbyItemModal] onAddExisting completed, closing modal')
      handleClose()
    } catch (error) {
      console.error('[AddHobbyItemModal] Error adding hobby item to model:', error)
      alert('Failed to add item. Please try again.')
    } finally {
      console.log('[AddHobbyItemModal] Setting loading to false')
      setLoading(false)
    }
  }

  const handleCreateNew = async () => {
    console.log('[AddHobbyItemModal] handleCreateNew called, newItem:', newItem)
    if (!newItem.name.trim() || !newItem.type.trim()) {
      console.log('[AddHobbyItemModal] Validation failed: missing name or type')
      alert('Name and Type are required fields')
      return
    }

    console.log('[AddHobbyItemModal] Setting loading to true')
    setLoading(true)
    try {
      console.log('[AddHobbyItemModal] Calling onCreateNew')
      const created = await onCreateNew({
        name: newItem.name.trim(),
        type: newItem.type.trim(),
        brand: newItem.brand.trim() || undefined,
        swatch: newItem.swatch.trim() || undefined
      })

      console.log('[AddHobbyItemModal] Created hobby item:', created)
      console.log('[AddHobbyItemModal] Adding newly created item to model, id:', created.id, 'section:', section)
      // Add the newly created item to the model
      await onAddExisting(created.id, section || undefined)
      console.log('[AddHobbyItemModal] Item added to model, closing modal')
      handleClose()
    } catch (error) {
      console.error('[AddHobbyItemModal] Error creating hobby item:', error)
      alert('Failed to create item. Please try again.')
    } finally {
      console.log('[AddHobbyItemModal] Setting loading to false')
      setLoading(false)
    }
  }

  // Filter hobby items based on search query
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
          <h2 className="text-xl font-bold text-title">Add Hobby Item</h2>
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
            Create New
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'select' ? (
            <>
              {/* Section Field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text mb-2">
                  Section
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="Where on the model was this used?"
                  className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                />
              </div>

              {/* Search */}
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hobby items..."
                  className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                />
              </div>

              {/* List */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-secondary-text">
                    {hobbyItems.length === 0
                      ? 'No hobby items yet. Create your first one!'
                      : 'No items match your search.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddExisting(item.id)}
                      disabled={loading}
                      className="w-full p-4 bg-bg-secondary hover:bg-bg-card border border-border-custom rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            {item.swatch && (
                              <div
                                className="w-5 h-5 rounded border border-border-custom flex-shrink-0"
                                style={{ backgroundColor: item.swatch }}
                              />
                            )}
                            <h3 className="font-semibold text-title truncate">
                              {item.name || 'Unnamed Item'}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-3 text-sm text-secondary-text">
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
                        <Plus className="w-5 h-5 text-brand flex-shrink-0 ml-2" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Create New Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="Where on the model was this used?"
                    className="w-full px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text"
                  />
                </div>

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

                <button
                  onClick={handleCreateNew}
                  disabled={loading || !newItem.name.trim() || !newItem.type.trim()}
                  className="btn-secondary w-full btn-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create and Add to Model'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
