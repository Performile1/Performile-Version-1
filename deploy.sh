#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Performile deployment..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Set environment variables
export NODE_ENV=production

# Build the frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --confirm

echo "✅ Deployment complete!"
echo "🔗 Production URL: https://performile-platform.vercel.app"
