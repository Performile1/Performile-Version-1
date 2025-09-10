const https = require('https');

const DOMAIN = 'performile-platform-yhep.vercel.app';

function testEndpoint(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: DOMAIN,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`\nTesting ${method} ${path}...`);
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          console.log('Response:', JSON.stringify(json, null, 2));
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json
          });
        } catch (e) {
          console.log(`Status: ${res.statusCode}`);
          console.log('Response (raw):', data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Request timed out');
      reject(new Error('Request timed out'));
    });

    if (data) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  try {
    // Test root endpoint
    await testEndpoint('GET', '/');
    
    // Test API endpoint
    await testEndpoint('GET', '/api');
    
    // Test auth endpoint
    await testEndpoint('GET', '/api/auth');
    
    // Test login with invalid credentials
    await testEndpoint('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
