import React, { useState, useEffect } from 'react'
import { X, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { MultiSelectDropdown } from './MultiSelectDropdown'

interface Role {
  id: number
  role_name: string | null
  booking_limit: number | null
}

interface User {
  id: string
  email: string
  user_name_public: string | null
  user_roles: string[] | null
  is_admin: boolean | null
  created_at: string | null
}

interface EditUserModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUserUpdated: () => void
}

export function EditUserModal({ isOpen, onClose, user, onUserUpdated }: EditUserModalProps) {
  const [userName, setUserName] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setUserName(user.user_name_public || '')
      setSelectedRoles(user.user_roles || [])
    }
  }, [user])

  // Fetch roles when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRoles()
    }
  }, [isOpen])

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true)
      const { data, error } = await supabase
        .from('roles')
        .select('id, role_name, booking_limit')
        .order('role_name')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      setError('Failed to load roles')
    } finally {
      setLoadingRoles(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          user_name_public: userName.trim() || null,
          user_roles: selectedRoles.length > 0 ? selectedRoles : null
        })
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('Supabase update error:', error)
        throw error
      }

      // Close modal and trigger refresh
      onUserUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      setError('Failed to update user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't close if clicking on dropdown elements or their portaled content
    const target = e.target as Element
    if (target.closest('[data-dropdown]') || 
        target.closest('.multiselect-dropdown-portal') ||
        target.getAttribute('data-dropdown') === 'true') {
      return
    }
    
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !user) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-0 sm:p-4 z-50"
      onMouseDown={handleBackdropClick}
    >
      <div className="bg-modal-bg rounded-none sm:rounded-lg max-w-lg w-full h-screen sm:h-auto sm:max-h-[90vh] flex flex-col overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text font-overpass">
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="text-secondary-text hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* User Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-input-label font-overpass mb-2">
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-icon" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-10 pr-4 py-3 border border-border-custom rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-secondary-text mt-1">Email cannot be changed</p>
          </div>

          {/* Public Username */}
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-input-label font-overpass mb-2">
              Public Username
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter public username"
              className="w-full px-4 py-3 border border-border-custom rounded-lg focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)] placeholder-secondary-text bg-bg-primary text-text"
              disabled={loading}
            />
            <p className="text-xs text-secondary-text mt-1">This name will be displayed publicly</p>
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-input-label font-overpass mb-2">
              Roles
            </label>
            {loadingRoles ? (
              <div className="w-full px-4 py-3 border border-border-custom rounded-lg bg-bg-primary">
                <div className="animate-pulse flex space-x-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ) : (
              <MultiSelectDropdown
                options={roles.map(role => ({
                  id: role.id.toString(),
                  name: role.role_name || 'Unnamed Role',
                  address: role.booking_limit ? `Booking limit: ${role.booking_limit}` : 'No booking limit'
                }))}
                selectedOptions={selectedRoles}
                onSelectionChange={setSelectedRoles}
                placeholder="Select roles"
                maxSelections={10}
                searchable={true}
                type="role"
              />
            )}
            <p className="text-xs text-secondary-text mt-1">Select roles to assign to this user</p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
