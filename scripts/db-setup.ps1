# Database Setup Script for Performile
# This script initializes the PostgreSQL database with schema and seed data

Write-Host "🗄️ Setting up Performile Database..." -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>$null
if (!$dockerRunning) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start PostgreSQL container if not running
Write-Host "🐳 Starting PostgreSQL container..." -ForegroundColor Blue
docker-compose up -d database
Start-Sleep -Seconds 10

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    $result = docker-compose exec -T database pg_isready -U performile_user 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is ready!" -ForegroundColor Green
        break
    }
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ PostgreSQL failed to start within timeout" -ForegroundColor Red
        exit 1
    }
    Start-Sleep -Seconds 2
} while ($true)

# Create the database if it doesn't exist
Write-Host "🏗️ Creating database..." -ForegroundColor Blue
docker-compose exec -T database psql -U performile_user -d postgres -c "CREATE DATABASE performile;" 2>$null

# Run database schema
Write-Host "📋 Creating database schema..." -ForegroundColor Blue
Get-Content "database/schema.sql" | docker-compose exec -T database psql -U performile_user -d performile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create database schema" -ForegroundColor Red
    exit 1
}

# Run TrustScore functions
Write-Host "⚙️ Installing TrustScore functions..." -ForegroundColor Blue
Get-Content "database/trustscore_functions.sql" | docker-compose exec -T database psql -U performile_user -d performile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install TrustScore functions" -ForegroundColor Red
    exit 1
}

# Load seed data
Write-Host "🌱 Loading seed data..." -ForegroundColor Blue
Get-Content "database/seed_data.sql" | docker-compose exec -T database psql -U performile_user -d performile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to load seed data" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Database is ready with:" -ForegroundColor Cyan
Write-Host "- Complete schema with all tables and indexes" -ForegroundColor White
Write-Host "- Advanced TrustScore calculation functions" -ForegroundColor White
Write-Host "- Sample data for testing (admin, merchants, couriers, consumers)" -ForegroundColor White
Write-Host "- Default subscription plans and rating configurations" -ForegroundColor White
