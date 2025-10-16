# Performile Setup Script
# This script sets up the development environment for Performile

Write-Host "🚀 Setting up Performile Development Environment..." -ForegroundColor Green

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 22+ first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites check passed" -ForegroundColor Green

# Create necessary directories
$directories = @("logs", "uploads", "ssl")
foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
        Write-Host "📁 Created directory: $dir" -ForegroundColor Yellow
    }
}

# Copy environment file if it doesn't exist
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "📋 Created .env file from .env.example" -ForegroundColor Yellow
        Write-Host "⚠️  Please update the .env file with your actual configuration values" -ForegroundColor Yellow
    }
}

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Build Docker images
Write-Host "🐳 Building Docker images..." -ForegroundColor Blue
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker images" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env file with your configuration" -ForegroundColor White
Write-Host "2. Run 'docker-compose up' to start the services" -ForegroundColor White
Write-Host "3. Initialize the database with 'npm run db:setup'" -ForegroundColor White
Write-Host "4. Access the application at http://localhost" -ForegroundColor White
