const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
try {
  // Install all dependencies
  execSync('cd frontend && npm install --prefer-offline', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  // Build the frontend
  console.log('🔨 Building frontend...');
  execSync('cd frontend && npm run build', { 
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
