const https = require('https');

const BASE_URL = 'performile-platform-yhep.vercel.app';
const DEPLOYMENT_URL = 'performile-platform-yhep-unzhnh4ew-rickard-wigrunds-projects.vercel.app';

const endpoints = [
  { path: '/api/auth', method: 'GET' },
  { path: '/api/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'testpassword' } }
];

function testEndpoint(hostname, path, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const options = {
      hostname,
      port: 443,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`\nTesting ${method} ${hostname}${path}`);
    
    const req = https.request(options, (res) => {
      let responseData = [];
      
      res.on('data', (chunk) => {
        responseData.push(chunk);
      });

      res.on('end', () => {
        const response = Buffer.concat(responseData).toString();
        console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          console.log('Response:', JSON.stringify(JSON.parse(response), null, 2));
        } catch (e) {
          console.log('Raw Response:', response);
        }
        
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve();
    });

    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      resolve();
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('Starting API tests...');
  
  // Test production API
  for (const endpoint of endpoints) {
    await testEndpoint(BASE_URL, endpoint.path, endpoint.method, endpoint.data);
  }
  
  // Test deployment API
  for (const endpoint of endpoints) {
    await testEndpoint(DEPLOYMENT_URL, endpoint.path, endpoint.method, endpoint.data);
  }
  
  console.log('\nTests completed');
}

runTests().catch(console.error);
