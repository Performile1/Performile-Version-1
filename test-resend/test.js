const { Resend } = require('resend');
require('dotenv').config();

console.log('🚀 Starting Resend API test...');
console.log('---------------------------');

// Verify API key
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('❌ Error: RESEND_API_KEY is not set in environment variables');
  process.exit(1);
}
console.log('✅ RESEND_API_KEY found in environment variables');

const resend = new Resend(apiKey);
const testEmail = 'admin@performile.com';

async function sendTestEmail() {
  console.log('\n📧 Sending test email to:', testEmail);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: testEmail,
      subject: '🚀 Performile Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0066cc;">Test Email from Performile</h2>
          <p>This is a test email to verify the Resend API integration.</p>
          <p>If you're seeing this, email sending is working correctly! 🎉</p>
          <p style="margin-top: 30px; color: #666; font-size: 0.9em;">
            Sent at: ${new Date().toISOString()}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', {
        status: error.statusCode,
        name: error.name,
        message: error.message,
      });
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📨 Message ID:', data.id);
    console.log('📤 Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Unexpected error:', {
      name: error.name,
      message: error.message,
      stack: error.stack.split('\n').slice(0, 3).join('\n') + '...',
    });
  }
}

// Run the test
sendTestEmail();
