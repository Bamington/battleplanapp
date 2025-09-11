import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY')
const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_CSE_ID')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, count = 10, exclude = [] } = await req.json()

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      return new Response(
        JSON.stringify({ error: 'Google API credentials not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build the Google Custom Search API URL
    const searchParams = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_SEARCH_ENGINE_ID,
      q: query,
      searchType: 'image',
      num: Math.min(count, 10).toString(), // Google API allows max 10 results per request
      safe: 'active',
      imgSize: 'large', // Changed from 'medium' to 'large' for better resolution
      imgType: 'photo'
    })

    const apiUrl = `https://www.googleapis.com/customsearch/v1?${searchParams}`

    console.log('Searching for images with query:', query)
    console.log('API URL:', apiUrl.replace(GOOGLE_API_KEY, '[REDACTED]'))

    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch images from Google API',
          details: response.status === 429 ? 'Rate limit exceeded' : 'API error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('Google API response received, items count:', data.items?.length || 0)

    // Transform the Google API response to our expected format
    const images = (data.items || [])
      .filter((item: any) => {
        // Filter out excluded URLs
        const imageUrl = item.link || item.image?.contextLink
        return imageUrl && !exclude.includes(imageUrl)
      })
      .map((item: any) => ({
        url: item.link,
        title: item.title || item.snippet || '',
        thumbnailUrl: item.image?.thumbnailLink || item.link,
        snippet: item.snippet || '',
        contextLink: item.image?.contextLink
      }))

    console.log('Processed images count:', images.length)

    return new Response(
      JSON.stringify({ 
        images,
        totalResults: data.searchInformation?.totalResults || '0'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Search images function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})