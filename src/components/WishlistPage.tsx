import React, { useState } from 'react'
import { Heart, Plus, Trash2, AlertTriangle, Search } from 'lucide-react'
import { useWishlist } from '../hooks/useWishlist'
import { AddWishlistItemModal } from './AddWishlistItemModal'
import { SearchResultsModal } from './SearchResultsModal'
import { useAuth } from '../hooks/useAuth'
import { Button } from './Button'

interface WishlistPageProps {
  showAddModal?: boolean
  onCloseAddModal?: () => void
  onAddItemSuccess?: () => void
}

export function WishlistPage({ showAddModal = false, onCloseAddModal, onAddItemSuccess }: WishlistPageProps = {}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const { wishlistItems, loading, hasInitialized, removeWishlistItem, refetch } = useWishlist()
  const { user } = useAuth()

  const handleDeleteItem = async (itemId: number) => {
    if (deletingItemId) return // Prevent double-clicking
    
    setDeletingItemId(itemId)
    try {
      const { error } = await removeWishlistItem(itemId)
      if (error) {
        console.error('Failed to delete wishlist item:', error)
      }
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleSearchItem = (itemName: string) => {
    setSearchQuery(itemName)
    setIsSearchModalOpen(true)
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-button-red mx-auto mb-4" />
            <p className="text-base text-secondary-text">Please sign in to view your wishlist</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-title mb-4">MY WISHLIST</h1>
        </div>
        {loading && !hasInitialized ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-secondary-text mx-auto mb-4" />
            <h3 className="text-lg font-medium text-title mb-2">Your wishlist is empty</h3>
            <p className="text-base text-secondary-text mb-6">Add items you want to remember or purchase later</p>
            <div className="flex justify-center">
              <Button 
                variant="primary" 
                withIcon 
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Item</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-card rounded-lg border border-border-custom p-4 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-title">
                      {item.item_name || 'Untitled Item'}
                    </h3>
                    <p className="text-sm text-secondary-text">
                      Added {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSearchItem(item.item_name || '')}
                      className="p-2 text-brand hover:text-brand-hover hover:bg-bg-secondary rounded-lg transition-colors"
                      title="Search for deals and pricing"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={deletingItemId === item.id}
                      className="p-2 text-button-red hover:text-button-red-hover hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove from wishlist"
                    >
                      {deletingItemId === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-button-red"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AddWishlistItemModal
        isOpen={showAddModal || isAddModalOpen}
        onClose={() => {
          if (onCloseAddModal) {
            onCloseAddModal()
          } else {
            setIsAddModalOpen(false)
          }
        }}
        onSuccess={() => {
          refetch()
          if (onAddItemSuccess) {
            onAddItemSuccess()
          } else {
            setIsAddModalOpen(false)
          }
        }}
      />

      {/* Search Results Modal */}
      <SearchResultsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={searchQuery}
      />
    </>
  )
}