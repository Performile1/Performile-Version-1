const http = require('http');
const https = require('https');
const { URL } = require('url');

function testUrl(urlString) {
  return new Promise((resolve) => {
    const url = new URL(urlString);
    const client = url.protocol === 'https:' ? https : http;
    
    console.log(`\n=== Testing ${urlString} ===`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method: 'GET',
      headers: {
        'User-Agent': 'NodeJS Test Script',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    };
    
    console.log('Request options:', JSON.stringify(options, null, 2));
    
    const req = client.request(options, (res) => {
      console.log(`\nResponse received for ${urlString}`);
      console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
      console.log('Response Headers:');
      console.log(JSON.stringify(res.headers, null, 2));
      
      let data = Buffer.alloc(0);
      
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      
      res.on('end', () => {
        console.log('\nResponse Body:');
        try {
          // Try to parse as JSON first
          const json = JSON.parse(data.toString());
          console.log(JSON.stringify(json, null, 2));
          
          // If it's a 404 with HTML, try to extract the error message
          if (res.statusCode === 404 && data.includes('NOT_FOUND')) {
            const errorMatch = data.toString().match(/<h1[^>]*>([^<]+)<\/h1>/);
            if (errorMatch) {
              console.log('\nError from Vercel:', errorMatch[1].trim());
            }
          }
        } catch (e) {
          // If not JSON, output as text
          console.log(data.toString('utf8'));
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('\nRequest error:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.syscall) console.error('System call:', error.syscall);
      resolve();
    });
    
    req.on('timeout', () => {
      console.error('\nRequest timed out');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

async function runTests() {
  const baseUrl = 'https://performile-platform-yhep.vercel.app';
  
  await testUrl(`${baseUrl}/`);
  await testUrl(`${baseUrl}/api`);
  await testUrl(`${baseUrl}/api/auth`);
  
  // Test POST to login endpoint
  console.log('\nTesting POST to /api/auth/login');
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'wrongpassword'
  });
  
  const url = new URL(`${baseUrl}/api/auth/login`);
  const req = https.request({
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'NodeJS Test Script'
    },
    timeout: 10000
  }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      try {
        const json = JSON.parse(data);
        console.log('Response (JSON):', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Response (raw):', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('Request error:', error.message);
  });
  
  req.on('timeout', () => {
    console.error('Request timed out');
    req.destroy();
  });
  
  req.write(postData);
  req.end();
}

runTests();
