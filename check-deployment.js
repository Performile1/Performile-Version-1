const https = require('https');

// Test the root endpoint
function testRoot() {
  return new Promise((resolve) => {
    const req = https.get('https://performile-platform-yhep.vercel.app', (res) => {
      console.log('Root endpoint status:', res.statusCode);
      resolve();
    });
    
    req.on('error', (e) => {
      console.error('Error testing root:', e.message);
      resolve();
    });
  });
}

// Test the API endpoint
function testApi() {
  return new Promise((resolve) => {
    const req = https.get('https://performile-platform-yhep.vercel.app/api/auth', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('API endpoint status:', res.statusCode);
        console.log('Response:', data);
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error('Error testing API:', e.message);
      resolve();
    });
  });
}

// Run tests
async function runTests() {
  console.log('Testing deployment...');
  await testRoot();
  await testApi();
  console.log('Tests completed');
}

runTests();
