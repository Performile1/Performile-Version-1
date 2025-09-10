const https = require('https');

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
      timeout: 5000 // 5 second timeout
    };

    console.log(`\nTesting ${method} ${hostname}${path}`);
    
    const req = https.request(options, (res) => {
      let data = [];
      
      res.on('data', (chunk) => data.push(chunk));
      
      res.on('end', () => {
        const response = Buffer.concat(data).toString();
        console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('Response:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
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
  // Test production API
  await testEndpoint('performile-platform.vercel.app', '/api/auth');
  
  // Test deployment API
  await testEndpoint('performile-platform-yhep.vercel.app', '/api/auth');
  
  console.log('\nTests completed');
}

runTests().catch(console.error);
