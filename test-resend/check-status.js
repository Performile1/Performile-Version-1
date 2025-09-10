require('dotenv').config();
const fetch = require('node-fetch');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ Error: RESEND_API_KEY is not set in environment variables');
  process.exit(1);
}

async function checkAPIKeyStatus() {
  try {
    console.log('🔍 Checking Resend API key status...');
    
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Key Check Failed:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });
      
      if (response.status === 403) {
        console.log('\n🔑 The API key is valid but may not have the correct permissions.');
        console.log('   Please check your Resend dashboard for the key permissions.');
      }
      
      return;
    }

    console.log('✅ API Key is valid and has access to the following domains:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error checking API key status:', error.message);
  }
}

checkAPIKeyStatus();
