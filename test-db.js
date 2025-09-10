console.log('Starting test...');
console.log('Environment variables loaded:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set',
  NODE_PATH: process.env.NODE_PATH || 'Not set'
});

// Try to require dotenv
let dotenv;
try {
  dotenv = require('dotenv');
  console.log('dotenv loaded successfully');
} catch (err) {
  console.error('Error loading dotenv:', err);
  process.exit(1);
}

// Load .env file
dotenv.config();

console.log('Environment variables after dotenv:', {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  SUPABASE_URL: process.env.SUPABASE_URL ? 'Set' : 'Not set'
});
