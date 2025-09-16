import React, { useState } from 'react'
import { X, Calendar, MapPin, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { DatePicker } from './DatePicker'

interface NewEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
}

export function NewEventModal({ isOpen, onClose, onEventCreated }: NewEventModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
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
        .from('events')
        .insert({
          name: formData.name,
          description: formData.description || null,
          location: formData.location || null,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          user_id: user.id
        })

      if (error) throw error

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        location: '',
        start_date: '',
        end_date: ''
      })
      onEventCreated()
      onClose()
    } catch (error) {
      console.error('Error creating event:', error)
      setError('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-bg-primary border border-border-custom rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border-custom">
          <h2 className="text-xl font-semibold text-text">Create New Event</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-secondary-text" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">
              Event Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-secondary text-text"
              placeholder="Enter event name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location (Optional)
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-secondary text-text"
              placeholder="Enter event location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-text mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <DatePicker
                value={formData.start_date}
                onChange={(date) => setFormData({ ...formData, start_date: date })}
                placeholder="Select start date"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-text mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <DatePicker
                value={formData.end_date}
                onChange={(date) => setFormData({ ...formData, end_date: date })}
                placeholder="Select end date"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-text mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border-custom rounded-lg focus:ring-2 focus:ring-brand/50 focus:border-brand bg-bg-secondary text-text resize-none"
              placeholder="Enter event description"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}