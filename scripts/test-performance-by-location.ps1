# Performance By Location - Playwright Test Runner
# Week 2 Day 4 - November 6, 2025

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Performance By Location - E2E Tests" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check if Playwright browsers are installed
Write-Host "Checking Playwright browsers..." -ForegroundColor Yellow
npx playwright install --with-deps chromium firefox webkit

Write-Host ""
Write-Host "Select test mode:" -ForegroundColor Green
Write-Host "1. Run all tests (headless)" -ForegroundColor White
Write-Host "2. Run specific test (headless)" -ForegroundColor White
Write-Host "3. Run all tests (headed - see browser)" -ForegroundColor White
Write-Host "4. Run specific test (headed)" -ForegroundColor White
Write-Host "5. Debug mode (headed + slow)" -ForegroundColor White
Write-Host "6. Run on specific browser only" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (1-6)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running all Performance By Location tests (headless)..." -ForegroundColor Green
        npx playwright test tests/e2e/performance-by-location.spec.ts
    }
    "2" {
        Write-Host ""
        Write-Host "Available tests:" -ForegroundColor Yellow
        Write-Host "1. Admin: Full access test" -ForegroundColor White
        Write-Host "2. Admin: Country selector test" -ForegroundColor White
        Write-Host "3. Admin: Time range selector test" -ForegroundColor White
        Write-Host "4. Merchant: Subscription limits test" -ForegroundColor White
        Write-Host "5. Courier: Subscription limits test" -ForegroundColor White
        Write-Host "6. Data table display test" -ForegroundColor White
        Write-Host "7. Loading state test" -ForegroundColor White
        Write-Host "8. Error handling test" -ForegroundColor White
        Write-Host "9. Navigation test" -ForegroundColor White
        Write-Host "10. Mobile responsive test" -ForegroundColor White
        Write-Host ""
        
        $testChoice = Read-Host "Enter test number (1-10)"
        
        $testNames = @{
            "1" = "Admin: Should see PerformanceByLocation with full access"
            "2" = "Admin: Should be able to select different countries"
            "3" = "Admin: Should be able to change time range"
            "4" = "Merchant: Should see PerformanceByLocation with subscription limits"
            "5" = "Courier: Should see PerformanceByLocation with subscription limits"
            "6" = "Should display data table when data is available"
            "7" = "Should show loading state initially"
            "8" = "Should handle API errors gracefully"
            "9" = "Navigation: Should be in Market Insights tab"
            "10" = "Responsive: Should work on mobile viewport"
        }
        
        $testName = $testNames[$testChoice]
        Write-Host ""
        Write-Host "Running test: $testName" -ForegroundColor Green
        npx playwright test tests/e2e/performance-by-location.spec.ts -g "$testName"
    }
    "3" {
        Write-Host ""
        Write-Host "Running all tests (headed - you'll see the browser)..." -ForegroundColor Green
        npx playwright test tests/e2e/performance-by-location.spec.ts --headed
    }
    "4" {
        Write-Host ""
        Write-Host "Available tests:" -ForegroundColor Yellow
        Write-Host "1. Admin: Full access test" -ForegroundColor White
        Write-Host "2. Admin: Country selector test" -ForegroundColor White
        Write-Host "3. Admin: Time range selector test" -ForegroundColor White
        Write-Host "4. Merchant: Subscription limits test" -ForegroundColor White
        Write-Host "5. Courier: Subscription limits test" -ForegroundColor White
        Write-Host ""
        
        $testChoice = Read-Host "Enter test number (1-5)"
        
        $testNames = @{
            "1" = "Admin: Should see PerformanceByLocation with full access"
            "2" = "Admin: Should be able to select different countries"
            "3" = "Admin: Should be able to change time range"
            "4" = "Merchant: Should see PerformanceByLocation with subscription limits"
            "5" = "Courier: Should see PerformanceByLocation with subscription limits"
        }
        
        $testName = $testNames[$testChoice]
        Write-Host ""
        Write-Host "Running test: $testName (headed)" -ForegroundColor Green
        npx playwright test tests/e2e/performance-by-location.spec.ts -g "$testName" --headed
    }
    "5" {
        Write-Host ""
        Write-Host "Running in debug mode (headed + slow motion)..." -ForegroundColor Green
        Write-Host "This will open Playwright Inspector for step-by-step debugging" -ForegroundColor Yellow
        npx playwright test tests/e2e/performance-by-location.spec.ts --debug
    }
    "6" {
        Write-Host ""
        Write-Host "Select browser:" -ForegroundColor Yellow
        Write-Host "1. Chromium" -ForegroundColor White
        Write-Host "2. Firefox" -ForegroundColor White
        Write-Host "3. WebKit (Safari)" -ForegroundColor White
        Write-Host ""
        
        $browserChoice = Read-Host "Enter browser number (1-3)"
        
        $browsers = @{
            "1" = "chromium"
            "2" = "firefox"
            "3" = "webkit"
        }
        
        $browser = $browsers[$browserChoice]
        Write-Host ""
        Write-Host "Running tests on $browser..." -ForegroundColor Green
        npx playwright test tests/e2e/performance-by-location.spec.ts --project=$browser
    }
    default {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Test run complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view the HTML report, run:" -ForegroundColor Yellow
Write-Host "npx playwright show-report" -ForegroundColor White
Write-Host ""
