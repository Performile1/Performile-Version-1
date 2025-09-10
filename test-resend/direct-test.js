require('dotenv').config();
const fetch = require('node-fetch');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TEST_EMAIL = 'admin@performile.com';

if (!RESEND_API_KEY) {
  console.error('❌ Error: RESEND_API_KEY is not set in environment variables');
  process.exit(1);
}

console.log('🔑 API Key found in environment variables');
console.log('📧 Sending test email to:', TEST_EMAIL);

async function testResendAPI() {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: TEST_EMAIL,
        subject: 'Direct API Test from Performile',
        html: '<strong>This is a direct API test from Performile</strong>'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📨 Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Network/Request error:', error.message);
  }
}

testResendAPI();
