# PowerShell script to deploy Performile to Vercel

# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Performile deployment..." -ForegroundColor Cyan

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Set environment variables
$env:NODE_ENV = "production"

# Build the frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Cyan
Set-Location frontend
npm install
npm run build
Set-Location ..

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod --confirm

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔗 Production URL: https://performile-platform.vercel.app" -ForegroundColor Green
