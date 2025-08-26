import React, { useState, useEffect } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatLocalDate } from '../utils/timezone'

interface User {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

interface ManageUsersPageProps {
  onBack: () => void
}

export function ManageUsersPage({ onBack }: ManageUsersPageProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminStatus = async (userId: string, currentAdminStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentAdminStatus })
        .eq('id', userId)

      if (error) throw error
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !currentAdminStatus }
          : user
      ))
    } catch (err) {
      console.error('Error updating admin status:', err)
      alert('Failed to update admin status')
    }
  }

  const formatDate = (dateString: string) => {
    return formatLocalDate(dateString, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
            className="bg-bg-card border border-border-custom rounded-lg p-6 flex items-center justify-between gap-6"
          >
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <User className="w-6 h-6 text-secondary-text" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-text truncate">{user.email || 'No email'}</h3>
                <p className="text-sm text-secondary-text">
                  Joined {formatDate(user.created_at)}
                </p>
              </div>
            </div>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex-shrink-0 ${
              user.is_admin 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {user.is_admin ? 'Admin' : 'User'}
            </span>
          </div>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-base text-secondary-text">No users found.</p>
        </div>
      )}
    </div>
  )
}