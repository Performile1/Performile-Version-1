const https = require('https');

const BASE_URL = 'https://performile-platform.vercel.app';
const DEPLOYMENT_URL = 'https://performile-platform-yhep-unzhnh4ew-rickard-wigrunds-projects.vercel.app';

function testLogin(baseUrl) {
  return new Promise((resolve) => {
    console.log(`\n=== Testing login at ${baseUrl} ===`);
    
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    });

    const url = new URL('/api/auth/login', baseUrl);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length,
        'User-Agent': 'Performile Test Script',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    console.log(`Sending POST to: ${url.toString()}`);
    
    const req = https.request(options, (res) => {
      let data = [];
      
      console.log(`\nResponse from ${baseUrl}`);
      console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        data.push(chunk);
      });

      res.on('end', () => {
        try {
          const response = Buffer.concat(data).toString();
          console.log('Response Body:');
          try {
            console.log(JSON.stringify(JSON.parse(response), null, 2));
          } catch (e) {
            console.log(response);
          }
        } catch (e) {
          console.error('Error processing response:', e.message);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.syscall) console.error('System call:', error.syscall);
      resolve();
    });

    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Starting authentication tests...');
  
  // Test production URL
  await testLogin(BASE_URL);
  
  // Test deployment URL
  await testLogin(DEPLOYMENT_URL);
  
  console.log('\nTests completed');
}

runTests().catch(console.error);
