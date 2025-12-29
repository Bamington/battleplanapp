import React, { useState } from 'react'
import { Heart, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useWishlist } from '../hooks/useWishlist'
import { ProductSearchModal } from './ProductSearchModal'
import { useAuth } from '../hooks/useAuth'
import { Button } from './Button'

interface WishlistPageProps {
  showAddModal?: boolean
  onCloseAddModal?: () => void
  onAddItemSuccess?: () => void
}

export function WishlistPage({ showAddModal = false, onCloseAddModal, onAddItemSuccess }: WishlistPageProps = {}) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
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

  const handleOpenSearch = () => {
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
                onClick={handleOpenSearch}
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Item</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-title">Your Wishlist ({wishlistItems.length})</h2>
              <Button 
                variant="primary" 
                withIcon 
                onClick={handleOpenSearch}
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {wishlistItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-card rounded-lg border border-border-custom p-4 hover:border-brand transition-colors"
                >
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center">
                          <Heart className="w-6 h-6 text-secondary-text" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-title truncate">
                        {item.product_name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-secondary-text mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-secondary-text mt-2">
                        Added {new Date(item.created_at).toLocaleDateString('en-AU')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center">
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Search Modal */}
      <ProductSearchModal
        isOpen={showAddModal || isSearchModalOpen}
        onClose={() => {
          if (onCloseAddModal) {
            onCloseAddModal()
          } else {
            setIsSearchModalOpen(false)
          }
        }}
        onSuccess={() => {
          refetch()
          setIsSearchModalOpen(false) // Always clear local state
          if (onAddItemSuccess) {
            onAddItemSuccess()
          }
        }}
      />
    </>
  )
}