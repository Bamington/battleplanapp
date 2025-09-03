import React, { useState, useEffect } from 'react'
import { X, MapPin, Calendar, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLocations } from '../hooks/useLocations'


interface NewBlockedDateModalProps {
  isOpen: boolean
  onClose: () => void
  onBlockedDateCreated: () => void
}

export function NewBlockedDateModal({ isOpen, onClose, onBlockedDateCreated }: NewBlockedDateModalProps) {
  const { locations: allLocations } = useLocations()
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [blockedTables, setBlockedTables] = useState<string>('')
  const [blockAllTables, setBlockAllTables] = useState<boolean>(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      filterLocationsForUser()
      resetForm()
    }
  }, [isOpen, allLocations, user])

  const filterLocationsForUser = async () => {
    if (!allLocations.length) return
    
    try {
      let filteredLocations = allLocations
      
      // If user is location admin (but not full admin), only show locations they admin
      if (user?.is_location_admin && !user?.is_admin && user?.id) {
        // We need to fetch the admins data for each location since the shared hook doesn't include it
        const { data, error } = await supabase
          .from('locations')
          .select('id, admins')
          .contains('admins', [user.id])
          
        if (error) throw error
        
        const adminLocationIds = new Set(data?.map(loc => loc.id) || [])
        filteredLocations = allLocations.filter(loc => adminLocationIds.has(loc.id))
      }
      
      // Add tables information if not present in the shared hook data
      const { data: tablesData, error: tablesError } = await supabase
        .from('locations')
        .select('id, tables')
        .in('id', filteredLocations.map(loc => loc.id))
        
      if (tablesError) throw tablesError
      
      const tablesMap = new Map(tablesData?.map(loc => [loc.id, loc.tables]) || [])
      const locationsWithTables = filteredLocations.map(loc => ({
        ...loc,
        tables: tablesMap.get(loc.id) || 0
      }))
      
      setLocations(locationsWithTables)
    } catch (err) {
      console.error('Error filtering locations:', err)
      setError('Failed to load locations')
    }
  }

  const resetForm = () => {
    setSelectedLocation('')
    setDate('')
    setDescription('')
    setBlockedTables('')
    setBlockAllTables(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedLocation || !date) {
      setError('Please fill in all required fields')
      return
    }

    // Validate blocked tables if not blocking all
    if (!blockAllTables) {
      const selectedLocationData = locations.find(loc => loc.id === selectedLocation)
      const blockedTablesNum = parseInt(blockedTables)
      
      if (!blockedTables || isNaN(blockedTablesNum) || blockedTablesNum < 1) {
        setError('Please enter a valid number of tables to block')
        return
      }
      
      if (selectedLocationData && blockedTablesNum > selectedLocationData.tables) {
        setError(`Cannot block more tables than available (${selectedLocationData.tables} total)`)
        return
      }
    }

    // Check if date is in the future
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      setError('Date must be in the future')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const blockedTablesValue = blockAllTables ? null : parseInt(blockedTables)
      
      console.log('Submitting blocked date:', {
        location_id: selectedLocation,
        date,
        description: description || null,
        blocked_tables: blockedTablesValue
      })

      const { data, error } = await supabase
        .from('blocked_dates')
        .insert({
          location_id: selectedLocation,
          date,
          description: description || null,
          blocked_tables: blockedTablesValue
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Blocked date created successfully:', data)
      
      resetForm()
      onBlockedDateCreated()
      onClose()
    } catch (err) {
      console.error('Error creating blocked date:', err)
      setError('Failed to create blocked date')
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
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]"
      onClick={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-title">Add Blocked Date</h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
                required
              >
                <option value="">Select a location</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Blocking Options */}
          <div>
            <label className="block text-sm font-medium text-text mb-3">
              Blocking Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="blockingType"
                    checked={blockAllTables}
                    onChange={() => setBlockAllTables(true)}
                    className="form-radio h-4 w-4 text-brand focus:ring-brand focus:ring-offset-0"
                  />
                  <span className="ml-2 text-text">Block all tables (no bookings allowed)</span>
                </label>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="blockingType"
                    checked={!blockAllTables}
                    onChange={() => setBlockAllTables(false)}
                    className="form-radio h-4 w-4 text-brand focus:ring-brand focus:ring-offset-0"
                  />
                  <span className="ml-2 text-text">Block specific number of tables</span>
                </label>
                {!blockAllTables && (
                  <div className="mt-2 ml-6">
                    <input
                      type="number"
                      value={blockedTables}
                      onChange={(e) => setBlockedTables(e.target.value)}
                      min="1"
                      max={locations.find(loc => loc.id === selectedLocation)?.tables || 999}
                      placeholder="Number of tables to block"
                      disabled={loading}
                      className="w-full px-3 py-2 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
                      required
                    />
                    {selectedLocation && (
                      <p className="text-xs text-secondary-text mt-1">
                        Total tables at this location: {locations.find(loc => loc.id === selectedLocation)?.tables || 'Unknown'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Description
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-icon" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                placeholder="Optional description for this blocked date..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg bg-bg-secondary text-text focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-ghost btn-flex flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedLocation || !date || (!blockAllTables && !blockedTables)}
              className="btn-primary btn-flex flex-1"
            >
              {loading ? 'Creating...' : 'Create Blocked Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
