const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

// Ensure environment variables are loaded
require('dotenv').config();

// Set NODE_ENV to production if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install --prefer-offline', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  // Install production dependencies
  console.log('🔧 Installing production dependencies...');
  execSync('npm install --production --prefer-offline', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Run the build
  console.log('🔨 Running build...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  console.log('✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:');
  console.error(error);
  process.exit(1);
}
