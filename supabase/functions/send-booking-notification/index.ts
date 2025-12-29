import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingNotificationData {
  booking_id: string
  location_id: string
  user_name: string
  user_email: string
  date: string
  timeslot_name: string
  timeslot_start: string
  timeslot_end: string
  game_name?: string
  location_name: string
  location_address: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🎯 Starting booking notification process...')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      throw new Error('Supabase configuration missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client initialized')

    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError)
      throw new Error('Invalid JSON in request body')
    }

    const { booking_id } = requestBody
    console.log('📝 Processing booking ID:', booking_id)

    if (!booking_id) {
      console.error('❌ No booking_id provided')
      throw new Error('booking_id is required')
    }

    // Fetch booking details using separate queries (like our working test)
    console.log('🔍 Fetching booking details from database...')

    // Step 1: Get booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('id, date, user_name, user_email, location_id, timeslot_id, game_id')
      .eq('id', booking_id)
      .single()

    if (bookingError) {
      console.error('❌ Booking query failed:', bookingError)
      throw new Error(`Failed to fetch booking: ${bookingError.message}`)
    }

    if (!booking) {
      console.error('❌ No booking found with ID:', booking_id)
      throw new Error('Booking not found')
    }

    console.log('📋 Booking found:', booking)

    // Step 2: Get location
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

    // Restructure data to match original format
    const bookingData = {
      ...booking,
      location,
      timeslot,
      game
    }

    if (!location.store_email) {
      console.log(`⚠️  No store email configured for location: ${location.name}`)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No store email configured'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    console.log('📧 Store email found:', location.store_email)

    // Format the date nicely with error handling
    let bookingDate
    try {
      bookingDate = new Date(booking.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      console.log('📅 Formatted date:', bookingDate)
    } catch (dateError) {
      console.error('❌ Date formatting failed:', dateError)
      bookingDate = booking.date // Fallback to raw date
    }

    // Format time with error handling
    const formatTime = (timeString: string) => {
      try {
        if (!timeString) return 'N/A'
        const [hours, minutes] = timeString.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
      } catch (error) {
        console.error('❌ Time formatting error:', error)
        return timeString // Fallback to raw time
      }
    }

    const startTime = formatTime(timeslot.start_time)
    const endTime = formatTime(timeslot.end_time)
    console.log('🕐 Formatted times:', { startTime, endTime })

    // Create email content
    const emailSubject = `New Booking at ${location.name} - ${bookingDate}`

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #111827; }
        .footer { margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎲 New Table Booking</h1>
            <p>You have received a new booking at ${location.name}</p>
        </div>

        <div class="content">
            <div class="booking-details">
                <h2>📅 Booking Details</h2>

                <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span class="detail-value">#${booking.id.slice(0, 8)}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Customer Name:</span>
                    <span class="detail-value">${booking.user_name}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Customer Email:</span>
                    <span class="detail-value">${booking.user_email}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${bookingDate}</span>
                </div>

                <div class="detail-row">
                    <span class="detail-label">Time Slot:</span>
                    <span class="detail-value">${timeslot.name} (${startTime} - ${endTime})</span>
                </div>

                ${game ? `
                <div class="detail-row">
                    <span class="detail-label">Game:</span>
                    <span class="detail-value">${game.name}</span>
                </div>
                ` : ''}

                <div class="detail-row">
                    <span class="detail-label">Location:</span>
                    <span class="detail-value">${location.name}<br><small>${location.address}</small></span>
                </div>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Prepare the table for the scheduled time</li>
                <li>Contact the customer if you need to reschedule: ${booking.user_email}</li>
                <li>Update your internal booking system if needed</li>
            </ul>
        </div>

        <div class="footer">
            <p>This notification was sent automatically when a customer made a booking through your online booking system.</p>
            <p>Booking created: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `

    const emailText = `
New Table Booking at ${location.name}

Booking Details:
- Booking ID: #${booking.id.slice(0, 8)}
- Customer: ${booking.user_name} (${booking.user_email})
- Date: ${bookingDate}
- Time: ${timeslot.name} (${startTime} - ${endTime})
${game ? `- Game: ${game.name}` : ''}
- Location: ${location.name}, ${location.address}

Please prepare the table for the scheduled time and contact the customer if needed.
    `

    // Send email using Resend service
    console.log('📬 Preparing to send email...')
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'bookings@yourdomain.com'

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      throw new Error('RESEND_API_KEY not configured')
    }

    console.log('✅ Resend API key found')
    console.log('📧 From email:', FROM_EMAIL)
    console.log('📧 To email:', location.store_email)

    const emailPayload = {
      from: FROM_EMAIL,
      to: [location.store_email],
      subject: emailSubject,
      html: emailHTML,
      text: emailText,
      reply_to: booking.user_email, // Allow store to reply directly to customer
    }

    console.log('📦 Email payload prepared:', {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      reply_to: emailPayload.reply_to
    })

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    console.log('📡 Email API response status:', emailResponse.status)

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('❌ Email service error:', {
        status: emailResponse.status,
        statusText: emailResponse.statusText,
        error: errorText
      })
      throw new Error(`Email service error (${emailResponse.status}): ${errorText}`)
    }

    const emailResult = await emailResponse.json()
    console.log('✅ Email sent successfully:', emailResult)

    console.log(`Booking notification sent to ${location.store_email} for booking ${booking_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification sent successfully',
        email_id: emailResult.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending booking notification:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})