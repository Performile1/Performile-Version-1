# ============================================================================
# SETUP PLAYWRIGHT TEST USERS
# ============================================================================
# Purpose: Automated script to create test users via Playwright
# Date: October 23, 2025, 10:55 AM
# Framework: SPEC_DRIVEN_FRAMEWORK v1.21
# ============================================================================

Write-Host ""
Write-Host "🎭 PLAYWRIGHT TEST USER SETUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Check if Playwright is installed
# ============================================================================

Write-Host "📦 Checking Playwright installation..." -ForegroundColor Yellow

if (!(Test-Path "node_modules/@playwright")) {
    Write-Host "❌ Playwright not found!" -ForegroundColor Red
    Write-Host "   Installing Playwright..." -ForegroundColor Gray
    npm install -D @playwright/test
    npx playwright install
}

Write-Host "✅ Playwright is installed" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: Create test users via signup flow
# ============================================================================

Write-Host "👤 Creating test users..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Running: npx playwright test setup/create-test-users.spec.ts" -ForegroundColor Gray
npx playwright test setup/create-test-users.spec.ts --project=chromium

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Test users created successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some tests failed. This might be okay if users already exist." -ForegroundColor Yellow
    Write-Host "   Check the output above for details." -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# STEP 3: Create authentication sessions
# ============================================================================

Write-Host "🔐 Creating authentication sessions..." -ForegroundColor Yellow
Write-Host ""

Write-Host "   Running: npx playwright test setup/auth.setup.ts" -ForegroundColor Gray
npx playwright test setup/auth.setup.ts --project=chromium

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Auth sessions created!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Failed to create auth sessions" -ForegroundColor Red
    Write-Host "   This means test users might not exist or login failed." -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 FALLBACK OPTION:" -ForegroundColor Yellow
    Write-Host "   Run the SQL script instead:" -ForegroundColor White
    Write-Host "   database/CREATE_PLAYWRIGHT_TEST_USERS.sql" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 4: Verify setup
# ============================================================================

Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 What was created:" -ForegroundColor Yellow
Write-Host "   ✅ test-merchant@performile.com" -ForegroundColor White
Write-Host "   ✅ test-courier@performile.com" -ForegroundColor White
Write-Host "   ✅ Merchant auth session (tests/e2e/.auth/merchant.json)" -ForegroundColor White
Write-Host "   ✅ Courier auth session (tests/e2e/.auth/courier.json)" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Email: test-merchant@performile.com" -ForegroundColor White
Write-Host "   Email: test-courier@performile.com" -ForegroundColor White
Write-Host "   Password: TestPassword123!" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Run tests: npm run test:e2e" -ForegroundColor White
Write-Host "   2. Or UI mode: npm run test:e2e:ui" -ForegroundColor White
Write-Host "   3. View report: npm run test:e2e:report" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Expected: ~50-100 more tests should pass now!" -ForegroundColor Green
Write-Host ""
