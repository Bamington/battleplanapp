import React, { useState, useEffect } from 'react'
import { X, Share2, Globe, Lock, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ShareCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  onCollectionUpdated?: () => void
  box: {
    id: string
    name: string
    public: boolean
  } | null
}

export function ShareCollectionModal({ isOpen, onClose, onCollectionUpdated, box }: ShareCollectionModalProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')

  // Update local state when box changes
  useEffect(() => {
    if (box) {
      // Fallback to false if public property doesn't exist yet
      setIsPublic(box.public ?? false)
    }
  }, [box])

  const handlePublicToggle = async () => {
    if (!box) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('boxes')
        .update({ public: !isPublic })
        .eq('id', box.id)

      if (error) throw error

      // Update local state
      setIsPublic(!isPublic)
      
      // Notify parent component
      onCollectionUpdated?.()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collection visibility')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!box) return
    
    setCopying(true)
    setError('')
    
    try {
      // Generate the public share URL
      const shareUrl = `${window.location.origin}/shared/collection/${box.id}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
      // You could add a toast notification here
      console.log('Collection share link copied to clipboard')
      
    } catch (error) {
      console.error('Error copying URL:', error)
      // Fallback for older browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = `${window.location.origin}/shared/collection/${box.id}`
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      console.log('Collection share link copied to clipboard (fallback)')
    } finally {
      setCopying(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !box) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-title">Share this collection</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6 text-icon" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Collection Info */}
          <div className="bg-bg-secondary rounded-lg p-4">
            <h3 className="font-semibold text-text mb-2">{box.name}</h3>
          </div>

          {/* Make Public Switch */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Share2 className="w-5 h-5 text-icon" />
                <div>
                  <label className="text-sm font-medium text-input-label">
                    Make Public
                  </label>
                  <p className="text-xs text-secondary-text">
                    Allow anyone to view this collection
                  </p>
                </div>
              </div>
              <button
                onClick={handlePublicToggle}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 ${
                  isPublic ? 'bg-brand' : 'bg-secondary-text'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Status Message */}
          {isPublic && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">
                  This collection is now public and can be viewed by anyone with the link.
                </span>
              </div>
            </div>
          )}

          {!isPublic && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-800">
                  This collection is private and only visible to you.
                </span>
              </div>
            </div>
          )}

          {/* Copy URL Button */}
          <button
            onClick={handleCopyUrl}
            disabled={copying}
            className="btn-secondary btn-full btn-with-icon"
          >
            <Copy className="w-4 h-4" />
            <span>{copying ? 'Copying...' : 'Copy URL'}</span>
          </button>

          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
