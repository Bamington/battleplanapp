import React, { useState, useEffect } from 'react'
import { X, MapPin, Home, Image as ImageIcon, Clock, Hash, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { compressImage, isValidImageFile } from '../utils/imageCompression'
import { ImageCropper } from './ImageCropper'
import { ManageTimeslotsModal } from './ManageTimeslotsModal'
import { EditLocationAdminsModal } from './EditLocationAdminsModal'

interface User {
  id: string
  email: string
}

interface Location {
  id: string
  name: string
  address: string
  icon: string | null
  admins: string[]
  tables: number
}

interface EditLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onLocationUpdated: () => void
  location: Location | null
}

export function EditLocationModal({ isOpen, onClose, onLocationUpdated, location }: EditLocationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    icon: '',
    tables: 1,
    admins: [] as string[]
  })
  const [selectedIconFile, setSelectedIconFile] = useState<File | null>(null)
  const [showIconCropper, setShowIconCropper] = useState(false)
  const [iconForCropping, setIconForCropping] = useState<File | null>(null)
  const [croppedIconBlob, setCroppedIconBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const [showTimeslotsModal, setShowTimeslotsModal] = useState(false)
  const [showAdminsModal, setShowAdminsModal] = useState(false)

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        icon: location.icon || '',
        tables: location.tables || 1,
        admins: location.admins || []
      })
    }
  }, [location])

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

  const handleIconCropped = (croppedFile: File) => {
    setCroppedIconBlob(croppedFile)
    setShowIconCropper(false)
    setIconForCropping(null)
  }

  const uploadFile = async (file: Blob, bucket: string, folder: string) => {
    const fileExt = selectedIconFile?.name.split('.').pop() || 'jpg'
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
    if (!location) return

    setLoading(true)
    setError('')

    try {
      let iconUrl = formData.icon

      // Upload new icon if selected
      if (croppedIconBlob) {
        setCompressing(true)
        const compressedFile = await compressImage(croppedIconBlob as File, 512, 512, 0.9)
        iconUrl = await uploadFile(compressedFile, 'location-assets', 'icons')
      }

      const { error } = await supabase
        .from('locations')
        .update({
          name: formData.name,
          address: formData.address,
          icon: iconUrl,
          tables: formData.tables,
          admins: formData.admins
        })
        .eq('id', location.id)

      if (error) throw error

      onLocationUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location')
    } finally {
      setLoading(false)
      setCompressing(false)
    }
  }

  const handleDiscard = () => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address,
        icon: location.icon || '',
        tables: location.tables || 1,
        admins: location.admins || []
      })
    }
    setSelectedIconFile(null)
    setCroppedIconBlob(null)
    setError('')
  }

  const handleAdminsUpdated = (newAdmins: string[]) => {
    setFormData(prev => ({
      ...prev,
      admins: newAdmins
    }))
  }

  if (!isOpen || !location) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleBackdropClick}
      >
        <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-title">Edit Location</h2>
            <button
              onClick={onClose}
              className="text-secondary-text hover:text-text transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Name */}
            <div>
              <label htmlFor="locationName" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Location Name
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="text"
                  id="locationName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name..."
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Address
              </label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address..."
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
                  required
                />
              </div>
            </div>

            {/* Number of Tables */}
            <div>
              <label htmlFor="tables" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Number of Tables
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="number"
                  id="tables"
                  value={formData.tables}
                  onChange={(e) => setFormData({ ...formData, tables: parseInt(e.target.value) || 0 })}
                  min="1"
                  placeholder="Enter number of tables..."
                  className="w-full pl-12 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
                  required
                />
              </div>
            </div>

            {/* Location Icon */}
            <div>
              <label htmlFor="locationIcon" className="block text-sm font-medium text-input-label font-overpass mb-2">
                Location Icon
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-icon w-5 h-5" />
                <input
                  type="file"
                  id="locationIcon"
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
            <div className="space-y-3 pt-4">
              <button
                type="button"
                onClick={() => setShowTimeslotsModal(true)}
                className="btn-secondary btn-with-icon"
              >
                <Clock className="w-4 h-4" />
                <span>Edit Timeslots</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdminsModal(true)}
                className="btn-secondary btn-with-icon"
              >
                <Users className="w-4 h-4" />
                <span>Edit Admins</span>
              </button>
              <div className="flex space-x-3">
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
            </div>
          </form>
        </div>
      </div>

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

      <ManageTimeslotsModal
        isOpen={showTimeslotsModal}
        onClose={() => setShowTimeslotsModal(false)}
        location={location}
      />

      <EditLocationAdminsModal
        isOpen={showAdminsModal}
        onClose={() => setShowAdminsModal(false)}
        location={location}
        onAdminsUpdated={handleAdminsUpdated}
      />
    </>
  )
}