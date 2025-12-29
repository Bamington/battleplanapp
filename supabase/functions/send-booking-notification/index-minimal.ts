import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎯 Minimal test function starting...')

    // Parse request body
    const requestBody = await req.json()
    console.log('📝 Request body:', requestBody)

    const { booking_id } = requestBody

    if (!booking_id) {
      console.log('❌ No booking_id provided')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'booking_id is required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    console.log('📝 Processing booking ID:', booking_id)

    // Check environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL')

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasResendKey: !!resendApiKey,
      fromEmail: fromEmail
    })

    // Just return success for now
    console.log('✅ Minimal test completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Minimal test passed',
        data: {
          booking_id,
          env_check: {
            hasUrl: !!supabaseUrl,
            hasServiceKey: !!supabaseServiceKey,
            hasResendKey: !!resendApiKey,
            fromEmail: fromEmail
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Minimal test error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})