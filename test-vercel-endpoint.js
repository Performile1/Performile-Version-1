const https = require('https');

function testEndpoint(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'performile-platform.vercel.app',
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

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: json
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
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
    console.log('Testing API endpoint availability...');
    
    // Test root endpoint
    console.log('\n1. Testing root endpoint...');
    const rootResult = await testEndpoint('GET', '/');
    console.log(`Status: ${rootResult.status}`);
    
    // Test API endpoint
    console.log('\n2. Testing API endpoint...');
    const apiResult = await testEndpoint('GET', '/api');
    console.log(`Status: ${apiResult.status}`);
    
    // Test auth endpoint
    console.log('\n3. Testing auth endpoint...');
    const authResult = await testEndpoint('GET', '/api/auth');
    console.log(`Status: ${authResult.status}`);
    
    // Test login endpoint with invalid credentials
    console.log('\n4. Testing login with invalid credentials...');
    try {
      const loginResult = await testEndpoint('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      console.log(`Status: ${loginResult.status}`);
      console.log('Response:', JSON.stringify(loginResult.data, null, 2));
    } catch (error) {
      console.error('Login test failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();
