// Direct test of Resend API
const RESEND_API_KEY = 'your-resend-api-key'; // Replace with actual key
const FROM_EMAIL = 'bookings@battleplanapp.com';
const TO_EMAIL = 'test@example.com'; // Replace with test email

async function testResendDirectly() {
    console.log('🧪 Testing Resend API directly...');

    const emailPayload = {
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: 'Test Email from Battleplan Booking System',
        html: `
            <h1>Test Email</h1>
            <p>This is a test email to verify the Resend API is working correctly.</p>
            <p>Sent at: ${new Date().toISOString()}</p>
        `,
        text: 'Test email from Battleplan booking system'
    };

    console.log('📧 Sending email with payload:', {
        from: emailPayload.from,
        to: emailPayload.to,
        subject: emailPayload.subject
    });

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📄 Response body:', responseText);

        if (!response.ok) {
            console.error('❌ Email failed:', responseText);
            return;
        }

        const result = JSON.parse(responseText);
        console.log('✅ Email sent successfully:', result);

    } catch (error) {
        console.error('💥 Error sending email:', error);
    }
}

// Instructions
console.log('⚠️  Before running this test:');
console.log('1. Replace RESEND_API_KEY with your actual API key');
console.log('2. Replace TO_EMAIL with your test email address');
console.log('3. Run: node test-email-direct.js');
console.log('');

// testResendDirectly();