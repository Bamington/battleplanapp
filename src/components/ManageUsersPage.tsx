import React, { useState, useEffect } from 'react'
import { ArrowLeft, User, MapPin, Edit, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../utils/timezone'
import { EditUserModal } from './EditUserModal'

interface User {
  id: string
  email: string
  is_admin: boolean
  created_at: string
  user_name_public?: string | null
  user_roles?: string[] | null
}

interface Location {
  id: string
  name: string
  address: string
  admins: string[]
}

interface UserWithLocations extends User {
  adminLocations: Location[]
  user_roles?: string[] | null
}

interface ManageUsersPageProps {
  onBack: () => void
}

export function ManageUsersPage({ onBack }: ManageUsersPageProps) {
  const [users, setUsers] = useState<UserWithLocations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editModal, setEditModal] = useState<{
    isOpen: boolean
    user: User | null
  }>({
    isOpen: false,
    user: null
  })
  const [roles, setRoles] = useState<{ id: number; role_name: string | null }[]>([])

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch all locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, address, admins')
        .order('name')

      if (locationsError) throw locationsError

      // Map users to include their admin locations
      const usersWithLocations = (usersData || []).map(user => {
        const adminLocations = (locationsData || []).filter(location =>
          location.admins && location.admins.includes(user.id)
        )
        return {
          ...user,
          adminLocations
        }
      })

      setUsers(usersWithLocations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, role_name')
        .order('role_name')

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }



  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEditUser = (user: User) => {
    setEditModal({
      isOpen: true,
      user
    })
  }

  const handleUserUpdated = () => {
    fetchUsers()
  }

  const getUserRoleNames = (userRoles: string[] | null) => {
    if (!userRoles || userRoles.length === 0) return []
    return userRoles.map(roleId => {
      const role = roles.find(r => r.id.toString() === roleId)
      return role?.role_name || 'Unknown Role'
    })
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border---color-brand mx-auto mb-4"></div>
          <p className="text-base text-secondary-text">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-secondary-text hover:text-text transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Admin</span>
          </button>
          <h1 className="text-4xl font-bold text-title">MANAGE USERS</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-bg-card border border-border-custom rounded-lg p-6"
            >
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between gap-6">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <User className="w-6 h-6 text-secondary-text" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-text truncate">{user.email || 'No email'}</h3>
                    <div className="text-sm text-secondary-text space-y-1">
                      <p>Joined {formatDate(user.created_at)}</p>
                      {user.user_name_public && (
                        <p className="text-brand">Public name: {user.user_name_public}</p>
                      )}
                      
                      {/* User Roles and Location Admin Status */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {/* User Roles */}
                        {user.user_roles && user.user_roles.length > 0 && 
                          getUserRoleNames(user.user_roles).map((roleName, index) => (
                            <span
                              key={`role-${index}`}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {roleName}
                            </span>
                          ))
                        }
                        
                        {/* Location Admin Status */}
                        {user.adminLocations.length > 0 && 
                          user.adminLocations.map((location) => (
                            <span
                              key={`location-${location.id}`}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              {location.name}
                            </span>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                      title="Edit User"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
                      user.is_admin 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_admin ? 'Admin' : 'User'}
                    </span>
                  </div>
                  {(user.adminLocations.length > 0 || (user.user_roles && user.user_roles.length > 0)) && (
                    <span className="text-xs text-secondary-text">
                      {user.adminLocations.length > 0 && (
                        <span>{user.adminLocations.length} location{user.adminLocations.length !== 1 ? 's' : ''} admin</span>
                      )}
                      {user.adminLocations.length > 0 && user.user_roles && user.user_roles.length > 0 && (
                        <span> • </span>
                      )}
                      {user.user_roles && user.user_roles.length > 0 && (
                        <span>{user.user_roles.length} role{user.user_roles.length !== 1 ? 's' : ''}</span>
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-3">
                {/* User Public Name */}
                {user.user_name_public && (
                  <div>
                    <h3 className="text-lg font-semibold text-text">{user.user_name_public}</h3>
                  </div>
                )}
                
                {/* User Email */}
                <div>
                  <p className="text-base text-secondary-text">{user.email || 'No email'}</p>
                </div>
                
                {/* Joined Date */}
                <div>
                  <p className="text-sm text-secondary-text">Joined {formatDate(user.created_at)}</p>
                </div>
                
                {/* All Pills - Admin, Location Admin, and Roles */}
                <div className="flex flex-wrap gap-2">
                  {/* Admin Pill */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    user.is_admin 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                  
                  {/* Location Admin Pills */}
                  {user.adminLocations.length > 0 && 
                    user.adminLocations.map((location) => (
                      <span
                        key={`location-${location.id}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        {location.name}
                      </span>
                    ))
                  }
                  
                  {/* Role Pills */}
                  {user.user_roles && user.user_roles.length > 0 && 
                    getUserRoleNames(user.user_roles).map((roleName, index) => (
                      <span
                        key={`role-${index}`}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {roleName}
                      </span>
                    ))
                  }
                </div>
                
                {/* Edit Button */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-500 hover:text-blue-700 transition-colors p-2 rounded-full hover:bg-blue-50"
                    title="Edit User"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-base text-secondary-text">No users found.</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, user: null })}
        user={editModal.user}
        onUserUpdated={handleUserUpdated}
      />
    </>
  )
}