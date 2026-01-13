import React, { useState, useEffect } from 'react'
import { Search, Edit, Trash2, CheckCircle2, Plus } from 'lucide-react'
import { HobbyItem } from '../hooks/useHobbyItems'
import { toTitleCase } from '../utils/textUtils'

interface HobbyItemsListProps {
  items: HobbyItem[]
  onAddToCollection?: () => void
  onEdit?: (item: HobbyItem) => void
  onDelete?: (item: HobbyItem) => void
}

export function HobbyItemsList({ items, onAddToCollection, onEdit, onDelete }: HobbyItemsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 21 // 7 rows × 3 columns (large screen grid)

  // Get unique brands for filter
  const uniqueBrands = Array.from(new Set(items.map(item => item.brand).filter(Boolean))) as string[]

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || item.type === typeFilter

    const matchesBrand = brandFilter === 'all' || item.brand === brandFilter

    return matchesSearch && matchesType && matchesBrand
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, brandFilter])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-title">My Collection</h3>
        <div className="flex items-center space-x-2">
          {onAddToCollection && (
            <button
              onClick={onAddToCollection}
              className="btn-secondary btn-with-icon"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Collection</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-text" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
        >
          <option value="all">All Types</option>
          <option value="Paint">Paint</option>
          <option value="Other">Other</option>
        </select>

        {/* Brand Filter */}
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-3 py-2 border border-border-custom rounded-md focus:outline-none focus:ring-2 focus:ring-brand bg-bg-secondary text-text text-sm"
        >
          <option value="all">All Brands</option>
          {uniqueBrands.sort().map(brand => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 bg-bg-secondary rounded-lg">
          <p className="text-secondary-text">
            {items.length === 0
              ? 'No hobby items yet. Create your first one!'
              : 'No items match your filters.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-bg-secondary border border-border-custom rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {/* Ownership Icon */}
                  <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
                  {item.swatch && (
                    <div
                      className="w-6 h-6 rounded border border-border-custom flex-shrink-0"
                      style={{ backgroundColor: item.swatch }}
                    />
                  )}
                  <h4 className="font-semibold text-title truncate">
                    {item.name || 'Unnamed Item'}
                  </h4>
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1 text-secondary-text hover:text-text transition-colors"
                        title="Edit item"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1 text-secondary-text hover:text-red-500 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
              </div>
            </div>
          ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-secondary-text">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} items
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-border-custom rounded-md text-sm text-text hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)

                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2 text-secondary-text">...</span>
                      }
                      return null
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 border rounded-md text-sm transition-colors ${
                          currentPage === page
                            ? 'bg-brand text-white border-brand'
                            : 'border-border-custom text-text hover:bg-bg-card'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-border-custom rounded-md text-sm text-text hover:bg-bg-card transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
