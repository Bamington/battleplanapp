import React, { useState } from 'react'
import { X, Calendar, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DatePicker } from './DatePicker'

interface NewCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onCampaignCreated: () => void
}

export function NewCampaignModal({ isOpen, onClose, onCampaignCreated }: NewCampaignModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          created_by: user.id
        })

      if (error) throw error

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
      })
      onCampaignCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
      })
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-bg-card rounded-lg shadow-xl w-full max-w-md border border-border-custom">
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-semibold text-title">Create New Campaign</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-title mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent bg-bg-secondary text-text"
              placeholder="Enter campaign name"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-title mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent bg-bg-secondary text-text"
              placeholder="Describe your campaign..."
              rows={3}
              disabled={loading}
            />
          </div>


          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-title mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
                minDate="1900-01-01"
                placeholder="Start date"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-title mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={(date) => setFormData({ ...formData, end_date: date })}
                minDate="1900-01-01"
                placeholder="End date"
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}