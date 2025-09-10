// Simple test script to verify Resend API key
const { Resend } = require('resend');
require('dotenv').config();

console.log('Testing Resend API key...');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Found' : 'Not found');

if (!process.env.RESEND_API_KEY) {
  console.error('Error: RESEND_API_KEY is not set in environment variables');
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple test to verify the API key
async function testResend() {
  try {
    console.log('Sending test email...');
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'your-email@example.com',  // Replace with your email
      subject: 'Test Email from Performile',
      html: '<p>This is a test email from Performile to verify the Resend API key setup.</p>',
    });

    if (error) {
      console.error('Error sending email:', error);
      return;
    }

    console.log('Test email sent successfully!');
    console.log('Response:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testResend();
