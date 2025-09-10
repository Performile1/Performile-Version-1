// This script helps verify environment variables and configuration
console.log('Environment Configuration Check');
console.log('============================');

// Check required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV'
];

console.log('\nChecking required environment variables:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  const status = value ? '✓' : '✗';
  console.log(`${status} ${envVar}: ${value ? '***' + value.slice(-4) : 'Not set'}`);
});

// Check database connectivity if DATABASE_URL is set
if (process.env.DATABASE_URL) {
  console.log('\nTesting database connectivity...');
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Database connection successful');
      console.log('   Current database time:', res.rows[0].now);
    }
    pool.end();
  });
} else {
  console.log('\nSkipping database connectivity check - DATABASE_URL not set');
}

// Check API endpoint
console.log('\nTesting API endpoint...');
const https = require('https');
const options = {
  hostname: 'performile-platform.vercel.app',
  port: 443,
  path: '/api/auth',
  method: 'GET',
  timeout: 10000
};

const req = https.request(options, (res) => {
  console.log(`\nAPI Endpoint Status: ${res.statusCode}`);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', (error) => {
  console.error('API request failed:', error.message);
});

req.on('timeout', () => {
  req.destroy();
  console.error('API request timed out');
});

req.end();
