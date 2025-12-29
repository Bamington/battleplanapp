import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    console.log('🎯 Starting simplified booking notification test...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      url: supabaseUrl?.slice(0, 20) + '...'
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client initialized')

    // Parse request body
    const { booking_id } = await req.json()
    console.log('📝 Processing booking ID:', booking_id)

    if (!booking_id) {
      throw new Error('booking_id is required')
    }

    // Test 1: Simple booking query without joins
    console.log('🔍 Test 1: Simple booking query...')
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, date, user_name, user_email, location_id, timeslot_id, game_id')
      .eq('id', booking_id)
      .single()

    if (bookingError) {
      console.error('❌ Simple booking query failed:', bookingError)
      throw new Error(`Simple booking query failed: ${bookingError.message}`)
    }

    console.log('✅ Booking found:', booking)

    // Test 2: Location query
    console.log('🔍 Test 2: Location query...')
    const { data: location, error: locationError } = await supabaseClient
      .from('locations')
      .select('id, name, address, store_email')
      .eq('id', booking.location_id)
      .single()

    if (locationError) {
      console.error('❌ Location query failed:', locationError)
      throw new Error(`Location query failed: ${locationError.message}`)
    }

    console.log('✅ Location found:', location)

    // Test 3: Timeslot query
    console.log('🔍 Test 3: Timeslot query...')
    const { data: timeslot, error: timeslotError } = await supabaseClient
      .from('timeslots')
      .select('id, name, start_time, end_time')
      .eq('id', booking.timeslot_id)
      .single()

    if (timeslotError) {
      console.error('❌ Timeslot query failed:', timeslotError)
      throw new Error(`Timeslot query failed: ${timeslotError.message}`)
    }

    console.log('✅ Timeslot found:', timeslot)

    // Test 4: Game query (optional)
    let game = null
    if (booking.game_id) {
      console.log('🔍 Test 4: Game query...')
      const { data: gameData, error: gameError } = await supabaseClient
        .from('games')
        .select('id, name')
        .eq('id', booking.game_id)
        .single()

      if (gameError) {
        console.error('❌ Game query failed:', gameError)
        // Don't throw - game is optional
      } else {
        game = gameData
        console.log('✅ Game found:', game)
      }
    }

    // Test 5: Check for store email
    if (!location.store_email) {
      console.log('⚠️  No store email configured for location')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No store email configured',
          debug: {
            booking,
            location,
            timeslot,
            game
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Test 6: Check email service config
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL')

    console.log('Email service config:', {
      hasResendKey: !!RESEND_API_KEY,
      fromEmail: FROM_EMAIL
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'All tests passed - would send email',
        debug: {
          booking,
          location,
          timeslot,
          game,
          emailConfig: {
            hasResendKey: !!RESEND_API_KEY,
            fromEmail: FROM_EMAIL,
            toEmail: location.store_email
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Test function error:', error)

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