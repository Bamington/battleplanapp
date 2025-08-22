import React, { useState, useEffect } from 'react'
import { X, Plus, Edit, Trash2, Clock, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Timeslot {
  id: string
  name: string
  start_time: string
  end_time: string
  location_id: string
  availability: string[]
  created_at: string
}

interface Location {
  id: string
  name: string
  address: string
  icon: string | null
}

interface ManageTimeslotsModalProps {
  isOpen: boolean
  onClose: () => void
  location: Location
}

export function ManageTimeslotsModal({ isOpen, onClose, location }: ManageTimeslotsModalProps) {
  const [timeslots, setTimeslots] = useState<Timeslot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTimeslot, setEditingTimeslot] = useState<Timeslot | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    start_time: '',
    end_time: '',
    availability: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    if (isOpen) {
      fetchTimeslots()
    }
  }, [isOpen, location.id])

  const fetchTimeslots = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('timeslots')
        .select('*')
        .eq('location_id', location.id)
        .order('start_time')

      if (error) throw error
      setTimeslots(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeslots')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      start_time: '',
      end_time: '',
      availability: []
    })
    setEditingTimeslot(null)
    setShowAddForm(false)
  }

  const handleEdit = (timeslot: Timeslot) => {
    setFormData({
      name: timeslot.name,
      start_time: timeslot.start_time,
      end_time: timeslot.end_time,
      availability: timeslot.availability || []
    })
    setEditingTimeslot(timeslot)
    setShowAddForm(true)
  }

  const handleDelete = async (timeslotId: string) => {
    if (!confirm('Are you sure you want to delete this timeslot?')) return

    try {
      const { error } = await supabase
        .from('timeslots')
        .delete()
        .eq('id', timeslotId)

      if (error) throw error
      await fetchTimeslots()
    } catch (err) {
      console.error('Error deleting timeslot:', err)
      alert('Failed to delete timeslot')
    }
  }

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day)
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.start_time || !formData.end_time) return

    setSubmitting(true)
    setError(null)

    try {
      if (editingTimeslot) {
        // Update existing timeslot
        const { error } = await supabase
          .from('timeslots')
          .update({
            name: formData.name.trim(),
            start_time: formData.start_time,
            end_time: formData.end_time,
            availability: formData.availability
          })
          .eq('id', editingTimeslot.id)

        if (error) throw error
      } else {
        // Create new timeslot
        const { error } = await supabase
          .from('timeslots')
          .insert({
            name: formData.name.trim(),
            start_time: formData.start_time,
            end_time: formData.end_time,
            location_id: location.id,
            availability: formData.availability
          })

        if (error) throw error
      }

      await fetchTimeslots()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save timeslot')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-title">Manage Timeslots - {location.name}</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Add Timeslot Button */}
        {!showAddForm && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Timeslot</span>
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-bg-secondary rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-title mb-4">
              {editingTimeslot ? 'Edit Timeslot' : 'Add New Timeslot'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                  Timeslot Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning Session, Evening Games"
                  className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-bg-primary text-text"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-input-label font-overpass mb-2">
                  Available Days
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.availability.includes(day)
                          ? 'bg-amber-500 text-white'
                          : 'bg-bg-primary border border-border-custom text-text hover:bg-bg-secondary'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-border-custom text-text rounded-lg hover:bg-bg-secondary transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg transition-colors font-medium"
                >
                  {submitting ? 'Saving...' : editingTimeslot ? 'Update Timeslot' : 'Add Timeslot'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Timeslots List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-title">Current Timeslots</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-secondary-text">Loading timeslots...</p>
            </div>
          ) : timeslots.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <p className="text-secondary-text">No timeslots configured for this location.</p>
            </div>
          ) : (
            timeslots.map((timeslot) => (
              <div
                key={timeslot.id}
                className="bg-bg-card border border-border-custom rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-text">{timeslot.name}</h4>
                  <p className="text-sm text-secondary-text">
                    {formatTime(timeslot.start_time)} - {formatTime(timeslot.end_time)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {timeslot.availability?.map((day) => (
                      <span
                        key={day}
                        className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full"
                      >
                        {day.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(timeslot)}
                    className="p-2 text-secondary-text hover:text-text transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(timeslot.id)}
                    className="p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}