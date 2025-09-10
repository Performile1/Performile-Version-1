require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check for required environment variables
const requiredVars = [
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'DATABASE_URL'
];

// Verify all required environment variables are set
const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
}

console.log('🚀 Starting Vercel deployment...');

// Create a temporary .env file for Vercel
const envContent = `# Auto-generated for Vercel deployment
NODE_ENV=production
VERCEL_ENV=production

# Database
DATABASE_URL=${process.env.DATABASE_URL}
SUPABASE_URL=${process.env.SUPABASE_URL}
SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE=${process.env.SUPABASE_SERVICE_ROLE}

# Authentication
JWT_SECRET=${process.env.JWT_SECRET}
JWT_REFRESH_SECRET=${process.env.JWT_REFRESH_SECRET}

# Frontend
VITE_API_URL=/api
VITE_SUPABASE_URL=${process.env.SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}

# Security
NEXT_TELEMETRY_DISABLED=1
`;

// Write the .env file
fs.writeFileSync(path.join(__dirname, '..', '.env.production'), envContent);
console.log('✅ Created .env.production file');

// Run Vercel deployment
try {
  console.log('🚀 Deploying to Vercel...');
  
  // Link to Vercel project if not already linked
  if (!fs.existsSync(path.join(__dirname, '..', '.vercel'))) {
    execSync('npx vercel link --yes', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
  }

  // Deploy to Vercel
  execSync('npx vercel --prod --confirm', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      VERCEL_ORG_ID: process.env.VERCEL_ORG_ID,
      VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID
    }
  });

  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
} finally {
  // Clean up
  if (fs.existsSync(path.join(__dirname, '..', '.env.production'))) {
    fs.unlinkSync(path.join(__dirname, '..', '.env.production'));
  }
}
