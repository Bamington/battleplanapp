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
    console.log('🎯 Database test function starting...')

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client initialized')

    // Step 1: Get booking
    console.log('🔍 Fetching booking...')
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, date, user_name, user_email, location_id, timeslot_id, game_id')
      .eq('id', booking_id)
      .single()

    if (bookingError) {
      console.error('❌ Booking query failed:', bookingError)
      throw new Error(`Failed to fetch booking: ${bookingError.message}`)
    }

    console.log('📋 Booking found:', booking)

    // Step 2: Get location
    console.log('🔍 Fetching location...')
    const { data: location, error: locationError } = await supabaseClient
      .from('locations')
      .select('id, name, address, store_email')
      .eq('id', booking.location_id)
      .single()

    if (locationError) {
      console.error('❌ Location query failed:', locationError)
      throw new Error(`Failed to fetch location: ${locationError.message}`)
    }

    console.log('📍 Location found:', location)

    // Step 3: Get timeslot
    console.log('🔍 Fetching timeslot...')
    const { data: timeslot, error: timeslotError } = await supabaseClient
      .from('timeslots')
      .select('id, name, start_time, end_time')
      .eq('id', booking.timeslot_id)
      .single()

    if (timeslotError) {
      console.error('❌ Timeslot query failed:', timeslotError)
      throw new Error(`Failed to fetch timeslot: ${timeslotError.message}`)
    }

    console.log('🕐 Timeslot found:', timeslot)

    // Step 4: Get game (optional)
    let game = null
    if (booking.game_id) {
      console.log('🔍 Fetching game...')
      const { data: gameData, error: gameError } = await supabaseClient
        .from('games')
        .select('id, name')
        .eq('id', booking.game_id)
        .single()

      if (gameError) {
        console.error('⚠️ Game query failed (optional):', gameError)
      } else {
        game = gameData
        console.log('🎲 Game found:', game)
      }
    }

    // Check for store email
    if (!location.store_email) {
      console.log('⚠️ No store email configured')
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No store email configured',
          data: { booking, location, timeslot, game }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Format the date
    let bookingDate
    try {
      bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (dateError) {
      console.error('❌ Date formatting failed:', dateError)
      bookingDate = booking.date
    }

    // Format times
    const formatTime = (timeString) => {
      try {
        if (!timeString) return 'N/A'
        const [hours, minutes] = timeString.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
      } catch (error) {
        return timeString
      }
    }

    const startTime = formatTime(timeslot.start_time)
    const endTime = formatTime(timeslot.end_time)

    console.log('✅ Database test completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database queries successful - would send email here',
        data: {
          booking,
          location,
          timeslot,
          game,
          formatted: {
            date: bookingDate,
            startTime,
            endTime
          }
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 Database test error:', error)

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