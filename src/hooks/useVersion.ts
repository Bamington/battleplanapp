import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Version {
  id: number
  ver_number: string
  created_at: string
  ver_notes?: string | null
  published: boolean
}

// Get version from package.json as fallback
function getPackageVersion(): string {
  try {
    // This will be replaced at build time or we can import it
    // For now, we'll use a default that matches package.json
    return '1.2.0'
  } catch {
    return '1.0.0'
  }
}

export function useVersion() {
  // Initialize with package.json version immediately so it shows right away
  const [currentVersion, setCurrentVersion] = useState<Version | null>(() => ({
    id: 0,
    ver_number: getPackageVersion(),
    created_at: new Date().toISOString(),
    ver_notes: 'Default version',
    published: true
  }))
  const [loading, setLoading] = useState(false) // Start as false since we have a default
  const [error, setError] = useState<string | null>(null)

  // Create a default version from package.json
  const getDefaultVersion = (): Version => ({
    id: 0,
    ver_number: getPackageVersion(),
    created_at: new Date().toISOString(),
    ver_notes: 'Default version',
    published: true
  })

  // Fetch the latest version
  const fetchCurrentVersion = async () => {
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Version fetch timeout, keeping default version')
      setLoading(false)
    }, 3000) // 3 second timeout

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('version')
        .select('id, ver_number, created_at, ver_notes, published')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1)

      clearTimeout(timeoutId)

      if (fetchError) {
        // If it's a permission error or table doesn't exist, just show a default version
        if (fetchError.code === '42501' || fetchError.code === '42P01' || fetchError.code === 'PGRST116') {
          console.warn('Version table not accessible, using default version')
          setCurrentVersion(getDefaultVersion())
          setLoading(false)
          return
        }
        throw fetchError
      }

      // If no version exists, use default
      if (!data || data.length === 0) {
        console.warn('No version found in database, using default version')
        setCurrentVersion(getDefaultVersion())
      } else {
        setCurrentVersion(data[0])
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Error fetching version:', err)
      // Set a default version instead of showing error
      setCurrentVersion(getDefaultVersion())
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
