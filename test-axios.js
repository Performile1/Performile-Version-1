const axios = require('axios');

const BASE_URL = 'https://performile-platform-yhep.vercel.app';

async function testEndpoint(method, path, data = null) {
  const url = `${BASE_URL}${path}`;
  console.log(`\n${method} ${url}`);
  
  try {
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NodeJS Test Script'
      },
      timeout: 10000,
      validateStatus: () => true // Don't throw on HTTP error status
    });
    
    console.log(`Status: ${response.status} ${response.statusText || ''}`.trim());
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.data) {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
    return response;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response error:', error.response.status, error.response.statusText);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.message);
    } else {
      // Something happened in setting up the request
      console.error('Request error:', error.message);
    }
    throw error;
  }
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
    console.error('Test failed:', error);
  }
}

// Install axios if not already installed
if (!require('axios')) {
  console.log('Installing axios...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
  console.log('axios installed. Please run the script again.');
} else {
  runTests();
}
