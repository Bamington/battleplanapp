import React, { useState, useEffect } from 'react'
import { ExternalLink, Loader2, Package, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { ModalWrapper, ModalActions } from './ModalWrapper'
import { Button } from './Button'
import { searchGoogle } from '../utils/searchService'

interface SearchResult {
  title: string
  link: string
  snippet?: string
  displayLink: string
  price?: string
  availability?: 'in_stock' | 'out_of_stock' | 'limited' | 'unknown'
  storeName?: string
  condition?: 'new' | 'used' | 'refurbished'
  currency?: string
  shipping?: string
}

interface SearchResultsModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
}

export function SearchResultsModal({ isOpen, onClose, searchQuery }: SearchResultsModalProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const performSearch = async (query: string) => {
    setLoading(true)
    setError('')
    setResults([])

    try {
      const searchResults = await searchGoogle(query)
      setResults(searchResults)
    } catch (err) {
      setError('Failed to fetch search results. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && searchQuery) {
      performSearch(searchQuery)
    }
  }, [isOpen, searchQuery])

  const handleResultClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const getAvailabilityIcon = (availability?: string) => {
    switch (availability) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'out_of_stock':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'limited':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Package className="w-4 h-4 text-secondary-text" />
    }
  }

  const getAvailabilityText = (availability?: string) => {
    switch (availability) {
      case 'in_stock':
        return 'In Stock'
      case 'out_of_stock':
        return 'Out of Stock'
      case 'limited':
        return 'Limited Stock'
      default:
        return 'Check Availability'
    }
  }

  const getAvailabilityColor = (availability?: string) => {
    switch (availability) {
      case 'in_stock':
        return 'text-green-600'
      case 'out_of_stock':
        return 'text-red-600'
      case 'limited':
        return 'text-yellow-600'
      default:
        return 'text-secondary-text'
    }
  }

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Search Results: "${searchQuery}"`}
      maxWidth="4xl"
    >
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
            <span className="ml-2 text-secondary-text">Searching for deals...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-button-red mb-4">{error}</p>
            <Button variant="secondary-sm" onClick={() => performSearch(searchQuery)}>
              Try Again
            </Button>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary-text">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                onClick={() => handleResultClick(result.link)}
                className="p-4 bg-bg-card border border-border-custom rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-title text-base truncate">
                        {result.title}
                      </h3>
                      <ExternalLink className="w-4 h-4 text-secondary-text flex-shrink-0" />
                    </div>
                    <p className="text-sm font-medium text-brand mb-2">{result.storeName || result.displayLink}</p>
                    
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-2">
                        {getAvailabilityIcon(result.availability)}
                        <span className={`text-sm font-medium ${getAvailabilityColor(result.availability)}`}>
                          {getAvailabilityText(result.availability)}
                        </span>
                      </div>
                      
                      {result.condition && result.condition !== 'new' && (
                        <span className="text-xs px-2 py-1 bg-bg-secondary text-secondary-text rounded-full">
                          {result.condition}
                        </span>
                      )}
                    </div>
                    
                    {result.shipping && (
                      <p className="text-xs text-secondary-text">
                        {result.shipping}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {result.price && (
                      <div className="text-xl font-bold text-brand mb-1">
                        {result.price}
                      </div>
                    )}
                    <div className="text-xs text-secondary-text">
                      Click to visit
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalActions className="pt-6 pb-6 flex justify-between">
        <Button
          variant="secondary-sm"
          onClick={() => window.open(`https://shopping.google.com/search?q=${encodeURIComponent(searchQuery)}`, '_blank')}
        >
          Open in Google Shopping
        </Button>
        <Button variant="primary-sm" onClick={onClose}>
          Close
        </Button>
      </ModalActions>
    </ModalWrapper>
  )
}