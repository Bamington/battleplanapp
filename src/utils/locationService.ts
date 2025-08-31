interface LocationData {
  country: string
  countryCode: string
  region?: string
  city?: string
}

export async function getUserLocation(): Promise<LocationData> {
  try {
    // Using ipapi.co for free IP-based geolocation
    const response = await fetch('https://ipapi.co/json/')
    
    if (!response.ok) {
      throw new Error('Failed to fetch location')
    }
    
    const data = await response.json()
    
    return {
      country: data.country_name || 'Australia',
      countryCode: data.country_code || 'AU',
      region: data.region,
      city: data.city
    }
  } catch (error) {
    console.warn('Failed to detect user location, defaulting to Australia:', error)
    // Default to Australia if location detection fails
    return {
      country: 'Australia',
      countryCode: 'AU'
    }
  }
}

export function getLocationSearchTerm(locationData: LocationData): string {
  // Create location-specific search terms for Google
  const locationTerms = []
  
  if (locationData.city) {
    locationTerms.push(locationData.city)
  }
  
  if (locationData.region && locationData.region !== locationData.city) {
    locationTerms.push(locationData.region)
  }
  
  locationTerms.push(locationData.country)
  
  return locationTerms.join(' ')
}

export function getGoogleLocationParams(locationData: LocationData): string {
  // Google Custom Search supports 'gl' (country) and 'cr' (country restrict) parameters
  const params = new URLSearchParams()
  
  // Set country parameter
  if (locationData.countryCode) {
    params.append('gl', locationData.countryCode.toLowerCase())
    params.append('cr', `country${locationData.countryCode.toUpperCase()}`)
  }
  
  return params.toString()
}