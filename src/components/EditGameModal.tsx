import React, { useState, useEffect } from 'react'
import { X, Gamepad2, Building, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'

interface Manufacturer {
  id: string
  name: string
}

interface Game {
  id: string
  name: string
  manufacturer_id: string | null
  image: string | null
  icon: string | null
}

interface EditGameModalProps {
  isOpen: boolean
  onClose: () => void
  onGameUpdated: () => void
  game: Game | null
}

export function EditGameModal({ isOpen, onClose, onGameUpdated, game }: EditGameModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer_id: '',
    image: '',
    icon: ''
  })
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null)
  const [showImageCropper, setShowImageCropper] = useState(false)
  const [showIconCropper, setShowIconCropper] = useState(false)
  const [imageForCropping, setImageForCropping] = useState<File | null>(null)
  const [iconForCropping, setIconForCropping] = useState<File | null>(null)
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
  const [croppedIconBlob, setCroppedIconBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name,
        manufacturer_id: game.manufacturer_id || '',
        image: game.image || '',
        icon: game.icon || ''
      })
    }
  }, [game])

  useEffect(() => {
    if (isOpen) {
      fetchManufacturers()
    }
  }, [isOpen])

  const fetchManufacturers = async () => {
    try {
      const { data, error } = await supabase
        .from('manufacturers')
        .select('id, name')
        .order('name')

      if (error) throw error
      setManufacturers(data || [])
    } catch (err) {
      console.error('Error fetching manufacturers:', err)
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

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!isValidImageFile(file)) {
        alert('Please select a valid image file')
        return
      }
      setSelectedIconFile(file)
      setIconForCropping(file)
      setShowIconCropper(true)
    }
  }

  const handleImageCropped = (croppedFile: File) => {
    setCroppedImageBlob(croppedFile)
    setShowImageCropper(false)
    setImageForCropping(null)
  }

  const handleIconCropped = (croppedFile: File) => {
    setCroppedIconBlob(croppedFile)
    setShowIconCropper(false)
    setIconForCropping(null)
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
    if (!game) return

    setLoading(true)
    setError('')

    try {
      let imageUrl = formData.image
      let iconUrl = formData.icon

      // Upload new image if selected
      if (croppedImageBlob) {
        setCompressing(true)
        const compressedFile = await compressImage(croppedImageBlob as File, 1200, 1200, 0.8)
        imageUrl = await uploadFile(compressedFile, 'game-assets', 'images')
      }

      // Upload new icon if selected
      if (croppedIconBlob) {
        setCompressing(true)
        const compressedFile = await compressImage(croppedIconBlob as File, 512, 512, 0.9)
        iconUrl = await uploadFile(compressedFile, 'game-assets', 'icons')
      }

      const { error } = await supabase
        .from('games')
        .update({
          name: formData.name,
          manufacturer_id: formData.manufacturer_id || null,
          image: imageUrl,
          icon: iconUrl
        })
        .eq('id', game.id)

      if (error) throw error

      onGameUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game')
    } finally {
      setLoading(false)
      setCompressing(false)
    }
  }

  const handleDiscard = () => {
    if (game) {
      setFormData({
        name: game.name,
        manufacturer_id: game.manufacturer_id || '',
        image: game.image || '',
        icon: game.icon || ''
      })
    }
    setSelectedImageFile(null)
    setSelectedIconFile(null)
    setCroppedImageBlob(null)
    setCroppedIconBlob(null)
    setError('')
  }

  if (!isOpen || !game) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-title">Edit Game</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Game Name */}
            <div>
              <label htmlFor="gameName" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Game Name
              </label>
              <div className="relative">
                <Gamepad2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="text"
                  id="gameName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter game name..."
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
                  required
                />
              </div>
            </div>

            {/* Manufacturer */}
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Manufacturer
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <select
                  id="manufacturer"
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
                >
                  <option value="">Select a manufacturer...</option>
                  {manufacturers.map((manufacturer) => (
                    <option key={manufacturer.id} value={manufacturer.id}>
                      {manufacturer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Game Image */}
            <div>
              <label htmlFor="gameImage" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Game Image
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="file"
                  id="gameImage"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 bg-bg-primary text-text"
                />
              </div>
              {croppedImageBlob && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ New image ready for upload
                </p>
              )}
            </div>

            {/* Game Icon */}
            <div>
              <label htmlFor="gameIcon" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Game Icon
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="file"
                  id="gameIcon"
                  accept="image/*"
                  onChange={handleIconSelect}
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 bg-bg-primary text-text"
                />
              </div>
              {croppedIconBlob && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ New icon ready for upload
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
                className="btn-ghost btn-flex"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={loading || compressing}
                className="btn-primary btn-flex"
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

      {iconForCropping && (
        <ImageCropper
          isOpen={showIconCropper}
          onClose={() => {
            setShowIconCropper(false)
            setIconForCropping(null)
            setSelectedIconFile(null)
          }}
          onCrop={handleIconCropped}
          imageFile={iconForCropping}
        />
      )}
    </>
  )
}