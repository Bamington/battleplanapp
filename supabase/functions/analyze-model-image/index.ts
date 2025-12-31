import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

interface ModelAnalysisRequest {
  imageBase64: string
  imageMimeType?: string
  type?: 'model' | 'collection' | 'battle'
}

interface ModelAnalysisResponse {
  name?: string
  count?: number
  status?: 'None' | 'Assembled' | 'Primed' | 'Partially Painted' | 'Painted'
  game?: string
  confidence?: {
    name?: number
    count?: number
    status?: number
    game?: number
  }
  error?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, imageMimeType, type = 'model' }: ModelAnalysisRequest = await req.json()

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'imageBase64 parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Analyze the image based on type
    let analysis: ModelAnalysisResponse
    if (type === 'model') {
      analysis = await analyzeModelImage(imageBase64, imageMimeType || 'image/jpeg')
    } else {
      // Future: handle collection and battle types
      return new Response(
        JSON.stringify({ error: 'Analysis type not yet implemented' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Analyze model image function error:', error)
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

async function analyzeModelImage(imageBase64: string, mimeType: string): Promise<ModelAnalysisResponse> {
  const prompt = `You are an expert at identifying tabletop gaming miniatures and models. Analyze this image and identify the following:

1. **Model Name/Type**: The specific name or type of miniature(s) visible (e.g., "Space Marine Intercessor", "Captain America", "US Ranger Squad", "Ork Boy", "Stormcast Eternal"). Be as specific as possible. If you see multiple different models, describe the most prominent one or provide a general name if they're all the same type.

2. **Quantity/Count**: Count how many individual miniature models are visible in the image. Return just the number.

3. **Painted Status**: Determine the painting status of the model(s). Choose ONE of these exact values:
   - "None" - Unpainted, bare plastic/resin/metal
   - "Assembled" - Built but unpainted
   - "Primed" - Has primer/base coat but no colors
   - "Partially Painted" - Some colors applied but not complete
   - "Painted" - Fully painted with colors and details

4. **Game/System**: Identify the game system or franchise these models belong to (e.g., "Warhammer 40,000", "Warhammer 40k", "Age of Sigmar", "Marvel Crisis Protocol", "Star Wars: Legion", "Bolt Action", "D&D", "Dungeons & Dragons"). If uncertain, return null.

Return your response as a JSON object with this exact structure:
{
  "name": "Model name here",
  "count": number,
  "status": "One of: None, Assembled, Primed, Partially Painted, Painted",
  "game": "Game name or null"
}

Only return the JSON object, no other text or explanation.`

  try {
    // Determine the correct MIME type
    const imageMimeType = mimeType || 'image/jpeg'
    
    // Remove data URL prefix if present
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: imageMimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent results
            maxOutputTokens: 500,
            responseMimeType: 'application/json'
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('No content generated by Gemini')
    }

    // Parse the JSON response
    let analysis: any
    try {
      // Try to parse as JSON (Gemini might return JSON wrapped in markdown code blocks)
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      analysis = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', generatedText)
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse AI response as JSON')
      }
    }

    // Validate and normalize the response
    const result: ModelAnalysisResponse = {}

    if (analysis.name && typeof analysis.name === 'string') {
      result.name = analysis.name.trim()
    }

    if (analysis.count !== undefined && analysis.count !== null) {
      const count = typeof analysis.count === 'string' ? parseInt(analysis.count, 10) : analysis.count
      if (!isNaN(count) && count > 0) {
        result.count = count
      }
    }

    // Validate status is one of the allowed values
    const validStatuses = ['None', 'Assembled', 'Primed', 'Partially Painted', 'Painted']
    if (analysis.status && validStatuses.includes(analysis.status)) {
      result.status = analysis.status as ModelAnalysisResponse['status']
    }

    if (analysis.game && typeof analysis.game === 'string' && analysis.game.toLowerCase() !== 'null') {
      result.game = analysis.game.trim()
    }

    return result

  } catch (error) {
    console.error('Error analyzing model image:', error)
    return {
      error: error.message || 'Failed to analyze image'
    }
  }
}



