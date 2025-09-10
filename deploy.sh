#!/bin/bash
set -e

echo "🚀 Starting Performile deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "You need to log in to Vercel first. Please run 'vercel login'"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod --confirm

echo "✅ Deployment complete!"
echo "🔗 Your application is now live at: https://performile.vercel.app"
