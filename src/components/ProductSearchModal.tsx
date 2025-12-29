import React, { useState } from 'react'
import { Search, Loader2, AlertCircle, Package, X } from 'lucide-react'
import { ModalWrapper, ModalActions } from './ModalWrapper'
import { Button } from './Button'
import { useWishlist } from '../hooks/useWishlist'

interface ProductSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Product {
  name: string
  description: string
  imageUrl?: string
  thumbnailUrl?: string
}

export function ProductSearchModal({ isOpen, onClose, onSuccess }: ProductSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState('')
  const { addWishlistItem } = useWishlist()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      setError('Please enter a search term')
      return
    }

    setIsSearching(true)
    setError('')
    setProducts([])

    try {
      const { data, error } = await fetch('/api/search-wishlist-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery.trim() })
      }).then(res => res.json())

      if (error) {
        setError('Failed to search for products. Please try again.')
        return
      }

      setProducts(data.products || [])
    } catch (error) {
      console.error('Search error:', error)
      setError('Failed to search for products. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectProduct = async (product: Product) => {
    setSelectedProduct(product)
    setIsAdding(true)
    setError('')

    try {
      const { error } = await addWishlistItem({
        product_name: product.name,
        description: product.description,
        image_url: product.imageUrl || undefined
      })

      if (error) {
        setError('Failed to add product to wishlist')
        return
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Add to wishlist error:', error)
      setError('Failed to add product to wishlist')
    } finally {
      setIsAdding(false)
    }
  }

  const handleClose = () => {
    if (isSearching || isAdding) return // Prevent closing while loading
    setSearchQuery('')
    setProducts([])
    setSelectedProduct(null)
    setError('')
    onClose()
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} title="Search Products" maxWidth="lg">
      <div className="space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-input-label mb-2">
              What are you looking for?
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Warhammer 40k Space Marines, D&D dice, board games..."
                  className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand focus:border-brand bg-bg-primary text-text"
                  disabled={isSearching}
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  </div>
                )}
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={isSearching || !searchQuery.trim()}
                withIcon
              >
                <Search className="w-4 h-4" />
                Search
              </Button>
            </div>
            <p className="text-xs text-secondary-text mt-1">
              Describe any tabletop gaming product you want to add to your wishlist
            </p>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="bg-bg-card border border-button-red rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-button-red flex-shrink-0" />
            <p className="text-button-red text-sm">{error}</p>
          </div>
        )}

        {/* Search Results */}
        {products.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-title">Found Products</h3>
            <div className="grid gap-4">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="bg-bg-card border border-border-custom rounded-lg p-4 hover:border-brand transition-colors cursor-pointer"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-bg-secondary rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-secondary-text" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-title truncate">{product.name}</h4>
                      <p className="text-sm text-secondary-text mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Add Button */}
                    <div className="flex-shrink-0">
                      <Button
                        variant="primary-sm"
                        disabled={isAdding}
                        withIcon={isAdding}
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          'Add to Wishlist'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isSearching && products.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-secondary-text mx-auto mb-4" />
            <h3 className="text-lg font-medium text-title mb-2">No products found</h3>
            <p className="text-secondary-text">
              Try a different search term or be more specific about the product you're looking for.
            </p>
          </div>
        )}
      </div>

      <ModalActions className="pt-6 pb-6 flex justify-end space-x-3">
        <Button
          variant="secondary-sm"
          onClick={handleClose}
          disabled={isSearching || isAdding}
        >
          Cancel
        </Button>
      </ModalActions>
    </ModalWrapper>
  )
}
