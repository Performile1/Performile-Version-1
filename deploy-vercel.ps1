# Deploy to Vercel Script
# Run this script to deploy Performile to Vercel

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Vercel CLI is not installed. Installing now..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login to Vercel if not already logged in
if (-not (vercel whoami 2>&1 | Select-String -Pattern "Vercel")) {
    Write-Host "Please log in to Vercel..." -ForegroundColor Cyan
    vercel login
}

# Set environment variables
$env:NODE_ENV = "production"

# Deploy to Vercel
Write-Host "🚀 Deploying Performile to Vercel..." -ForegroundColor Cyan

# Deploy frontend
Set-Location frontend
vercel --prod --confirm

# Get the deployment URL
$deploymentUrl = vercel ls --prod | Select-String -Pattern "https" | Select-Object -First 1

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app is live at: $deploymentUrl" -ForegroundColor Green

# Return to root directory
Set-Location ..
