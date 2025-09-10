import React, { useState } from 'react'
import { useWishlist } from '../hooks/useWishlist'
import { ModalWrapper, ModalActions } from './ModalWrapper'
import { Button } from './Button'
import { WishlistImageSuggestionModal } from './WishlistImageSuggestionModal'

interface AddWishlistItemModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AddWishlistItemModal({ isOpen, onClose, onSuccess }: AddWishlistItemModalProps) {
  const [itemName, setItemName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showImageSuggestionModal, setShowImageSuggestionModal] = useState(false)
  const [newWishlistItemId, setNewWishlistItemId] = useState<number | null>(null)
  const { addWishlistItem } = useWishlist()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!itemName.trim()) {
      setError('Please enter an item name')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data, error } = await addWishlistItem(itemName.trim())
      
      if (error) {
        setError('Failed to add item to wishlist')
        console.error('Error adding wishlist item:', error)
        return
      }

      // Success - store the new item ID and show image suggestion modal
      if (data?.id) {
        setNewWishlistItemId(data.id)
        setShowImageSuggestionModal(true)
        // Keep the item name for the image search
      } else {
        // Fallback if no ID returned
        setItemName('')
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error adding wishlist item:', error)
      setError('Failed to add item to wishlist')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return // Prevent closing while loading
    setItemName('')
    setError('')
    setNewWishlistItemId(null)
    onClose()
  }

  const handleImageSuggestionClose = () => {
    setShowImageSuggestionModal(false)
    // Reset form and close main modal
    setItemName('')
    setNewWishlistItemId(null)
    onSuccess()
    onClose()
  }

  const handleImageSuggestionSuccess = () => {
    setShowImageSuggestionModal(false)
    // Reset form and close main modal
    setItemName('')
    setNewWishlistItemId(null)
    onSuccess()
    onClose()
  }

  return (
    <>
    <ModalWrapper isOpen={isOpen} onClose={handleClose} title="Add Wishlist Item" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-input-label mb-2">
            Item Name
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="e.g., Space Marines Combat Patrol, Paint Set, etc."
            className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand bg-bg-primary text-text"
            maxLength={100}
            disabled={loading}
            autoFocus
          />
          <p className="text-xs text-secondary-text mt-1">
            {itemName.length}/100 characters
          </p>
        </div>

        {error && (
          <div className="bg-bg-card border border-button-red rounded-lg p-3">
            <p className="text-button-red text-sm">{error}</p>
          </div>
        )}
      </form>

      <ModalActions className="pt-6 pb-6 flex justify-end space-x-3">
        <Button
          variant="secondary-sm"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary-sm"
          onClick={handleSubmit}
          disabled={loading || !itemName.trim()}
          withIcon={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Adding...</span>
            </>
          ) : (
            <span>Add to Wishlist</span>
          )}
        </Button>
      </ModalActions>
    </ModalWrapper>
    
    {/* Image Suggestion Modal */}
    {newWishlistItemId && (
      <WishlistImageSuggestionModal
        isOpen={showImageSuggestionModal}
        onClose={handleImageSuggestionClose}
        itemName={itemName}
        wishlistItemId={newWishlistItemId}
        onSuccess={handleImageSuggestionSuccess}
      />
    )}
    </>
  )
}