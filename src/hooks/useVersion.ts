import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Version {
  id: number
  ver_number: number
  created_at: string
}

export function useVersion() {
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch the latest version
  const fetchCurrentVersion = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('version')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        throw fetchError
      }

      setCurrentVersion(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch version')
      console.error('Error fetching version:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create a new version (increment by 0.1)
  const createNewVersion = async () => {
    try {
      setError(null)

      // Get the latest version number
      const { data: latestVersion, error: fetchError } = await supabase
        .from('version')
        .select('ver_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // Calculate new version number
      const newVersionNumber = (latestVersion?.ver_number || 1.0) + 0.1

      // Insert new version
      const { data, error: insertError } = await supabase
        .from('version')
        .insert({
          ver_number: newVersionNumber,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Update local state
      setCurrentVersion(data)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new version')
      console.error('Error creating new version:', err)
      throw err
    }
  }

  // Fetch version on mount
  useEffect(() => {
    fetchCurrentVersion()
  }, [])

  return {
    currentVersion,
    loading,
    error,
    fetchCurrentVersion,
    createNewVersion
  }
}
