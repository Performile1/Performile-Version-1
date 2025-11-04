# Test Courier Credentials Feature
# PowerShell script to run Playwright tests for courier credentials

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COURIER CREDENTIALS - E2E TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:BASE_URL = "https://frontend-two-swart-31.vercel.app"
$env:TEST_MERCHANT_PASSWORD = "TestPassword123!"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Base URL: $env:BASE_URL" -ForegroundColor Gray
Write-Host "  Test User: merchant@performile.com" -ForegroundColor Gray
Write-Host "  Testing on: Vercel Deployment" -ForegroundColor Green
Write-Host ""

# Ask which tests to run
Write-Host "Select test mode:" -ForegroundColor Yellow
Write-Host "  1. Run all courier credentials tests" -ForegroundColor Gray
Write-Host "  2. Run specific test (interactive)" -ForegroundColor Gray
Write-Host "  3. Run in headed mode (see browser)" -ForegroundColor Gray
Write-Host "  4. Run in debug mode" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Running all courier credentials tests..." -ForegroundColor Green
        npx playwright test tests/e2e/courier-credentials.spec.ts
    }
    "2" {
        Write-Host ""
        Write-Host "Available tests:" -ForegroundColor Yellow
        Write-Host "  1. Navigation test" -ForegroundColor Gray
        Write-Host "  2. View selected couriers" -ForegroundColor Gray
        Write-Host "  3. Add credentials modal" -ForegroundColor Gray
        Write-Host "  4. Form validation" -ForegroundColor Gray
        Write-Host "  5. Test connection" -ForegroundColor Gray
        Write-Host "  6. Save credentials" -ForegroundColor Gray
        Write-Host "  7. Edit credentials" -ForegroundColor Gray
        Write-Host "  8. API endpoints" -ForegroundColor Gray
        Write-Host "  9. Error handling" -ForegroundColor Gray
        Write-Host "  10. Multiple couriers" -ForegroundColor Gray
        Write-Host ""
        
        $testChoice = Read-Host "Enter test number (1-10)"
        
        $testNames = @{
            "1" = "should navigate to courier settings from dashboard"
            "2" = "should display list of selected couriers"
            "3" = "should open credentials modal when clicking Add Credentials"
            "4" = "should validate credentials form fields"
            "5" = "should test courier connection"
            "6" = "should save credentials and update status"
            "7" = "should edit existing credentials"
            "8" = "should call correct API endpoints"
            "9" = "should handle API errors gracefully"
            "10" = "should manage credentials for multiple couriers"
        }
        
        if ($testNames.ContainsKey($testChoice)) {
            $testName = $testNames[$testChoice]
            Write-Host ""
            Write-Host "Running: $testName" -ForegroundColor Green
            npx playwright test tests/e2e/courier-credentials.spec.ts -g "$testName"
        } else {
            Write-Host "Invalid choice" -ForegroundColor Red
            exit 1
        }
    }
    "3" {
        Write-Host ""
        Write-Host "Running in headed mode (browser visible)..." -ForegroundColor Green
        npx playwright test tests/e2e/courier-credentials.spec.ts --headed
    }
    "4" {
        Write-Host ""
        Write-Host "Running in debug mode..." -ForegroundColor Green
        Write-Host "Use Playwright Inspector to step through tests" -ForegroundColor Yellow
        npx playwright test tests/e2e/courier-credentials.spec.ts --debug
    }
    default {
        Write-Host "Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tests completed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
