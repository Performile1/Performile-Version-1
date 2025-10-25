# ============================================================================
# PLAYWRIGHT SETUP SCRIPT
# ============================================================================
# Date: October 23, 2025
# Purpose: Quick setup for Playwright E2E testing
# Time: 5-10 minutes
# ============================================================================

Write-Host "🎭 Performile Platform - Playwright Setup" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check Node.js
# ============================================================================

Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow

$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: Install Playwright
# ============================================================================

Write-Host "🎭 Installing Playwright..." -ForegroundColor Yellow

npm install -D @playwright/test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install Playwright!" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Playwright installed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 3: Install Browsers
# ============================================================================

Write-Host "🌐 Installing browsers (Chrome, Firefox, Safari)..." -ForegroundColor Yellow
Write-Host "  ⏳ This may take 2-3 minutes..." -ForegroundColor Gray

npx playwright install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install browsers!" -ForegroundColor Red
    exit 1
}

Write-Host "  ✅ Browsers installed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 4: Update package.json
# ============================================================================

Write-Host "📝 Updating package.json scripts..." -ForegroundColor Yellow

$packageJsonPath = "package.json"

if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Add test scripts if they don't exist
    if (-not $packageJson.scripts) {
        $packageJson | Add-Member -MemberType NoteProperty -Name "scripts" -Value @{}
    }
    
    $scriptsToAdd = @{
        "test:e2e" = "playwright test"
        "test:e2e:ui" = "playwright test --ui"
        "test:e2e:headed" = "playwright test --headed"
        "test:e2e:debug" = "playwright test --debug"
        "test:e2e:report" = "playwright show-report"
    }
    
    foreach ($script in $scriptsToAdd.GetEnumerator()) {
        if (-not $packageJson.scripts.PSObject.Properties[$script.Key]) {
            $packageJson.scripts | Add-Member -MemberType NoteProperty -Name $script.Key -Value $script.Value -Force
            Write-Host "  ✅ Added script: $($script.Key)" -ForegroundColor Green
        } else {
            Write-Host "  ⏭️  Script exists: $($script.Key)" -ForegroundColor Gray
        }
    }
    
    # Save updated package.json
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    
    Write-Host "  ✅ package.json updated" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  package.json not found in current directory" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 5: Create .env.test
# ============================================================================

Write-Host "🔐 Creating .env.test file..." -ForegroundColor Yellow

$envTestPath = ".env.test"

if (-not (Test-Path $envTestPath)) {
    $envContent = @"
# Playwright Test Environment Variables
# Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Base URL (change for different environments)
BASE_URL=https://frontend-two-swart-31.vercel.app

# Test Users (create these in your database)
TEST_MERCHANT_EMAIL=test-merchant@performile.com
TEST_MERCHANT_PASSWORD=TestPassword123!

TEST_COURIER_EMAIL=test-courier@performile.com
TEST_COURIER_PASSWORD=TestPassword123!
"@
    
    Set-Content -Path $envTestPath -Value $envContent
    Write-Host "  ✅ .env.test created" -ForegroundColor Green
} else {
    Write-Host "  ⏭️  .env.test already exists" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# STEP 6: Summary
# ============================================================================

Write-Host "📊 Setup Summary:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  ✅ Playwright installed" -ForegroundColor Green
Write-Host "  ✅ Browsers installed (Chrome, Firefox, Safari)" -ForegroundColor Green
Write-Host "  ✅ Test scripts added to package.json" -ForegroundColor Green
Write-Host "  ✅ .env.test created" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 7: Next Steps
# ============================================================================

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Create test users in your database:" -ForegroundColor White
Write-Host "     - test-merchant@performile.com" -ForegroundColor Gray
Write-Host "     - test-courier@performile.com" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Run tests:" -ForegroundColor White
Write-Host "     npm run test:e2e:ui        # UI mode (recommended)" -ForegroundColor Gray
Write-Host "     npm run test:e2e           # Headless mode" -ForegroundColor Gray
Write-Host "     npm run test:e2e:headed    # Headed mode" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. View results:" -ForegroundColor White
Write-Host "     npm run test:e2e:report    # Open HTML report" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# STEP 8: Quick Test
# ============================================================================

Write-Host "🧪 Would you like to run a quick test now? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "🎭 Running Playwright tests in UI mode..." -ForegroundColor Cyan
    Write-Host ""
    
    npm run test:e2e:ui
} else {
    Write-Host ""
    Write-Host "✅ Setup complete! Run 'npm run test:e2e:ui' when ready." -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Playwright setup complete!" -ForegroundColor Green
Write-Host ""

# ============================================================================
# END OF SCRIPT
# ============================================================================
