const fetch = require('node-fetch');

async function testEndpoint(url, options = {}) {
  try {
    console.log(`\nTesting ${options.method || 'GET'} ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'NodeJS Test Script',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: 10000
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        console.log('Response (JSON):', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('Response (text):', text);
      }
    } catch (e) {
      console.error('Error reading response:', e);
    }
    
    return response;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

async function runTests() {
  const baseUrl = 'https://performile-platform-yhep.vercel.app';
  
  try {
    // Test root endpoint
    await testEndpoint(`${baseUrl}/`);
    
    // Test API endpoint
    await testEndpoint(`${baseUrl}/api`);
    
    // Test auth endpoint
    await testEndpoint(`${baseUrl}/api/auth`);
    
    // Test login with invalid credentials
    await testEndpoint(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Install node-fetch if not already installed
if (!require('node-fetch')) {
  console.log('Installing node-fetch...');
  const { execSync } = require('child_process');
  execSync('npm install node-fetch', { stdio: 'inherit' });
  console.log('node-fetch installed. Please run the script again.');
} else {
  runTests();
}
