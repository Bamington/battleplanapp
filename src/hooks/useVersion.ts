import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Version {
  id: number
  ver_number: number
  created_at: string
  ver_notes?: string | null
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

      if (fetchError) {
        // If it's a permission error or table doesn't exist, just show a default version
        if (fetchError.code === '42501' || fetchError.code === '42P01' || fetchError.code === 'PGRST116') {
          console.warn('Version table not accessible, using default version')
          setCurrentVersion({
            id: 0,
            ver_number: 1.00,
            created_at: new Date().toISOString(),
            ver_notes: 'Default version'
          })
          return
        }
        throw fetchError
      }

      // If no version exists, don't try to create one (let admins handle this)
      if (!data || data.length === 0) {
        console.warn('No version found in database, using default version')
        setCurrentVersion({
          id: 0,
          ver_number: 1.00,
          created_at: new Date().toISOString(),
          ver_notes: 'Default version'
        })
      } else {
        setCurrentVersion(data[0])
      }
    } catch (err) {
      console.error('Error fetching version:', err)
      // Set a default version instead of showing error
      setCurrentVersion({
        id: 0,
        ver_number: 1.00,
        created_at: new Date().toISOString(),
        ver_notes: 'Default version'
      })
    } finally {
      setLoading(false)
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
    fetchCurrentVersion
  }
}
