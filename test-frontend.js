const https = require('https');

const PROD_URL = 'https://performile-platform-yhep.vercel.app';
const DEPLOYMENT_URL = 'https://performile-platform-yhep-unzhnh4ew-rickard-wigrunds-projects.vercel.app';

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\n=== Testing ${url} ===`);
    
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = [];
      
      console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => data.push(chunk));
      
      res.on('end', () => {
        const content = Buffer.concat(data).toString();
        console.log('Content Length:', content.length, 'bytes');
        
        // Check for common issues
        if (content.includes('404') || content.includes('NOT_FOUND')) {
          console.log('⚠️  Page not found (404)');
        } else if (content.length < 1000) {
          console.log('⚠️  Content seems too small, might be an error page');
          console.log('Content Preview:', content.substring(0, 200) + '...');
        } else {
          console.log('✅ Page loaded successfully');
          
          // Check for React app mount point
          if (content.includes('id="root"') || content.includes('id="app"') || content.includes('id="__next"')) {
            console.log('✅ React app container found');
          } else {
            console.log('⚠️  React app container not found');
          }
          
          // Check for common JavaScript errors
          if (content.includes('Uncaught Error') || content.includes('ERR_')) {
            console.log('⚠️  JavaScript errors detected in page');
          }
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      resolve();
    });
  });
}

async function testApi(url) {
  return new Promise((resolve) => {
    console.log(`\n=== Testing API at ${url} ===`);
    
    const req = https.get(url, { 
      headers: { 'Accept': 'application/json' },
      timeout: 10000 
    }, (res) => {
      let data = [];
      
      console.log(`Status: ${res.statusCode} ${res.statusMessage || ''}`.trim());
      console.log('Headers:', JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => data.push(chunk));
      
      res.on('end', () => {
        try {
          const json = JSON.parse(Buffer.concat(data).toString());
          console.log('API Response:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('Raw Response:', Buffer.concat(data).toString());
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('API request error:', error.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.error('API request timed out');
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  console.log('Starting frontend tests...');
  
  // Test production frontend
  await testUrl(PROD_URL + '/#/login');
  await testUrl(PROD_URL + '/');
  
  // Test deployment frontend
  await testUrl(DEPLOYMENT_URL + '/#/login');
  await testUrl(DEPLOYMENT_URL + '/');
  
  // Test API endpoints
  await testApi(PROD_URL + '/api/auth');
  await testApi(DEPLOYMENT_URL + '/api/auth');
  
  console.log('\nTests completed');
}

runTests().catch(console.error);
