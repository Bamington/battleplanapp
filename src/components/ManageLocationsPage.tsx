import React, { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Edit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useLocations } from '../hooks/useLocations'
import { EditLocationModal } from './EditLocationModal'
import { useAuth } from '../hooks/useAuth'


interface ManageLocationsPageProps {
  onBack: () => void
  isLocationAdmin?: boolean
}

export function ManageLocationsPage({ onBack, isLocationAdmin = false }: ManageLocationsPageProps) {
  const { locations: basicLocations, loading: basicLoading, error: basicError, refetch } = useLocations()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    location: Location | null
  }>({
    isOpen: false,
    location: null
  })

  useEffect(() => {
    fetchLocationsWithDetails()
  }, [basicLocations, user, isLocationAdmin])

  const fetchLocationsWithDetails = async () => {
    if (!basicLocations.length && basicLoading) {
      setLoading(true)
      return
    }
    
    if (basicError) {
      setError(basicError)
      setLoading(false)
      return
    }
    
    try {
      // Get full location details with admin info since the basic hook doesn't include it
      let query = supabase
        .from('locations')
        .select('*')
        .order('name')

      // If user is location admin (but not full admin), only show locations they admin
      if (isLocationAdmin && !user?.is_admin && user?.id) {
        query = query.contains('admins', [user.id])
      }

      const { data, error } = await query

      if (error) throw error
      setLocations(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch locations')
    } finally {
      setLoading(false)
    }
  }

  const handleEditLocation = (location: Location) => {
    setEditModal({
      isOpen: true,
      location
    })
  }

  const handleLocationUpdated = () => {
    refetch() // Refetch the basic locations data
    fetchLocationsWithDetails() // Also refetch the detailed data
    setEditModal({ isOpen: false, location: null })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border---color-brand mx-auto mb-4"></div>
          <p className="text-base text-secondary-text">Loading locations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Admin</span>
        </button>
        <h1 className="text-4xl font-bold text-title">MANAGE LOCATIONS</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className="bg-bg-card border border-border-custom rounded-lg p-6 flex items-center justify-between gap-6"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {location.icon ? (
                <img
                  src={location.icon}
                  alt={`${location.name} icon`}
                  className="w-12 h-12 object-contain rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback && fallback.classList.contains('icon-fallback')) {
                      fallback.style.display = 'flex'
                    }
                  }}
                />
              ) : null}
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center icon-fallback" style={{ display: location.icon ? 'none' : 'flex' }}>
                <span className="text-white text-sm font-bold">{location.name.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-text truncate">{location.name}</h3>
                <p className="text-sm text-secondary-text truncate">{location.address}</p>
                <p className="text-xs text-secondary-text">{location.tables} table{location.tables !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <button
              onClick={() => handleEditLocation(location)}
              className="btn-secondary-sm btn-with-icon-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        ))}
      </div>

      {locations.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-base text-secondary-text">No locations found.</p>
        </div>
      )}

      <EditLocationModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, location: null })}
        onLocationUpdated={handleLocationUpdated}
        location={editModal.location}
      />
    </div>
  )
}