const https = require('https');
const { URL } = require('url');

// Configuration
const CONFIG = {
  baseUrl: 'https://performile-platform.vercel.app',
  deploymentUrl: 'https://performile-platform-yhep-unzhnh4ew-rickard-wigrunds-projects.vercel.app',
  endpoints: [
    '/',
    '/api',
    '/api/auth',
    '/api/auth/login'
  ]
};

async function testEndpoint(urlString, method = 'GET', data = null) {
  return new Promise((resolve) => {
    console.log(`\n=== Testing ${method} ${urlString} ===`);
    
    const url = new URL(urlString);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + (url.search || ''),
      method: method,
      headers: {
        'User-Agent': 'Performile Test Script',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 10000
    };
    
    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }
    
    const req = https.request(options, (res) => {
      let responseData = [];
      
      res.on('data', (chunk) => {
        responseData.push(chunk);
      });
      
      res.on('end', () => {
        const responseBody = Buffer.concat(responseData).toString();
        
        console.log(`\nResponse for ${method} ${urlString}`);
        console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        
        try {
          const json = JSON.parse(responseBody);
          console.log('Response (JSON):', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Response (raw):', responseBody);
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      if (error.code) console.error('Error code:', error.code);
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
  console.log('Starting tests...');
  console.log('Base URL:', CONFIG.baseUrl);
  console.log('Deployment URL:', CONFIG.deploymentUrl);
  
  // Test base URL endpoints
  for (const endpoint of CONFIG.endpoints) {
    await testEndpoint(`${CONFIG.baseUrl}${endpoint}`);
  }
  
  // Test deployment URL endpoints
  for (const endpoint of CONFIG.endpoints) {
    await testEndpoint(`${CONFIG.deploymentUrl}${endpoint}`);
  }
  
  // Test login with deployment URL
  await testEndpoint(
    `${CONFIG.deploymentUrl}/api/auth/login`,
    'POST',
    {
      email: 'test@example.com',
      password: 'testpassword'
    }
  );
  
  console.log('\nTests completed');
}

runTests().catch(console.error);
