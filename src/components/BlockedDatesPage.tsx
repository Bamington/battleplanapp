import React, { useState } from 'react'
import { ArrowLeft, Plus, MapPin, Calendar, Trash2, Ban } from 'lucide-react'
import { NewBlockedDateModal } from './NewBlockedDateModal'
import { useBlockedDates } from '../hooks/useBlockedDates'
import { supabase } from '../lib/supabase'

interface BlockedDatesPageProps {
  onBack: () => void
}

export function BlockedDatesPage({ onBack }: BlockedDatesPageProps) {
  const [showNewBlockedDateModal, setShowNewBlockedDateModal] = useState(false)
  const { blockedDates, loading, error, refetch } = useBlockedDates()

  const handleDeleteBlockedDate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blocked date?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the list
      refetch()
    } catch (err) {
      console.error('Error deleting blocked date:', err)
      alert('Failed to delete blocked date')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-icon" />
          </button>
          <h1 className="text-2xl font-bold text-title">Blocked Dates</h1>
        </div>
        <button
          onClick={() => setShowNewBlockedDateModal(true)}
          className="btn-primary btn-with-icon"
        >
          <Plus className="w-4 h-4" />
          <span>Add blocked date</span>
        </button>
      </div>

      {/* Blocked Dates List */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-secondary-text">Loading blocked dates...</p>
        </div>
      ) : blockedDates.length === 0 ? (
        <div className="text-center py-12">
          <Ban className="w-16 h-16 text-secondary-text mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-title mb-2">No blocked dates</h3>
          <p className="text-secondary-text mb-6">
            {blockedDates.length === 0 
              ? "You haven't blocked any dates yet. Click 'Add blocked date' to get started."
              : "No blocked dates found for your locations."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {blockedDates.map((blockedDate) => (
            <div
              key={blockedDate.id}
              className="bg-bg-secondary border border-border-custom rounded-lg p-4 hover:bg-bg-tertiary transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-icon" />
                    <span className="font-medium text-text">
                      {blockedDate.locations?.name || 'Unknown Location'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-icon" />
                    <span className="text-text">
                      {formatDate(blockedDate.date)}
                    </span>
                  </div>
                  {blockedDate.description && (
                    <p className="text-secondary-text text-sm">
                      {blockedDate.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteBlockedDate(blockedDate.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete blocked date"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Blocked Date Modal */}
      <NewBlockedDateModal
        isOpen={showNewBlockedDateModal}
        onClose={() => setShowNewBlockedDateModal(false)}
        onBlockedDateCreated={refetch}
      />
    </div>
  )
}
