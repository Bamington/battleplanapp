import React, { useState, useEffect } from 'react'
import { X, Share2, Globe, Lock, Copy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getShareUrl } from '../utils/environment'
import { Toast } from './Toast'

interface ShareModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelUpdated?: () => void
  model: {
    id: string
    name: string
    public: boolean | null
  } | null
}

export function ShareModelModal({ isOpen, onClose, onModelUpdated, model }: ShareModelModalProps) {
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copying, setCopying] = useState(false)
  const [error, setError] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Update local state when model changes
  useEffect(() => {
    if (model) {
      // Fallback to false if public property doesn't exist yet
      setIsPublic(model.public ?? false)
    }
  }, [model])

  const handlePublicToggle = async () => {
    if (!model) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('models')
        .update({ public: !isPublic })
        .eq('id', model.id)

      if (error) throw error

      // Update local state
      setIsPublic(!isPublic)
      
      // Notify parent component
      onModelUpdated?.()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update model visibility')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (!model) return
    
    setCopying(true)
    setError('')
    
    try {
      // Generate the public share URL using environment-specific base URL
      const shareUrl = getShareUrl(`/shared/model/${model.id}`)
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
      // Show success toast
      setToastMessage(`${model.name}'s URL has been copied to your clipboard!`)
      setShowToast(true)
      
    } catch (error) {
      console.error('Error copying URL:', error)
      // Fallback for older browsers that don't support clipboard API
      const shareUrl = getShareUrl(`/shared/model/${model.id}`)
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      // Show success toast for fallback method too
      setToastMessage(`${model.name}'s URL has been copied to your clipboard!`)
      setShowToast(true)
    } finally {
      setCopying(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !model) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-title">Share {model.name}</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6 text-icon" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Description */}
          <div className="text-sm text-secondary-text">
            Sharing a model makes it visible to other users who have the link to it.
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
                    Allow anyone to view this model
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
                  This model is now public and can be viewed by anyone with the link.
                </span>
              </div>
            </div>
          )}

          {!isPublic && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-800">
                  This model is private and only visible to you.
                </span>
              </div>
            </div>
          )}

          {/* Copy URL Button - Only show when public */}
          {isPublic && (
            <button
              onClick={handleCopyUrl}
              disabled={copying}
              className="btn-secondary btn-full btn-with-icon"
            >
              <Copy className="w-4 h-4" />
              <span>{copying ? 'Copying...' : 'Copy URL'}</span>
            </button>
          )}

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

      {/* Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
