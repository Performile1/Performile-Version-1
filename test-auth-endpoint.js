const https = require('https');

// Test the login endpoint
function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
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
        'Content-Length': postData.length
      },
      timeout: 10000 // 10 seconds timeout
    };

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

    req.write(postData);
    req.end();
  });
}

// Run the test
async function runTest() {
  try {
    console.log('Testing login endpoint...');
    const result = await testLogin();
    console.log('Response status:', result.status);
    console.log('Response headers:', JSON.stringify(result.headers, null, 2));
    console.log('Response data:', JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTest();
