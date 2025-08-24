import React, { useState, useEffect } from 'react'
import { X, Users, Plus, Trash2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
}

interface EditLocationAdminsModalProps {
  isOpen: boolean
  onClose: () => void
  location: Location | null
  onAdminsUpdated: (newAdmins: string[]) => void
}

export function EditLocationAdminsModal({ isOpen, onClose, location, onAdminsUpdated }: EditLocationAdminsModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && location) {
      fetchUsers()
      fetchAdminUsers()
    }
  }, [isOpen, location])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .order('email')

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchAdminUsers = async () => {
    if (!location?.admins) {
      setAdminUsers([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .in('id', location.admins)
        .order('email')

      if (error) throw error
      setAdminUsers(data || [])
    } catch (err) {
      console.error('Error fetching admin users:', err)
    }
  }

  const handleAddAdmin = async () => {
    if (!searchTerm.trim() || !location) return

    setAdding(true)
    setError('')

    try {
      // Find user by email
      const user = users.find(u => u.email.toLowerCase() === searchTerm.toLowerCase().trim())
      
      if (!user) {
        setError('User not found')
        setAdding(false)
        return
      }

      if (location.admins.includes(user.id)) {
        setError('User is already an admin')
        setAdding(false)
        return
      }

      const newAdmins = [...location.admins, user.id]

      // Update location in database
      const { error } = await supabase
        .from('locations')
        .update({ admins: newAdmins })
        .eq('id', location.id)

      if (error) throw error

      // Update local state
      setAdminUsers([...adminUsers, user])
      onAdminsUpdated(newAdmins)
      setSearchTerm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add admin')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveAdmin = async (userId: string) => {
    if (!location) return

    try {
      const newAdmins = location.admins.filter(id => id !== userId)

      // Update location in database
      const { error } = await supabase
        .from('locations')
        .update({ admins: newAdmins })
        .eq('id', location.id)

      if (error) throw error

      // Update local state
      setAdminUsers(adminUsers.filter(user => user.id !== userId))
      onAdminsUpdated(newAdmins)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddAdmin()
    }
  }

  if (!isOpen || !location) return null

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
      <div className="bg-modal-bg rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-title">Edit Location Admins - {location.name}</h2>
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

        {/* Add Admin Section */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-title mb-3">Add New Admin</h3>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-text w-4 h-4" />
              <input
                type="email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter user email address..."
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring---color-brand focus:border---color-brand bg-bg-primary text-text"
              />
            </div>
            <button
              onClick={handleAddAdmin}
              disabled={!searchTerm.trim() || adding}
              className="btn-primary-sm btn-with-icon-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{adding ? 'Adding...' : 'Add'}</span>
            </button>
          </div>
          <p className="text-xs text-secondary-text mt-2">
            Enter the exact email address of the user you want to add as an admin.
          </p>
        </div>

        {/* Current Admins List */}
        <div>
          <h3 className="text-md font-semibold text-title mb-3">Current Admins</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border---color-brand mx-auto mb-4"></div>
              <p className="text-secondary-text">Loading admins...</p>
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-secondary-text mx-auto mb-4" />
              <p className="text-secondary-text">No admins assigned to this location.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-bg-secondary rounded-lg border border-border-custom"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-secondary-text" />
                    <span className="text-text font-medium">{user.email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(user.id)}
                    className="p-2 text-icon hover:text-icon-hover hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove admin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-border-custom">
          <button
            onClick={onClose}
            className="btn-primary btn-full"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}