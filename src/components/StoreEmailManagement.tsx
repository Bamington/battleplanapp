import React, { useState, useEffect } from 'react'
import { Mail, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Location {
  id: string
  name: string
  address: string
  store_email: string | null
}

export function StoreEmailManagement() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [emailInputs, setEmailInputs] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, address, store_email')
        .order('name')

      if (error) throw error

      setLocations(data || [])

      // Initialize email inputs with current values
      const inputs: { [key: string]: string } = {}
      data?.forEach(location => {
        inputs[location.id] = location.store_email || ''
      })
      setEmailInputs(inputs)

    } catch (err) {
      console.error('Error fetching locations:', err)
      setMessage({ type: 'error', text: 'Failed to load locations' })
    } finally {
      setLoading(false)
    }
  }

  const updateStoreEmail = async (locationId: string, email: string) => {
    setSaving(locationId)
    setMessage(null)

    try {
      // Validate email format if provided
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        throw new Error('Please enter a valid email address')
      }

      const { error } = await supabase
        .from('locations')
        .update({ store_email: email.trim() || null })
        .eq('id', locationId)

      if (error) throw error

      // Update local state
      setLocations(prev => prev.map(loc =>
        loc.id === locationId
          ? { ...loc, store_email: email.trim() || null }
          : loc
      ))

      setMessage({
        type: 'success',
        text: `Email ${email.trim() ? 'updated' : 'removed'} for ${locations.find(l => l.id === locationId)?.name}`
      })

    } catch (err) {
      console.error('Error updating store email:', err)
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update email'
      })
    } finally {
      setSaving(null)
    }
  }

  const handleEmailChange = (locationId: string, value: string) => {
    setEmailInputs(prev => ({ ...prev, [locationId]: value }))
  }

  const handleSaveEmail = (locationId: string) => {
    const email = emailInputs[locationId] || ''
    updateStoreEmail(locationId, email)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Store Email Notifications</h2>
            <p className="text-gray-600">Configure email addresses to notify stores when bookings are made</p>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {locations.map((location) => (
            <div key={location.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{location.address}</p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-md">
                      <label htmlFor={`email-${location.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Store Email Address
                      </label>
                      <input
                        type="email"
                        id={`email-${location.id}`}
                        value={emailInputs[location.id] || ''}
                        onChange={(e) => handleEmailChange(location.id, e.target.value)}
                        placeholder="store@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => handleSaveEmail(location.id)}
                      disabled={saving === location.id}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        saving === location.id
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {saving === location.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {saving === location.id ? 'Saving...' : 'Save'}
                    </button>
                  </div>

                  {location.store_email && (
                    <p className="text-sm text-green-600 mt-2">
                      ✅ Email notifications enabled for this location
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">How it works:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• When a customer makes a booking, an email is automatically sent to the store's configured email address</li>
            <li>• The email includes all booking details: customer info, date, time, game, and location</li>
            <li>• Stores can reply directly to the customer using the email's reply-to address</li>
            <li>• Leave the email field empty to disable notifications for that location</li>
          </ul>
        </div>
      </div>
    </div>
  )
}