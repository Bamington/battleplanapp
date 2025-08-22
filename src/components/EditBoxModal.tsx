import React, { useState, useEffect } from 'react'
import { X, Package, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { GameDropdown } from './GameDropdown'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'

interface Game {
  id: string
  name: string
  icon: string | null
}

interface Box {
  id: string
  name: string
  game_id: string | null
  purchase_date: string | null
  image_url: string | null
}

interface EditBoxModalProps {
  isOpen: boolean
  onClose: () => void
  onBoxUpdated: () => void
  box: Box | null
}

export function EditBoxModal({ isOpen, onClose, onBoxUpdated, box }: EditBoxModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    game_id: '',
    purchase_date: '',
    image_url: ''
  })
  const [games, setGames] = useState<Game[]>([])
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (box) {
      setFormData({
        name: box.name,
        game_id: box.game_id || '',
        purchase_date: box.purchase_date || '',
        image_url: box.image_url || ''
      })
    }
  }, [box])

  useEffect(() => {
    if (isOpen) {
      fetchGames()
    }
  }, [isOpen])

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, icon')
        .order('name')

      if (error) throw error
      setGames(data || [])
    } catch (err) {
      console.error('Error fetching games:', err)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!isValidImageFile(file)) {
        alert('Please select a valid image file')
        return
      }
      setSelectedImageFile(file)
      setImageForCropping(file)
      setShowImageCropper(true)
    }
  }

  const handleImageCropped = (croppedFile: File) => {
    setCroppedImageBlob(croppedFile)
    setShowImageCropper(false)
    setImageForCropping(null)
  }

  const uploadFile = async (file: Blob, bucket: string, folder: string) => {
    const fileExt = selectedImageFile?.name.split('.').pop() || 'jpg'
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!box) return

    setLoading(true)
    setError('')

    try {
      let imageUrl = formData.image_url

      // Upload new image if selected
      if (croppedImageBlob) {
        setCompressing(true)
        const compressedFile = await compressImage(croppedImageBlob as File, 1200, 1200, 0.8)
        imageUrl = await uploadFile(compressedFile, 'model-images', 'boxes')
      }

      const { error } = await supabase
        .from('boxes')
        .update({
          name: formData.name,
          game_id: formData.game_id || null,
          purchase_date: formData.purchase_date || null,
          image_url: imageUrl
        })
        .eq('id', box.id)

      if (error) throw error

      onBoxUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update box')
    } finally {
      setLoading(false)
      setCompressing(false)
    }
  }

  const handleDiscard = () => {
    if (box) {
      setFormData({
        name: box.name,
        game_id: box.game_id || '',
        purchase_date: box.purchase_date || '',
        image_url: box.image_url || ''
      })
    }
    setSelectedImageFile(null)
    setCroppedImageBlob(null)
    setError('')
  }

  if (!isOpen || !box) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-title">Edit Box</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Box Name */}
            <div>
              <label htmlFor="boxName" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Box Name
              </label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-5 h-5" />
                <input
                  type="text"
                  id="boxName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                  required
                />
              </div>
            </div>

            {/* Game */}
            <div>
              <label htmlFor="game" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Game
              </label>
              <GameDropdown
                games={games}
               selectedGame={formData.game_id || ''}
                onGameSelect={(gameId) => setFormData({ ...formData, game_id: gameId })}
                placeholder="Choose a Game"
              />
            </div>

            {/* Purchase Date */}
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Purchase Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-5 h-5" />
                <input
                  type="date"
                  id="purchaseDate"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                />
              </div>
            </div>

            {/* Box Image */}
            <div>
              <label htmlFor="boxImage" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Box Image
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-5 h-5" />
                <input
                  type="file"
                  id="boxImage"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 bg-bg-primary text-text"
                />
              </div>
              {croppedImageBlob && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ New image ready for upload
                </p>
              )}
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleDiscard}
                className="flex-1 px-4 py-2 border border-border-custom text-text rounded-lg hover:bg-bg-secondary transition-colors font-medium"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={loading || compressing}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg transition-colors font-medium"
              >
                {compressing ? 'Processing...' : loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {imageForCropping && (
        <ImageCropper
          isOpen={showImageCropper}
          onClose={() => {
            setShowImageCropper(false)
            setImageForCropping(null)
            setSelectedImageFile(null)
          }}
          onCrop={handleImageCropped}
          imageFile={imageForCropping}
        />
      )}
    </>
  )
}