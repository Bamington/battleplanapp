import React, { useState } from 'react'
import { X, Share2, Edit, Trash2, Calendar, Hash, Palette, FileText, Package, Gamepad2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DeleteModelModal } from './DeleteModelModal'
import { EditModelModal } from './EditModelModal'
import { ShareModelModal } from './ShareModelModal'
import { Toast } from './Toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatLocalDate } from '../utils/timezone'


interface ViewModelModalProps {
  isOpen: boolean
  onClose: () => void
  onModelDeleted?: () => void
  onModelUpdated?: () => void
  onViewBox?: (box: any) => void
  model: {
    id: string
    name: string
    status: string
    count: number
    image_url: string
    game_id: string | null
    notes: string | null
    painted_date: string | null
    purchase_date: string | null
    public: boolean | null
    box: {
      id: string
      name: string
      purchase_date: string
      game: {
        name: string
      } | null
    } | null
    game: {
      name: string
    } | null
  } | null
}

export function ViewModelModal({ isOpen, onClose, onModelDeleted, onModelUpdated, onViewBox, model }: ViewModelModalProps) {
  const [showDeleteModal, setShowDeleteModal] = React.useState(false)
  const [showEditModal, setShowEditModal] = React.useState(false)
  const [showShareModal, setShowShareModal] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [showToast, setShowToast] = React.useState(false)
  const [currentModel, setCurrentModel] = React.useState(model)

  // Update current model when prop changes
  React.useEffect(() => {
    setCurrentModel(model)
  }, [model])

  // Handle model updates by refreshing the model data
  const handleModelUpdated = async () => {
    // Notify parent component to refresh data
    onModelUpdated?.()
  }

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !model) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close if edit modal is open
    if (showEditModal) return
    
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    })
  }

  const getStatusText = (status: string, count: number) => {
    return `${count} Model${count > 1 ? 's' : ''}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Painted': return 'bg-green-100 text-green-800'
      case 'Partially Painted': return 'bg-yellow-100 text-yellow-800'
      case 'Primed': return 'bg-blue-100 text-blue-800'
      case 'Assembled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaintedDate = () => {
    // Return the painted date if it exists
    return model?.painted_date || null
  }

  const getPaintNotes = () => {
    return model?.notes || null
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!model) return
    
    setDeleting(true)
    
    try {
      // Delete associated image from storage if it exists
      if (model.image_url && 
          typeof model.image_url === 'string' &&
          model.image_url.includes('supabase')) {
        // Extract the file path from the URL
        const urlParts = model.image_url.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'model-images')
        if (bucketIndex !== -1) {
          const filePath = urlParts.slice(bucketIndex + 1).join('/')
          await supabase.storage
            .from('model-images')
            .remove([filePath])
        }
      }
      
      // Delete the model from the database
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', model.id)
      
      if (error) throw error
      
      // Close modals and refresh data
      setShowDeleteModal(false)
      onClose()
      
      // Notify parent component to refresh the models list
      if (onModelDeleted) {
        onModelDeleted()
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      // You could add error handling UI here
    } finally {
      setDeleting(false)
    }
  }

  const handleShareModel = () => {
    setShowShareModal(true)
  }

  const handleEditSuccess = async () => {
    // Close both edit modal and view modal, return to collections
    setShowEditModal(false)
    onClose()
    
    // Refresh the data in the background
    if (onModelUpdated) {
      await onModelUpdated()
    }
  }

  if (!isOpen || !currentModel) return null

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
          showEditModal ? 'bg-opacity-25' : 'bg-opacity-50'
        }`}
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg max-w-2xl w-full overflow-y-auto md:rounded-lg md:max-w-2xl md:max-h-[90vh] fixed inset-0 md:relative md:inset-auto h-screen md:h-auto">
          {/* Header Image */}
          <div className="relative">
            <img
              src={(() => {
                // Check if we have a valid model image URL
                if (model.image_url && 
                   typeof model.image_url === 'string' &&
                   model.image_url.trim() !== '' && 
                   model.image_url !== 'undefined' && 
                   model.image_url !== 'null' &&
                   (model.image_url.startsWith('http') || model.image_url.startsWith('/'))) {
                  return model.image_url
                }
                
                // Try to use the game's image as fallback
                const gameImage = model.box?.game?.image || model.game?.image
                if (gameImage && 
                    typeof gameImage === 'string' &&
                    gameImage.trim() !== '' && 
                    gameImage !== 'undefined' && 
                    gameImage !== 'null' &&
                    gameImage.startsWith('http')) {
                  return gameImage
                }
                
                // Final fallback to default image
                return 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
              })()}
              alt={model.name}
              className="w-full max-h-[60%] object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                const fallbackUrl = 'https://images.pexels.com/photos/8088212/pexels-photo-8088212.jpeg'
                if (target.src !== fallbackUrl) {
                  console.log('Modal image failed to load:', target.src, 'Falling back to default')
                  target.src = fallbackUrl
                }
              }}
            />
          </div>

          {/* Sticky Close Button */}
          <button
            onClick={onClose}
            className="fixed top-4 right-4 md:absolute text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2 z-20"
          >
            <X className="w-6 h-6 text-icon" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Title Section */}
            <div className="text-center mb-6 relative">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-title">{model.name}</h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-1 text-secondary-text hover:text-text transition-colors rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              {model.box ? (
                <button
                  onClick={() => {
                    onClose()
                    onViewBox?.(model.box)
                  }}
                  className="text-base text-secondary-text mb-3 hover:text-amber-600 transition-colors"
                >
                  {model.box.name}
                </button>
              ) : null}
              <div className="flex items-center justify-center space-x-4">
                {(model.box?.game?.icon || model.game?.icon) ? (
                  <img
                    src={model.box?.game?.icon || model.game?.icon}
                    alt={`${model.box?.game?.name || model.game?.name || 'Unknown Game'} icon`}
                    className="object-cover rounded max-h-[32px]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      console.warn('Game icon failed to load:', target.src, 'Falling back to letter icon')
                      // Hide the broken image and show fallback
                      target.style.display = 'none'
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback && fallback.classList.contains('icon-fallback')) {
                        fallback.style.display = 'flex'
                      }
                    }}
                    onLoad={(e) => {
                      // Hide fallback when image loads successfully
                      const target = e.target as HTMLImageElement
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback && fallback.classList.contains('icon-fallback')) {
                        fallback.style.display = 'none'
                      }
                    }}
                  />
                ) : null}
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: (model.box?.game?.icon || model.game?.icon) ? 'none' : 'flex' }}>
                  <span className="text-white text-xs font-bold">
                    {(model.box?.game?.name || model.game?.name || 'Unknown Game').charAt(0)}
                  </span>
                </div>
                <span className="text-lg font-semibold text-secondary-text">
                  {model.box?.game?.name || model.game?.name || 'Unknown Game'}
                </span>
              </div>
            </div>

            {/* Details Cards */}
            <div className="space-y-3">
              {/* Model Count */}
              <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                <Hash className="w-5 h-5 text-secondary-text" />
                <span className="text-base text-text font-medium">
                  {getStatusText(model.status, model.count)}
                </span>
              </div>

              {/* Purchase Date - only show if purchase date exists */}
              {model.box?.purchase_date && (
              <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-secondary-text" />
                <span className="text-base text-text font-medium">
                  Purchased {formatDate(model.box.purchase_date)}
                </span>
              </div>
              )}

              {/* Painted Date - only show if painted date exists */}
              {getPaintedDate() && (
                <div className="bg-bg-secondary rounded-lg p-4 flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-secondary-text" />
                  <span className="text-base text-text font-medium">
                    Painted {formatDate(getPaintedDate()!)}
                  </span>
                </div>
              )}

              {/* Notes - only show if notes exist */}
              {getPaintNotes() && (
                <div className="bg-bg-secondary rounded-lg p-4 flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-secondary-text mt-0.5" />
                  <div className="flex-1">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      className="prose prose-sm max-w-none dark:prose-invert"
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 text-base text-text">{children}</p>,
                        h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-text">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-text">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-text">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm text-text">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
                        em: ({ children }) => <em className="italic text-text">{children}</em>,
                        code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic mb-2 text-text">{children}</blockquote>,
                      }}
                    >
                      {getPaintNotes()}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6">
              <div className="space-y-3">
                <button
                  onClick={handleShareModel}
                  className="btn-primary btn-full btn-with-icon w-full"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Model</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="btn-danger-outline w-full"
                >
                  Delete this model
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteModelModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        modelName={model.name}
        loading={deleting}
      />

      <EditModelModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onModelUpdated={handleEditSuccess}
        model={model}
      />

      <ShareModelModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onModelUpdated={handleModelUpdated}
        model={currentModel}
      />

      <Toast
        message="A share link has been copied to your clipboard"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </>
  )
}