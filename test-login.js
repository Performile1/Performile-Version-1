const axios = require('axios');
require('dotenv').config();

async function testLogin() {
  try {
    const response = await axios.post('https://performile-platform.vercel.app/api/auth/login', {
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Login successful!');
    console.log('Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Login failed with status:', error.response.status);
      console.error('Error details:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
