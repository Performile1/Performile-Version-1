const https = require('https');

const data = JSON.stringify({
  email: 'test@example.com',
  password: 'testpassword'
});

const options = {
  hostname: 'performile-platform.vercel.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log('headers:', res.headers);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response (raw):', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(data);
req.end();
