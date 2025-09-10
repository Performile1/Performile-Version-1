const https = require('https');

const options = {
  hostname: 'performile-platform-yhep.vercel.app',
  port: 443,
  path: '/api/auth',
  method: 'GET',
  headers: {
    'User-Agent': 'NodeJS Test Script',
    'Accept': 'application/json'
  },
  timeout: 10000
};

console.log('Testing connection to:', options.hostname + options.path);
console.log('Request details:', JSON.stringify(options, null, 2));

const req = https.request(options, (res) => {
  console.log('\nResponse received:');
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response Body (JSON):', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response Body (raw):', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.on('timeout', () => {
  console.error('Request timed out');
  req.destroy();
});

req.end();

// Also try with a basic fetch
console.log('\nTrying with fetch...');
const fetch = require('node-fetch');

async function testFetch() {
  try {
    const response = await fetch('https://performile-platform-yhep.vercel.app/api/auth');
    console.log('\nFetch Response:');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    
    try {
      const data = await response.text();
      try {
        console.log('Body (JSON):', JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        console.log('Body (text):', data);
      }
    } catch (e) {
      console.error('Error reading response body:', e);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testFetch();
