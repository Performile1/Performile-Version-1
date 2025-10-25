# ============================================================================
# RUN PLAYWRIGHT TESTS AGAINST VERCEL DEPLOYMENT
# ============================================================================
# Purpose: Execute E2E tests against live Vercel deployment
# Date: October 23, 2025
# Framework: Playwright
# ============================================================================

Write-Host ""
Write-Host "🎭 PLAYWRIGHT TESTS - VERCEL DEPLOYMENT" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check environment
# ============================================================================

Write-Host "📋 Checking environment..." -ForegroundColor Yellow

# Load test environment variables
if (Test-Path ".env.test") {
    Write-Host "✅ Found .env.test" -ForegroundColor Green
    Get-Content .env.test | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
} else {
    Write-Host "⚠️  .env.test not found, using defaults" -ForegroundColor Yellow
}

$baseUrl = $env:BASE_URL
if (-not $baseUrl) {
    $baseUrl = "https://frontend-two-swart-31.vercel.app"
}

Write-Host "🌐 Testing against: $baseUrl" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 2: Check if site is accessible
# ============================================================================

Write-Host "🔍 Checking if site is accessible..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Head -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Site is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Site returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Cannot reach site: $_" -ForegroundColor Red
    Write-Host "   Tests may fail due to connectivity issues" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# STEP 3: Run tests
# ============================================================================

Write-Host "🧪 Running Playwright tests..." -ForegroundColor Yellow
Write-Host ""

# Set environment variable for Playwright
$env:BASE_URL = $baseUrl

# Run tests with increased timeouts
npx playwright test --config=playwright.config.ts

$exitCode = $LASTEXITCODE

Write-Host ""

# ============================================================================
# STEP 4: Show results
# ============================================================================

if ($exitCode -eq 0) {
    Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 View detailed report:" -ForegroundColor Cyan
    Write-Host "   npm run test:e2e:report" -ForegroundColor White
} else {
    Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📊 View detailed report:" -ForegroundColor Cyan
    Write-Host "   npm run test:e2e:report" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Vercel cold start (first request slow)" -ForegroundColor Gray
    Write-Host "   2. API rate limiting" -ForegroundColor Gray
    Write-Host "   3. Database connection timeout" -ForegroundColor Gray
    Write-Host "   4. Missing environment variables" -ForegroundColor Gray
    Write-Host "   5. CORS issues" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🎭 Test run complete!" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
