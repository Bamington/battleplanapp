// Debug script to test email notification
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugEmailNotification() {
  console.log('🔍 Debugging Email Notification System...\n')

  try {
    // 1. Check recent bookings
    console.log('1. Fetching recent bookings...')
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        date,
        user_name,
        user_email,
        created_at,
        location:locations(
          id,
          name,
          store_email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5)

    if (bookingError) {
      console.error('❌ Error fetching bookings:', bookingError)
      return
    }

    console.log(`📋 Found ${bookings.length} recent bookings:`)
    bookings.forEach((booking, index) => {
      console.log(`  ${index + 1}. ID: ${booking.id.slice(0, 8)} | ${booking.user_name} | ${booking.location.name}`)
      console.log(`     Store Email: ${booking.location.store_email || 'NOT SET'}`)
      console.log(`     Created: ${new Date(booking.created_at).toLocaleString()}`)
      console.log()
    })

    // 2. Test function call with most recent booking
    if (bookings.length > 0) {
      const testBooking = bookings[0]
      console.log(`2. Testing function call with booking: ${testBooking.id.slice(0, 8)}`)

      if (!testBooking.location.store_email) {
        console.log('⚠️  WARNING: This location has no store_email set!')
        console.log('   The function will return early without sending email.')
      }

      const { data: functionResult, error: functionError } = await supabase.functions.invoke('send-booking-notification', {
        body: { booking_id: testBooking.id }
      })

      if (functionError) {
        console.error('❌ Function error:', functionError)
      } else {
        console.log('✅ Function response:', functionResult)
      }
    } else {
      console.log('⚠️  No bookings found to test with.')
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

// Add proper environment check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('⚠️  Environment variables not set. Please set SUPABASE_URL and SUPABASE_ANON_KEY')
  console.log('For testing, you can run:')
  console.log('set SUPABASE_URL=your-url && set SUPABASE_ANON_KEY=your-key && node debug-email.js')
} else {
  debugEmailNotification()
}